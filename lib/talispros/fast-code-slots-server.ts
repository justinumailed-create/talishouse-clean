import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentAgent, type AgentAccount } from "@/lib/agent-collab-server";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  FAST_CODE_SLOT_LIMIT,
  SALES_ASSOCIATE_LOGINS,
  mapsiteHrefForSlot,
  mapsiteProvinceFromAddress,
  mapsiteTownFromAddress,
  normalizeSlotFastCode,
  sortSlotEntriesNewestFirst,
  type FastCodeSlotsPanelData,
  type OwnSlotList,
  type PublicSlotList,
  type SlotEntry,
} from "@/lib/talispros/fast-code-slots";

/**
 * Server-only access to agent_fast_code_slots (RLS on, no client policies).
 * Public reads return FAST Code, town, province and link, never who prepared it.
 */

const TABLE = "agent_fast_code_slots";

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

type MapsiteJoin = {
  property_address?: string | null;
  property_title?: string | null;
  fast_code?: string | null;
  account_type?: string | null;
  created_at?: string | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function toEntry(slotId: unknown, m: MapsiteJoin | null): SlotEntry | null {
  const code = m?.fast_code?.trim();
  if (!code) return null;
  return {
    slotId: String(slotId),
    fastCode: code.toUpperCase(),
    town: mapsiteTownFromAddress(m?.property_address, m?.property_title),
    province: mapsiteProvinceFromAddress(m?.property_address),
    href: mapsiteHrefForSlot(m?.account_type, code),
    addedAt: m?.created_at ?? null,
  };
}

const SLOT_SELECT = "id, agent_id, position, created_at, mapsites(fast_code, account_type, property_address, property_title, created_at)";

/** Public groups: codes, towns and provinces only. The agent's name is never selected. */
async function loadPublicLists(excludeAgentId: string | null): Promise<PublicSlotList[]> {
  const { data: agents } = await db()
    .from("agent_admins")
    .select("id, login_id")
    .in("login_id", [...SALES_ASSOCIATE_LOGINS]);
  const ordered = SALES_ASSOCIATE_LOGINS.map((login) =>
    (agents || []).find((a) => String(a.login_id).toLowerCase() === login),
  ).filter((a): a is { id: string; login_id: string } => Boolean(a) && a!.id !== excludeAgentId);
  if (!ordered.length) return [];

  const { data: slots } = await db()
    .from(TABLE)
    .select(SLOT_SELECT)
    .in("agent_id", ordered.map((a) => a.id))
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  return ordered
    .map((agent) => ({
      entries: sortSlotEntriesNewestFirst(
        (slots || [])
          .filter((s) => s.agent_id === agent.id)
          .slice(0, FAST_CODE_SLOT_LIMIT)
          .flatMap((s) => {
            const entry = toEntry(s.id, one(s.mapsites as MapsiteJoin | MapsiteJoin[] | null));
            return entry ? [entry] : [];
          }),
      ),
    }))
    .filter((list) => list.entries.length > 0);
}

/** One agent's list by id (their own page, and the admin "View as agent" preview). */
export async function loadSlotListForAgentId(agentId: string): Promise<OwnSlotList> {
  if (!isSupabaseAdminConfigured()) return { count: 0, limit: FAST_CODE_SLOT_LIMIT, entries: [] };
  const { data: slots } = await db()
    .from(TABLE)
    .select(SLOT_SELECT)
    .eq("agent_id", agentId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  const entries = sortSlotEntriesNewestFirst(
    (slots || []).flatMap((s) => {
      const entry = toEntry(s.id, one(s.mapsites as MapsiteJoin | MapsiteJoin[] | null));
      return entry ? [entry] : [];
    }),
  );
  return { count: entries.length, limit: FAST_CODE_SLOT_LIMIT, entries };
}

export async function loadOwnSlotList(agent: AgentAccount): Promise<OwnSlotList> {
  return loadSlotListForAgentId(agent.agentId);
}

/** Panel data for the current request: codes only for the signed-in agent's own list. */
export async function loadFastCodeSlotsPanel(): Promise<FastCodeSlotsPanelData> {
  if (!isSupabaseAdminConfigured()) return { associates: [], own: null };
  const agent = await getCurrentAgent().catch(() => null);
  const [associates, own] = await Promise.all([
    loadPublicLists(agent?.agentId ?? null).catch(() => []),
    agent ? loadOwnSlotList(agent).catch(() => null) : Promise.resolve(null),
  ]);
  return { associates, own };
}

export type SlotMutationError = "signin" | "invalid" | "notFound" | "duplicate" | "full" | "failed";

export async function addFastCodeSlot(
  agent: AgentAccount,
  rawCode: unknown,
): Promise<{ ok: true } | { ok: false; error: SlotMutationError }> {
  const code = normalizeSlotFastCode(rawCode);
  if (!code) return { ok: false, error: "invalid" };
  const { data: mapsite } = await db()
    .from("mapsites")
    .select("id")
    .ilike("fast_code", code)
    .limit(1)
    .maybeSingle();
  if (!mapsite?.id) return { ok: false, error: "notFound" };

  const { data: existing } = await db()
    .from(TABLE)
    .select("id, mapsite_id, position")
    .eq("agent_id", agent.agentId);
  const rows = existing || [];
  if (rows.some((r) => r.mapsite_id === mapsite.id)) return { ok: false, error: "duplicate" };
  if (rows.length >= FAST_CODE_SLOT_LIMIT) return { ok: false, error: "full" };
  const position = rows.reduce((max, r) => Math.max(max, Number(r.position) || 0), -1) + 1;

  const { error } = await db()
    .from(TABLE)
    .insert({ agent_id: agent.agentId, mapsite_id: mapsite.id, position });
  if (error) return { ok: false, error: error.code === "23505" ? "duplicate" : "failed" };
  return { ok: true };
}

export async function removeFastCodeSlot(
  agent: AgentAccount,
  slotId: unknown,
): Promise<{ ok: true } | { ok: false; error: SlotMutationError }> {
  if (typeof slotId !== "string" || !/^[0-9a-f-]{36}$/i.test(slotId)) return { ok: false, error: "invalid" };
  const { error } = await db().from(TABLE).delete().eq("id", slotId).eq("agent_id", agent.agentId);
  return error ? { ok: false, error: "failed" } : { ok: true };
}

/** Mapsite path for a public town link. Only slots of the listed associates open. */
export async function resolveSlotMapsiteHref(slotId: string): Promise<string | null> {
  if (!/^[0-9a-f-]{36}$/i.test(slotId) || !isSupabaseAdminConfigured()) return null;
  const { data } = await db()
    .from(TABLE)
    .select("id, agent_id, agent_admins(login_id), mapsites(fast_code, account_type)")
    .eq("id", slotId)
    .maybeSingle();
  if (!data) return null;
  const owner = one(data.agent_admins as { login_id?: string | null } | { login_id?: string | null }[] | null);
  const viewer = await getCurrentAgent().catch(() => null);
  const isAssociate = SALES_ASSOCIATE_LOGINS.includes(
    String(owner?.login_id || "").toLowerCase() as (typeof SALES_ASSOCIATE_LOGINS)[number],
  );
  if (!isAssociate && viewer?.agentId !== data.agent_id) return null;
  const m = one(data.mapsites as MapsiteJoin | MapsiteJoin[] | null);
  const code = m?.fast_code?.trim();
  return code ? mapsiteHrefForSlot(m?.account_type, code) : null;
}

/** True when a sales associate has prepared this Mapsite (shows Aisha's four buttons). */
export async function isPreparedSlotMapsite(mapsiteId: string | null | undefined): Promise<boolean> {
  if (!mapsiteId || !isSupabaseAdminConfigured()) return false;
  const { count } = await db()
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("mapsite_id", mapsiteId);
  return (count ?? 0) > 0;
}
