import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { mapsiteHrefForSlot } from "@/lib/talispros/fast-code-slots";
import { loadOwnTebViewerHref } from "@/lib/talisbooks/own-teb-href";
import {
  isFastCodeStage,
  type FastCodeEventType,
  type FastCodeStage,
  type FastCodeUpdate,
} from "@/lib/talispros/fast-code-tracker";

/** Server-only access to fast_code_status / fast_code_updates (RLS on, no client policies). */

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

export interface TrackerRow {
  fastCode: string;
  mapsiteId: string | null;
  agentId: string | null;
  agentName: string | null;
  stage: FastCodeStage;
  brokerage: string;
  contact: string | null;
  address: string | null;
  mapsiteHref: string;
  tebHref: string;
  listingsCount: number | null;
  lastRefreshedAt: string | null;
  updatedAt: string;
}

type StatusRow = {
  fast_code: string;
  mapsite_id: string | null;
  agent_id: string | null;
  stage: string;
  listings_count: number | null;
  last_refreshed_at: string | null;
  updated_at: string;
  mapsites:
    | { property_title: string | null; agent_name: string | null; property_address: string | null; account_type: string | null }
    | { property_title: string | null; agent_name: string | null; property_address: string | null; account_type: string | null }[]
    | null;
};

function one<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

function toUpdate(r: Record<string, unknown>): FastCodeUpdate {
  return {
    id: String(r.id),
    fastCode: String(r.fast_code),
    agentId: (r.agent_id as string | null) ?? null,
    eventType: r.event_type as FastCodeEventType,
    stage: isFastCodeStage(r.stage) ? r.stage : null,
    note: (r.note as string | null) ?? null,
    details: (r.details as Record<string, unknown>) ?? {},
    createdBy: (r.created_by as string | null) ?? null,
    createdAt: String(r.created_at),
  };
}

export async function listTrackerRows(filter: { agentId?: string } = {}): Promise<TrackerRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  let q = db()
    .from("fast_code_status")
    .select(
      "fast_code, mapsite_id, agent_id, stage, listings_count, last_refreshed_at, updated_at, mapsites(property_title, agent_name, property_address, account_type)",
    )
    .order("fast_code");
  if (filter.agentId) q = q.eq("agent_id", filter.agentId);
  const [{ data }, { data: agents }] = await Promise.all([q, db().from("agent_admins").select("id, name")]);
  const names = new Map(((agents ?? []) as { id: string; name: string }[]).map((a) => [a.id, a.name]));
  const rows = (data ?? []) as StatusRow[];
  return Promise.all(
    rows.map(async (r) => {
      const m = one(r.mapsites);
      const teb = await loadOwnTebViewerHref(r.fast_code).catch(() => null);
      return {
        fastCode: r.fast_code.toUpperCase(),
        mapsiteId: r.mapsite_id,
        agentId: r.agent_id,
        agentName: r.agent_id ? (names.get(r.agent_id) ?? null) : null,
        stage: isFastCodeStage(r.stage) ? r.stage : "new",
        brokerage: m?.property_title?.trim() || r.fast_code.toUpperCase(),
        contact: m?.agent_name?.trim() || null,
        address: m?.property_address?.trim() || null,
        mapsiteHref: mapsiteHrefForSlot(m?.account_type, r.fast_code),
        tebHref: teb || `/talisbooks/fast/${r.fast_code.toLowerCase()}`,
        listingsCount: r.listings_count,
        lastRefreshedAt: r.last_refreshed_at,
        updatedAt: r.updated_at,
      } satisfies TrackerRow;
    }),
  );
}

