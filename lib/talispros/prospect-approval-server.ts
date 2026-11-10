import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { istDay } from "@/lib/talispros/fast-code-tracker";
import {
  LEADS_PAGE_SIZE,
  isCompleteContact,
  rowMatchesLeadFilter,
  type ApprovalLead,
  type LeadFilter,
  type ProspectCountry,
} from "@/lib/talispros/prospect-approval";

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

const COLUMNS =
  "id, brokerage, town, province, status, proposed_code, contact_first_name, contact_last_name, contact_name, contact_phone, contact_email, contact_position, research_notes, created_at, country";

type RawLead = Omit<ApprovalLead, "country"> & { country?: string | null };

function toLead(row: RawLead, countryKnown: boolean): ApprovalLead {
  const country: ProspectCountry = row.country === "US" ? "US" : "CA";
  return {
    id: row.id,
    brokerage: row.brokerage,
    town: row.town,
    province: row.province,
    country: countryKnown ? country : "CA",
    status: row.status,
    proposed_code: row.proposed_code,
    contact_first_name: row.contact_first_name,
    contact_last_name: row.contact_last_name,
    contact_name: row.contact_name,
    contact_phone: row.contact_phone,
    contact_email: row.contact_email,
    contact_position: row.contact_position,
    research_notes: row.research_notes,
    created_at: row.created_at,
  };
}

async function selectQueue(columns: string, ids?: string[]) {
  let q = db().from("prospect_queue").select(columns);
  if (ids) q = q.in("id", ids);
  else q = q.order("created_at", { ascending: false }).limit(2000);
  return q;
}

async function loadRaw(): Promise<{ rows: ApprovalLead[]; countryKnown: boolean }> {
  const first = await selectQueue(COLUMNS);
  let countryKnown = true;
  let data = first.data;
  let error = first.error;
  if (error && /country/i.test(error.message)) {
    countryKnown = false;
    const second = await selectQueue(COLUMNS.replace(", country", ""));
    data = second.data;
    error = second.error;
  }
  if (error) throw new Error(error.message);
  return { rows: ((data ?? []) as unknown as RawLead[]).map((row) => toLead(row, countryKnown)), countryKnown };
}

export async function loadNeedsReviewIds(): Promise<Set<string>> {
  const { data } = await db()
    .from("admin_talisbot_messages")
    .select("prospect_queue_id")
    .eq("type", "needs_review")
    .not("prospect_queue_id", "is", null)
    .limit(1000);
  const ids = new Set<string>();
  for (const row of (data ?? []) as { prospect_queue_id: string | null }[]) {
    if (row.prospect_queue_id) ids.add(row.prospect_queue_id);
  }
  return ids;
}

async function runWindow(runId: string): Promise<{ ids: Set<string> | null; start: string | null; end: string | null } | null> {
  const { data } = await db()
    .from("fast_code_job_runs")
    .select("started_at, finished_at, summary")
    .eq("id", runId)
    .maybeSingle();
  if (!data) return null;
  const row = data as { started_at: string; finished_at: string | null; summary: { sourcing?: { addedIds?: unknown } } | null };
  const added = row.summary?.sourcing?.addedIds;
  if (Array.isArray(added) && added.every((id) => typeof id === "string") && added.length) {
    return { ids: new Set(added as string[]), start: null, end: null };
  }
  const start = row.started_at;
  const end = row.finished_at ?? new Date(Date.parse(start) + 30 * 60 * 1000).toISOString();
  return { ids: null, start, end };
}

export type LeadListInput = {
  country: ProspectCountry;
  status: LeadFilter;
  from: string | null;
  to: string | null;
  complete: "complete" | "incomplete" | null;
  page: number;
  runId: string | null;
};

export async function loadLeadsToApprove(input: LeadListInput): Promise<{
  rows: ApprovalLead[];
  total: number;
  page: number;
  pageCount: number;
  pendingCa: number;
  pendingUs: number;
  needsReviewIds: string[];
  runApplied: boolean;
}> {
  const [{ rows }, flagged, window] = await Promise.all([
    loadRaw(),
    loadNeedsReviewIds(),
    input.runId && /^[0-9a-f-]{36}$/i.test(input.runId) ? runWindow(input.runId) : Promise.resolve(undefined),
  ]);
  const pendingCa = rows.filter((row) => row.country === "CA" && row.status === "pending").length;
  const pendingUs = rows.filter((row) => row.country === "US" && row.status === "pending").length;
  const filtered = rows.filter((row) => {
    if (row.country !== input.country) return false;
    if (!rowMatchesLeadFilter(row, input.status, flagged)) return false;
    const day = istDay(row.created_at);
    if (input.from && day < input.from) return false;
    if (input.to && day > input.to) return false;
    if (input.complete === "complete" && !isCompleteContact(row)) return false;
    if (input.complete === "incomplete" && isCompleteContact(row)) return false;
    if (window) {
      if (window.ids) return window.ids.has(row.id);
      if (window.start && row.created_at < window.start) return false;
      if (window.end && row.created_at > window.end) return false;
    } else if (window === null) {
      return false;
    }
    return true;
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / LEADS_PAGE_SIZE));
  const page = Math.min(Math.max(1, input.page), pageCount);
  const start = (page - 1) * LEADS_PAGE_SIZE;
  return {
    rows: filtered.slice(start, start + LEADS_PAGE_SIZE),
    total: filtered.length,
    page,
    pageCount,
    pendingCa,
    pendingUs,
    needsReviewIds: [...flagged],
    runApplied: Boolean(input.runId),
  };
}

export async function loadLeadsByIds(ids: string[]): Promise<ApprovalLead[]> {
  const unique = [...new Set(ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id)))];
  if (!unique.length) return [];
  const first = await selectQueue(COLUMNS, unique);
  let countryKnown = true;
  let data = first.data;
  let error = first.error;
  if (error && /country/i.test(error.message)) {
    countryKnown = false;
    const second = await selectQueue(COLUMNS.replace(", country", ""), unique);
    data = second.data;
    error = second.error;
  }
  if (error) return [];
  return ((data ?? []) as unknown as RawLead[]).map((row) => toLead(row, countryKnown));
}
