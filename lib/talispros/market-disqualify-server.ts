import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { recordFastCodeUpdate } from "@/lib/talispros/fast-code-tracker-server";
import {
  marketSourceGaps,
  normalizeDisqualifyReason,
  type MarketSourceGap,
} from "@/lib/talispros/market-disqualify";

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

export type ActiveDisqualification = {
  id: string;
  fastCode: string | null;
  prospectQueueId: string | null;
  market: string;
  brokerage: string;
  reason: string;
  actorName: string;
  actorRole: "agent" | "superadmin";
  createdAt: string;
};

type DisqRow = {
  id: string;
  fast_code: string | null;
  prospect_queue_id: string | null;
  market: string | null;
  brokerage: string | null;
  reason: string | null;
  actor_name: string | null;
  actor_role: string | null;
  created_at: string;
};

function toActive(row: DisqRow): ActiveDisqualification {
  return {
    id: row.id,
    fastCode: row.fast_code,
    prospectQueueId: row.prospect_queue_id,
    market: row.market?.trim() || "",
    brokerage: row.brokerage?.trim() || "",
    reason: row.reason?.trim() || "",
    actorName: row.actor_name?.trim() || "",
    actorRole: row.actor_role === "superadmin" ? "superadmin" : "agent",
    createdAt: row.created_at,
  };
}

export async function listActiveDisqualifications(): Promise<ActiveDisqualification[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const { data, error } = await db()
    .from("market_brokerage_disqualifications")
    .select("id, fast_code, prospect_queue_id, market, brokerage, reason, actor_name, actor_role, created_at")
    .is("reversed_at", null)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as DisqRow[]).map(toActive);
}

export async function activeDisqualifiedFastCodes(): Promise<Set<string>> {
  const rows = await listActiveDisqualifications();
  return new Set(rows.map((row) => row.fastCode).filter((code): code is string => Boolean(code)));
}

export async function disqualificationForFastCode(fastCode: string): Promise<ActiveDisqualification | null> {
  const code = fastCode.trim().toLowerCase();
  if (!code || !isSupabaseAdminConfigured()) return null;
  const { data, error } = await db()
    .from("market_brokerage_disqualifications")
    .select("id, fast_code, prospect_queue_id, market, brokerage, reason, actor_name, actor_role, created_at")
    .eq("fast_code", code)
    .is("reversed_at", null)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return toActive(data as DisqRow);
}

/** Public Mapsite pages use this. Missing config or a lookup error leaves the page visible. */
export async function isFastCodeDisqualified(fastCode: string | null | undefined): Promise<boolean> {
  const code = fastCode?.trim().toLowerCase() || "";
  if (!code) return false;
  try {
    return Boolean(await disqualificationForFastCode(code));
  } catch {
    return false;
  }
}

type QueueRow = {
  id: string;
  market: string | null;
  status: string | null;
  proposed_code: string | null;
  brokerage: string | null;
};

export async function listMarketSourceGaps(): Promise<MarketSourceGap[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const [queueRes, active] = await Promise.all([
    db().from("prospect_queue").select("id, market, status, proposed_code, brokerage"),
    listActiveDisqualifications(),
  ]);
  if (queueRes.error) return [];
  const byQueue = new Set(active.map((row) => row.prospectQueueId).filter((id): id is string => Boolean(id)));
  const byCode = new Set(active.map((row) => row.fastCode).filter((code): code is string => Boolean(code)));
  const rows = ((queueRes.data ?? []) as QueueRow[]).map((row) => {
    const code = row.proposed_code?.trim().toLowerCase() || null;
    return {
      id: row.id,
      market: row.market?.trim() || "",
      status: row.status || "pending",
      fastCode: code,
      disqualified: byQueue.has(row.id) || (code ? byCode.has(code) : false),
    };
  });
  return listMarketSourceGapsFrom(rows);
}

function listMarketSourceGapsFrom(
  rows: { id: string; market: string; status: string; fastCode: string | null; disqualified: boolean }[],
): MarketSourceGap[] {
  return marketSourceGaps(rows);
}

