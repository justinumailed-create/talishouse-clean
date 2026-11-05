import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { SALES_ASSOCIATE_LOGINS } from "@/lib/talispros/fast-code-slots";
import { RESERVED_FAST_CODES, pickLeastLoaded, proposeFastCode } from "@/lib/talispros/fast-code-tracker";
import { recordFastCodeUpdate } from "@/lib/talispros/fast-code-tracker-server";

/**
 * Daily FAST Code job (Vercel cron 00:30 UTC = 06:00 IST, plus "Run now").
 *  1. Refresh: re-check each tracked code's REALTOR.ca office listings (same
 *     PropertySearch call as the eBook build) and its brokerage website; log
 *     new/removed listings and flag the eBook for a refresh.
 *  2. Assign: approved sourcing-queue prospects get an initials FAST Code that
 *     collides with nothing (codes, Mapsites, build requests, reserved) and go
 *     to the less-loaded sales associate.
 * Sourcing itself stays human: researched brokerages enter the review queue
 * with a source link and need admin approval; nothing is invented here.
 */

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

const UA = "Mozilla/5.0 (compatible; TalisprosDailyCheck/1.0; +https://www.talispros.com)";

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 10000): Promise<Response | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, redirect: "follow", cache: "no-store" });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** REALTOR.ca firm id from a stored office URL (…/office/firm/<id>/…). */
export function realtorFirmId(mlsUrl: string | null | undefined): string | null {
  const m = mlsUrl?.match(/\/office\/firm\/(\d+)/);
  return m?.[1] ?? null;
}

type Listing = { mls: string; address: string; price: string | null };

/** Same query as /workspace build (rca_api): active residential sale listings for an office. */
async function fetchOfficeListings(firmId: string): Promise<{ ok: true; listings: Listing[] } | { ok: false; status: string }> {
  const listings: Listing[] = [];
  for (let page = 1; page <= 4; page++) {
    const body = new URLSearchParams({
      OrganizationId: firmId,
      ApplicationId: "1",
      CultureId: "1",
      Version: "7.0",
      RecordsPerPage: "50",
      CurrentPage: String(page),
      PropertySearchTypeId: "0",
      TransactionTypeId: "2",
      Sort: "6-D",
      PropertyTypeGroupID: "1",
      LatitudeMax: "90",
      LatitudeMin: "-90",
      LongitudeMax: "180",
      LongitudeMin: "-180",
      ZoomLevel: "3",
    });
    const res = await fetchWithTimeout("https://api2.realtor.ca/Listing.svc/PropertySearch_Post", {
      method: "POST",
      body,
      headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8", "user-agent": UA },
    });
    if (!res) return { ok: false, status: "timeout" };
    if (!res.ok) return { ok: false, status: `http ${res.status}` };
    let json: { Results?: Record<string, unknown>[]; Paging?: { TotalPages?: number } };
    try {
      json = await res.json();
    } catch {
      return { ok: false, status: "blocked" };
    }
    for (const r of json.Results ?? []) {
      const prop = (r.Property ?? {}) as { Address?: { AddressText?: string }; Price?: string };
      listings.push({
        mls: String(r.MlsNumber ?? ""),
        address: (prop.Address?.AddressText ?? "").replace(/\|/g, ", "),
        price: prop.Price ?? null,
      });
    }
    if (!json.Paging || page >= (json.Paging.TotalPages ?? 1)) break;
  }
  return { ok: true, listings: listings.filter((l) => l.mls) };
}

export interface DailyJobSummary {
  refreshed: number;
  listingChanges: number;
  listingSourceUnavailable: number;
  brokerSitesDown: string[];
  assigned: { code: string; agent: string; brokerage: string }[];
  pendingReview: number;
  errors: string[];
}

async function refreshCodes(summary: DailyJobSummary): Promise<void> {
  const { data } = await db()
    .from("fast_code_status")
    .select("fast_code, mapsite_id, agent_id, listings_snapshot, mapsites(mls_url, broker_url)");
  const rows = (data ?? []) as {
    fast_code: string;
    mapsite_id: string | null;
    agent_id: string | null;
    listings_snapshot: Listing[] | null;
    mapsites: { mls_url: string | null; broker_url: string | null } | { mls_url: string | null; broker_url: string | null }[] | null;
  }[];
  for (const row of rows) {
    const m = Array.isArray(row.mapsites) ? row.mapsites[0] : row.mapsites;
    const now = new Date().toISOString();
    const update: Record<string, unknown> = { last_refreshed_at: now };
    const details: Record<string, unknown> = {};
    // Brokerage website.
    if (m?.broker_url && /^https?:\/\//i.test(m.broker_url)) {
      const res = await fetchWithTimeout(m.broker_url, { headers: { "user-agent": UA } }, 8000);
      const status = res?.status ?? 0;
      update.broker_site_status = status;
      details.brokerSite = status;
      if (!status || status >= 400) summary.brokerSitesDown.push(row.fast_code.toUpperCase());
    }
    // Office listings.
    const firm = realtorFirmId(m?.mls_url);
    if (firm) {
      const result = await fetchOfficeListings(firm);
      if (result.ok) {
        const before = row.listings_snapshot;
        const prev = new Set((before ?? []).map((l) => l.mls));
        const next = new Set(result.listings.map((l) => l.mls));
        const added = result.listings.filter((l) => !prev.has(l.mls));
        const removed = (before ?? []).filter((l) => !next.has(l.mls));
        update.listings_snapshot = result.listings;
        update.listings_count = result.listings.length;
        update.listings_source_status = "ok";
        details.listings = result.listings.length;
        if (before && (added.length || removed.length)) {
          summary.listingChanges++;
          await recordFastCodeUpdate({
            fastCode: row.fast_code,
            agentId: row.agent_id,
            mapsiteId: row.mapsite_id,
            eventType: "listings",
            note: `${added.length} new, ${removed.length} removed`,
            details: { added: added.slice(0, 20), removed: removed.slice(0, 20) },
            createdBy: "daily-job",
          });
          await recordFastCodeUpdate({
            fastCode: row.fast_code,
            agentId: row.agent_id,
            mapsiteId: row.mapsite_id,
            eventType: "ebook",
            note: "Listings changed: eBook pages need a refresh",
            details: { added: added.length, removed: removed.length },
            createdBy: "daily-job",
          });
        }
      } else {
        summary.listingSourceUnavailable++;
        update.listings_source_status = result.status;
        details.listingsSource = result.status;
      }
    }
    await db().from("fast_code_status").update(update).eq("fast_code", row.fast_code);
    await recordFastCodeUpdate({
      fastCode: row.fast_code,
      agentId: row.agent_id,
      mapsiteId: row.mapsite_id,
      eventType: "refresh",
      details,
      createdBy: "daily-job",
    });
    summary.refreshed++;
  }
}