/** Updates, newest first. `beforeIso` limits to events before a moment (date picker). */
export async function listFastCodeUpdates(filter: {
  fastCode?: string;
  beforeIso?: string;
  sinceIso?: string;
  limit?: number;
} = {}): Promise<FastCodeUpdate[]> {
  if (!isSupabaseAdminConfigured()) return [];
  let q = db()
    .from("fast_code_updates")
    .select("id, fast_code, agent_id, event_type, stage, note, details, created_by, created_at")
    .order("created_at", { ascending: false })
    .limit(filter.limit ?? 2000);
  if (filter.fastCode) q = q.eq("fast_code", filter.fastCode.toLowerCase());
  if (filter.beforeIso) q = q.lt("created_at", filter.beforeIso);
  if (filter.sinceIso) q = q.gte("created_at", filter.sinceIso);
  const { data } = await q;
  return ((data ?? []) as Record<string, unknown>[]).map(toUpdate);
}

export async function recordFastCodeUpdate(input: {
  fastCode: string;
  agentId?: string | null;
  mapsiteId?: string | null;
  eventType: FastCodeEventType;
  stage?: FastCodeStage | null;
  note?: string | null;
  details?: Record<string, unknown>;
  createdBy: string;
}): Promise<boolean> {
  const { error } = await db().from("fast_code_updates").insert({
    fast_code: input.fastCode.toLowerCase(),
    agent_id: input.agentId ?? null,
    mapsite_id: input.mapsiteId ?? null,
    event_type: input.eventType,
    stage: input.stage ?? null,
    note: input.note ?? null,
    details: input.details ?? {},
    created_by: input.createdBy,
  });
  return !error;
}

/** Status row for a code, or null when the code is not tracked. */
export async function getTrackedCode(fastCode: string): Promise<{ agentId: string | null; mapsiteId: string | null; stage: FastCodeStage } | null> {
  const { data } = await db()
    .from("fast_code_status")
    .select("agent_id, mapsite_id, stage")
    .eq("fast_code", fastCode.toLowerCase())
    .maybeSingle();
  const r = data as { agent_id: string | null; mapsite_id: string | null; stage: string } | null;
  return r ? { agentId: r.agent_id, mapsiteId: r.mapsite_id, stage: isFastCodeStage(r.stage) ? r.stage : "new" } : null;
}

export async function setFastCodeStage(fastCode: string, stage: FastCodeStage, actor: { agentId: string | null; by: string }): Promise<boolean> {
  const tracked = await getTrackedCode(fastCode);
  if (!tracked) return false;
  if (tracked.stage === stage) return true;
  const { error } = await db()
    .from("fast_code_status")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("fast_code", fastCode.toLowerCase());
  if (error) return false;
  return recordFastCodeUpdate({
    fastCode,
    agentId: actor.agentId,
    mapsiteId: tracked.mapsiteId,
    eventType: "stage",
    stage,
    details: { from: tracked.stage },
    createdBy: actor.by,
  });
}

export async function addFastCodeNote(fastCode: string, note: string, actor: { agentId: string | null; by: string }): Promise<boolean> {
  const tracked = await getTrackedCode(fastCode);
  if (!tracked) return false;
  await db().from("fast_code_status").update({ updated_at: new Date().toISOString() }).eq("fast_code", fastCode.toLowerCase());
  return recordFastCodeUpdate({
    fastCode,
    agentId: actor.agentId,
    mapsiteId: tracked.mapsiteId,
    eventType: "note",
    stage: tracked.stage,
    note,
    createdBy: actor.by,
  });
}

export interface JobRun {
  id: string;
  triggeredBy: string;
  startedAt: string;
  finishedAt: string | null;
  summary: Record<string, unknown>;
}

export async function listJobRuns(limit = 10): Promise<JobRun[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const { data } = await db()
    .from("fast_code_job_runs")
    .select("id, triggered_by, started_at, finished_at, summary")
    .order("started_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    triggeredBy: String(r.triggered_by),
    startedAt: String(r.started_at),
    finishedAt: (r.finished_at as string | null) ?? null,
    summary: (r.summary as Record<string, unknown>) ?? {},
  }));
}