export async function disqualifyBrokerage(input: {
  fastCode?: string | null;
  prospectQueueId?: string | null;
  reason: string;
  actorName: string;
  actorRole: "agent" | "superadmin";
  actorId?: string | null;
}): Promise<{ ok: true; market: string; qualified: number; needsNext: boolean } | { ok: false; error: "invalid" | "missing" | "failed" }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "failed" };
  const reason = normalizeDisqualifyReason(input.reason);
  if (!reason) return { ok: false, error: "invalid" };
  const requestedCode = input.fastCode?.trim().toLowerCase() || "";
  const queueId = input.prospectQueueId?.trim() || "";

  let fastCode = requestedCode;
  let prospectQueueId: string | null = queueId || null;
  let market = "";
  let brokerage = "";

  if (queueId) {
    const { data } = await db()
      .from("prospect_queue")
      .select("id, brokerage, market, proposed_code")
      .eq("id", queueId)
      .maybeSingle();
    const row = data as { id: string; brokerage: string | null; market: string | null; proposed_code: string | null } | null;
    if (!row) return { ok: false, error: "missing" };
    brokerage = row.brokerage?.trim() || brokerage;
    market = row.market?.trim() || market;
    prospectQueueId = row.id;
    if (!fastCode && row.proposed_code) fastCode = row.proposed_code.trim().toLowerCase();
  }

  if (fastCode) {
    const { data } = await db()
      .from("prospect_queue")
      .select("id, brokerage, market, proposed_code")
      .ilike("proposed_code", fastCode)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const row = data as { id: string; brokerage: string | null; market: string | null } | null;
    if (row) {
      brokerage = brokerage || row.brokerage?.trim() || "";
      market = market || row.market?.trim() || "";
      prospectQueueId = prospectQueueId || row.id;
    }
    const { data: tracked } = await db()
      .from("fast_code_status")
      .select("fast_code, mapsites(property_title)")
      .eq("fast_code", fastCode)
      .maybeSingle();
    const status = tracked as { mapsites?: { property_title?: string | null } | { property_title?: string | null }[] | null } | null;
    const mapsite = Array.isArray(status?.mapsites) ? status?.mapsites[0] : status?.mapsites;
    brokerage = brokerage || mapsite?.property_title?.trim() || fastCode.toUpperCase();
  }

  if (!fastCode && !prospectQueueId) return { ok: false, error: "missing" };
  if (!brokerage) brokerage = fastCode ? fastCode.toUpperCase() : "Brokerage";

  const existing = fastCode ? await disqualificationForFastCode(fastCode) : null;
  if (existing) {
    const gaps = await listMarketSourceGaps();
    const gap = gaps.find((item) => item.market === existing.market);
    return { ok: true, market: existing.market, qualified: gap?.qualified ?? 0, needsNext: gap?.needsNext ?? false };
  }

  const { error } = await db().from("market_brokerage_disqualifications").insert({
    fast_code: fastCode || null,
    prospect_queue_id: prospectQueueId,
    market,
    brokerage,
    reason,
    actor_name: input.actorName.trim() || "Unknown",
    actor_role: input.actorRole,
    actor_id: input.actorId ?? null,
  });
  if (error) return { ok: false, error: "failed" };

  if (fastCode) {
    await recordFastCodeUpdate({
      fastCode,
      eventType: "disqualified",
      note: reason,
      details: { market, brokerage, actorRole: input.actorRole },
      createdBy: input.actorName,
    });
  }

  const gaps = await listMarketSourceGaps();
  const gap = gaps.find((item) => item.market === market);
  return {
    ok: true,
    market,
    qualified: gap?.qualified ?? 0,
    needsNext: market ? (gap?.needsNext ?? true) : false,
  };
}

export async function restoreBrokerage(input: {
  fastCode?: string | null;
  prospectQueueId?: string | null;
  reason?: string | null;
  actorName: string;
}): Promise<{ ok: true } | { ok: false; error: "missing" | "failed" }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "failed" };
  const fastCode = input.fastCode?.trim().toLowerCase() || "";
  const queueId = input.prospectQueueId?.trim() || "";
  if (!fastCode && !queueId) return { ok: false, error: "missing" };
  let query = db()
    .from("market_brokerage_disqualifications")
    .update({
      reversed_at: new Date().toISOString(),
      reversed_by: input.actorName.trim() || "Global Admin",
      reversed_reason: normalizeDisqualifyReason(input.reason || "") || null,
    })
    .is("reversed_at", null);
  query = fastCode ? query.eq("fast_code", fastCode) : query.eq("prospect_queue_id", queueId);
  const { data, error } = await query.select("fast_code, market, brokerage");
  if (error) return { ok: false, error: "failed" };
  const restored = (data ?? []) as { fast_code: string | null; market: string | null; brokerage: string | null }[];
  if (!restored.length) return { ok: false, error: "missing" };
  for (const row of restored) {
    if (!row.fast_code) continue;
    await recordFastCodeUpdate({
      fastCode: row.fast_code,
      eventType: "requalified",
      note: normalizeDisqualifyReason(input.reason || "") || "Restored",
      details: { market: row.market, brokerage: row.brokerage },
      createdBy: input.actorName,
    });
  }
  return { ok: true };
}