/** Every code already in use anywhere, lower-cased. */
export async function loadTakenCodes(): Promise<Set<string>> {
  const taken = new Set<string>(RESERVED_FAST_CODES);
  const add = (rows: unknown, key: string) => {
    for (const r of (rows ?? []) as Record<string, unknown>[]) {
      const v = r[key];
      if (typeof v === "string" && v.trim()) taken.add(v.trim().toLowerCase());
    }
  };
  const [codes, maps, reqs, queue, status] = await Promise.all([
    db().from("fast_codes").select("code"),
    db().from("mapsites").select("fast_code"),
    db().from("build_requests").select("requested_fast_code"),
    db().from("prospect_queue").select("proposed_code"),
    db().from("fast_code_status").select("fast_code"),
  ]);
  add(codes.data, "code");
  add(maps.data, "fast_code");
  add(reqs.data, "requested_fast_code");
  add(queue.data, "proposed_code");
  add(status.data, "fast_code");
  return taken;
}

async function assignApproved(summary: DailyJobSummary): Promise<void> {
  const { data: agents } = await db()
    .from("agent_admins")
    .select("id, login_id, name, status")
    .in("login_id", SALES_ASSOCIATE_LOGINS as unknown as string[]);
  const active = ((agents ?? []) as { id: string; login_id: string; name: string; status: string }[]).filter(
    (a) => a.status === "active",
  );
  if (!active.length) return;
  const [{ data: statusRows }, { data: queueRows }] = await Promise.all([
    db().from("fast_code_status").select("agent_id"),
    db().from("prospect_queue").select("id, brokerage, contact_name, assigned_agent_id, proposed_code, status"),
  ]);
  const load = new Map(active.map((a) => [a.id, 0]));
  for (const r of (statusRows ?? []) as { agent_id: string | null }[]) if (r.agent_id && load.has(r.agent_id)) load.set(r.agent_id, load.get(r.agent_id)! + 1);
  const queue = (queueRows ?? []) as { id: string; brokerage: string; contact_name: string | null; assigned_agent_id: string | null; proposed_code: string | null; status: string }[];
  for (const q of queue) if (q.status === "approved" && q.assigned_agent_id && load.has(q.assigned_agent_id)) load.set(q.assigned_agent_id, load.get(q.assigned_agent_id)! + 1);
  summary.pendingReview = queue.filter((q) => q.status === "pending").length;

  const taken = await loadTakenCodes();
  for (const q of queue.filter((x) => x.status === "approved" && (!x.proposed_code || !x.assigned_agent_id))) {
    const code = q.proposed_code || proposeFastCode(q.contact_name || q.brokerage, taken);
    taken.add(code);
    const pick = pickLeastLoaded(active.map((a) => ({ id: a.id, count: load.get(a.id) ?? 0, name: a.name })));
    if (!pick) break;
    load.set(pick.id, pick.count + 1);
    const { error } = await db()
      .from("prospect_queue")
      .update({ proposed_code: code, assigned_agent_id: pick.id })
      .eq("id", q.id);
    if (error) {
      summary.errors.push(`assign ${q.brokerage}: ${error.message}`);
      continue;
    }
    await recordFastCodeUpdate({
      fastCode: code,
      agentId: pick.id,
      eventType: "assigned",
      stage: "new",
      note: `${q.brokerage} → ${pick.name}`,
      details: { queueId: q.id },
      createdBy: "daily-job",
    });
    summary.assigned.push({ code: code.toUpperCase(), agent: pick.name, brokerage: q.brokerage });
  }
}

export async function runFastCodeDailyJob(triggeredBy: string): Promise<DailyJobSummary> {
  const summary: DailyJobSummary = {
    refreshed: 0,
    listingChanges: 0,
    listingSourceUnavailable: 0,
    brokerSitesDown: [],
    assigned: [],
    pendingReview: 0,
    errors: [],
  };
  if (!isSupabaseAdminConfigured()) {
    summary.errors.push("database not configured");
    return summary;
  }
  const { data: run } = await db().from("fast_code_job_runs").insert({ triggered_by: triggeredBy }).select("id").single();
  try {
    await refreshCodes(summary);
  } catch (e) {
    summary.errors.push(`refresh: ${e instanceof Error ? e.message : String(e)}`);
  }
  try {
    await assignApproved(summary);
  } catch (e) {
    summary.errors.push(`assign: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (run?.id) {
    await db()
      .from("fast_code_job_runs")
      .update({ finished_at: new Date().toISOString(), summary })
      .eq("id", (run as { id: string }).id);
  }
  return summary;
}
