import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { accountHasAdminScope, isGlobalAdmin } from "@/lib/admin-constants";
import { logAgentAudit } from "@/lib/agent-admins";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  IMPORT_ROW_LIMIT,
  type LeadField,
  LEAD_COUNTRIES,
  LEAD_SORTS,
  LEAD_STATUSES,
  canDeleteLeads,
  canEditLead,
  classifyImportRows,
  type ClassifiedRow,
  type CrmActor,
  type ExistingLeadKey,
  type LeadCountry,
  type LeadListFilters,
  type LeadSort,
  type LeadStatus,
  type NormalizedLead,
} from "@/lib/crm-leads/model";

/**
 * Brokerage CRM data access. RLS is on and the Data API cannot read or write
 * these tables. Every call checks the app session first.
 *
 * Visibility: an agent lists their own leads by default and may list every
 * lead read-only. A superadmin (Global Admin) lists and edits every lead and
 * is the only role allowed to delete. Deletes go through
 * `superadmin_delete_brokerage_lead`. This module never issues a table delete.
 */

const TABLE = "brokerage_leads";
const HISTORY = "brokerage_lead_edits";
const PAGE_SIZE = 50;

export type BrokerageLead = NormalizedLead & {
  id: string;
  createdByAgentId: string | null;
  createdByName: string;
  updatedByAgentId: string | null;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadEdit = {
  id: string;
  action: "create" | "update" | "import";
  actorName: string;
  actorRole: "agent" | "superadmin";
  changes: Record<string, { from: unknown; to: unknown } | unknown>;
  createdAt: string;
};

type LeadRow = {
  id: string;
  decision_maker_name: string;
  position: NormalizedLead["position"];
  cell_phone: string | null;
  email: string | null;
  brokerage_name: string;
  brokerage_website: string | null;
  brokerage_address: string | null;
  office_phone: string | null;
  latitude: number | null;
  longitude: number | null;
  country: LeadCountry;
  market: string | null;
  status: LeadStatus;
  notes: string | null;
  created_by_agent_id: string | null;
  created_by_name: string;
  updated_by_agent_id: string | null;
  updated_by_name: string | null;
  created_at: string;
  updated_at: string;
};

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

function toLead(row: LeadRow): BrokerageLead {
  return {
    id: row.id,
    decisionMakerName: row.decision_maker_name,
    position: row.position,
    cellPhone: row.cell_phone,
    email: row.email,
    brokerageName: row.brokerage_name,
    brokerageWebsite: row.brokerage_website,
    brokerageAddress: row.brokerage_address,
    officePhone: row.office_phone,
    latitude: row.latitude,
    longitude: row.longitude,
    country: row.country,
    market: row.market,
    status: row.status,
    notes: row.notes,
    createdByAgentId: row.created_by_agent_id,
    createdByName: row.created_by_name,
    updatedByAgentId: row.updated_by_agent_id,
    updatedByName: row.updated_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toInsert(lead: NormalizedLead, actor: CrmActor) {
  return {
    decision_maker_name: lead.decisionMakerName,
    position: lead.position,
    cell_phone: lead.cellPhone,
    email: lead.email,
    brokerage_name: lead.brokerageName,
    brokerage_website: lead.brokerageWebsite,
    brokerage_address: lead.brokerageAddress,
    office_phone: lead.officePhone,
    latitude: lead.latitude,
    longitude: lead.longitude,
    country: lead.country,
    market: lead.market,
    status: lead.status,
    notes: lead.notes,
    created_by_agent_id: actor.agentId,
    created_by_name: actor.name,
    updated_by_agent_id: actor.agentId,
    updated_by_name: actor.name,
  };
}

export async function requireCrmActor(): Promise<CrmActor | null> {
  const account = await getAdminSessionAccount();
  if (!account || account.mustChangePassword) return null;
  if (isGlobalAdmin(account)) return { role: "superadmin", name: account.name, agentId: null };
  if (
    account.access === "agent" &&
    account.agentId &&
    accountHasAdminScope(account, "leads-crm")
  ) {
    return { role: "agent", name: account.name, agentId: account.agentId };
  }
  return null;
}

export function parseLeadFilters(
  sp: Record<string, string | string[] | undefined>,
  actor: CrmActor,
): LeadListFilters {
  const one = (key: string) => {
    const v = sp[key];
    return (Array.isArray(v) ? v[0] : v ?? "").trim();
  };
  const status = one("status");
  const country = one("country");
  const sort = one("sort");
  const dir = one("dir");
  const scope = one("scope");
  const page = Number(one("page"));
  return {
    q: one("q").slice(0, 80),
    status: (LEAD_STATUSES as readonly string[]).includes(status) ? (status as LeadStatus) : "",
    country: (LEAD_COUNTRIES as readonly string[]).includes(country) ? (country as LeadCountry) : "",
    market: one("market").slice(0, 120),
    agentId: one("agent").slice(0, 80),
    scope: actor.role === "superadmin" ? (scope === "mine" ? "mine" : "all") : scope === "all" ? "all" : "mine",
    sort: (LEAD_SORTS as readonly string[]).includes(sort) ? (sort as LeadSort) : "created_at",
    dir: dir === "asc" ? "asc" : "desc",
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
  };
}

const SORT_COLUMN: Record<LeadSort, string> = {
  created_at: "created_at",
  decision_maker_name: "decision_maker_name",
  brokerage_name: "brokerage_name",
  status: "status",
  market: "market",
  country: "country",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The Supabase filter builder is generic and changes type on each call.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, filters: LeadListFilters, actor: CrmActor): any {
  let q = query;
  if (actor.role === "agent" && filters.scope === "mine" && actor.agentId) {
    q = q.eq("created_by_agent_id", actor.agentId);
  } else if (UUID_RE.test(filters.agentId)) {
    q = q.eq("created_by_agent_id", filters.agentId);
  }
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.country) q = q.eq("country", filters.country);
  if (filters.market) q = q.eq("market", filters.market);
  const term = filters.q.replace(/[%_,.()]/g, " ").replace(/"/g, "").trim();
  if (term) {
    const like = `"%${term}%"`;
    q = q.or(
      [
        `decision_maker_name.ilike.${like}`,
        `brokerage_name.ilike.${like}`,
        `email.ilike.${like}`,
        `cell_phone.ilike.${like}`,
        `office_phone.ilike.${like}`,
        `market.ilike.${like}`,
        `brokerage_address.ilike.${like}`,
      ].join(","),
    );
  }
  return q;
}

export async function listBrokerageLeads(
  actor: CrmActor,
  filters: LeadListFilters,
): Promise<{ leads: BrokerageLead[]; total: number; markets: string[]; agents: Array<{ id: string; name: string }> }> {
  if (!isSupabaseAdminConfigured()) return { leads: [], total: 0, markets: [], agents: [] };
  const from = (filters.page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  let query = db().from(TABLE).select("*", { count: "exact" });
  query = applyFilters(query, filters, actor);
  const [{ data, count, error }, { data: markets }, { data: agents }] = await Promise.all([
    query.order(SORT_COLUMN[filters.sort], { ascending: filters.dir === "asc", nullsFirst: false }).range(from, to),
    db().from(TABLE).select("market").not("market", "is", null).limit(500),
    db().from(TABLE).select("created_by_agent_id, created_by_name").limit(1000),
  ]);
  if (error) return { leads: [], total: 0, markets: [], agents: [] };
  const agentMap = new Map<string, string>();
  for (const row of (agents ?? []) as Array<{ created_by_agent_id: string | null; created_by_name: string | null }>) {
    if (row.created_by_agent_id && row.created_by_name) agentMap.set(row.created_by_agent_id, row.created_by_name);
  }
  const marketSet = new Set<string>();
  for (const row of (markets ?? []) as Array<{ market: string | null }>) {
    if (row.market) marketSet.add(row.market);
  }
  return {
    leads: ((data ?? []) as LeadRow[]).map(toLead),
    total: count ?? 0,
    markets: [...marketSet].sort((a, b) => a.localeCompare(b)),
    agents: [...agentMap.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export function leadFormValues(lead: BrokerageLead): Record<LeadField, string> {
  return {
    decision_maker_name: lead.decisionMakerName,
    position: lead.position,
    cell_phone: lead.cellPhone ?? "",
    email: lead.email ?? "",
    brokerage_name: lead.brokerageName,
    brokerage_website: lead.brokerageWebsite ?? "",
    brokerage_address: lead.brokerageAddress ?? "",
    office_phone: lead.officePhone ?? "",
    latitude: lead.latitude === null ? "" : String(lead.latitude),
    longitude: lead.longitude === null ? "" : String(lead.longitude),
    country: lead.country,
    market: lead.market ?? "",
    status: lead.status,
    notes: lead.notes ?? "",
  };
}

export async function getBrokerageLead(actor: CrmActor, id: string): Promise<BrokerageLead | null> {
  if (!isSupabaseAdminConfigured() || !id) return null;
  const { data, error } = await db().from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  const lead = toLead(data as LeadRow);
  if (actor.role === "agent" && !canEditLead(actor, lead)) {
    // Agents may read every lead. Editing is checked separately.
    return lead;
  }
  return lead;
}

export async function listLeadEdits(leadId: string): Promise<LeadEdit[]> {
  if (!isSupabaseAdminConfigured() || !leadId) return [];
  const { data } = await db()
    .from(HISTORY)
    .select("id, action, actor_name, actor_role, changes, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(40);
  return ((data ?? []) as Array<{
    id: string;
    action: LeadEdit["action"];
    actor_name: string;
    actor_role: LeadEdit["actorRole"];
    changes: LeadEdit["changes"];
    created_at: string;
  }>).map((row) => ({
    id: row.id,
    action: row.action,
    actorName: row.actor_name,
    actorRole: row.actor_role,
    changes: row.changes ?? {},
    createdAt: row.created_at,
  }));
}

async function writeHistory(
  leadId: string,
  action: "create" | "update" | "import",
  actor: CrmActor,
  changes: Record<string, unknown>,
) {
  await db().from(HISTORY).insert({
    lead_id: leadId,
    action,
    actor_agent_id: actor.agentId,
    actor_name: actor.name,
    actor_role: actor.role,
    changes,
  });
}

async function logCrm(
  actor: CrmActor,
  action: string,
  leadId: string,
  details: Record<string, unknown>,
) {
  const payload = {
    lead_id: leadId,
    agent_name: actor.name,
    ...details,
  };
  try {
    if (actor.agentId) {
      await logAgentAudit(actor.agentId, action, actor.name, payload);
      return;
    }
    await db().from("activity_logs").insert({
      table_name: "brokerage_leads",
      record_id: leadId,
      action,
      performed_by: actor.name,
      details: payload,
    });
  } catch (error) {
    console.warn("[crm-leads] audit log failed:", error);
  }
}

function snapshot(lead: NormalizedLead): Record<string, unknown> {
  return {
    decision_maker_name: lead.decisionMakerName,
    position: lead.position,
    cell_phone: lead.cellPhone,
    email: lead.email,
    brokerage_name: lead.brokerageName,
    brokerage_website: lead.brokerageWebsite,
    brokerage_address: lead.brokerageAddress,
    office_phone: lead.officePhone,
    latitude: lead.latitude,
    longitude: lead.longitude,
    country: lead.country,
    market: lead.market,
    status: lead.status,
    notes: lead.notes,
  };
}

function diffLead(before: BrokerageLead, after: NormalizedLead): Record<string, { from: unknown; to: unknown }> {
  const prev = snapshot(before);
  const next = snapshot(after);
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(next)) {
    if (JSON.stringify(prev[key]) !== JSON.stringify(next[key])) {
      changes[key] = { from: prev[key], to: next[key] };
    }
  }
  return changes;
}

export async function createBrokerageLead(
  actor: CrmActor,
  lead: NormalizedLead,
  source: "create" | "import",
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "unavailable" };
  const { data, error } = await db().from(TABLE).insert(toInsert(lead, actor)).select("id").single();
  if (error || !data) return { ok: false, error: error?.message || "insert" };
  const id = (data as { id: string }).id;
  await writeHistory(id, source === "import" ? "import" : "create", actor, snapshot(lead));
  await logCrm(actor, source === "import" ? "agent.lead.import" : "agent.lead.create", id, {
    decision_maker_name: lead.decisionMakerName,
    brokerage_name: lead.brokerageName,
    country: lead.country,
    status: lead.status,
  });
  return { ok: true, id };
}

export async function updateBrokerageLead(
  actor: CrmActor,
  id: string,
  lead: NormalizedLead,
): Promise<{ ok: true } | { ok: false; error: "not_found" | "forbidden" | "unavailable" | "write" }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "unavailable" };
  const current = await getBrokerageLead(actor, id);
  if (!current) return { ok: false, error: "not_found" };
  if (!canEditLead(actor, current)) return { ok: false, error: "forbidden" };
  const changes = diffLead(current, lead);
  if (Object.keys(changes).length === 0) return { ok: true };
  const { error } = await db()
    .from(TABLE)
    .update({
      decision_maker_name: lead.decisionMakerName,
      position: lead.position,
      cell_phone: lead.cellPhone,
      email: lead.email,
      brokerage_name: lead.brokerageName,
      brokerage_website: lead.brokerageWebsite,
      brokerage_address: lead.brokerageAddress,
      office_phone: lead.officePhone,
      latitude: lead.latitude,
      longitude: lead.longitude,
      country: lead.country,
      market: lead.market,
      status: lead.status,
      notes: lead.notes,
      updated_by_agent_id: actor.agentId,
      updated_by_name: actor.name,
    })
    .eq("id", id);
  if (error) return { ok: false, error: "write" };
  await writeHistory(id, "update", actor, changes);
  await logCrm(actor, "agent.lead.update", id, {
    decision_maker_name: lead.decisionMakerName,
    brokerage_name: lead.brokerageName,
    country: lead.country,
    status: lead.status,
    fields: Object.keys(changes).join(","),
  });
  return { ok: true };
}

/**
 * Superadmin only. The SQL function is the only DELETE path; this refuses
 * every other role before the RPC, and the trigger refuses a raw delete.
 */
export async function deleteBrokerageLead(
  actor: CrmActor,
  id: string,
): Promise<{ ok: true } | { ok: false; error: "forbidden" | "not_found" | "unavailable" | "write" }> {
  if (!canDeleteLeads(actor)) return { ok: false, error: "forbidden" };
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "unavailable" };
  const current = await getBrokerageLead(actor, id);
  if (!current) return { ok: false, error: "not_found" };
  await logCrm(actor, "agent.lead.delete", id, {
    decision_maker_name: current.decisionMakerName,
    brokerage_name: current.brokerageName,
    country: current.country,
    status: current.status,
    owner_agent_id: current.createdByAgentId,
    owner_name: current.createdByName,
  });
  const { error } = await db().rpc("superadmin_delete_brokerage_lead", { p_id: id });
  if (error) return { ok: false, error: "write" };
  return { ok: true };
}

async function loadExistingKeys(): Promise<ExistingLeadKey[]> {
  const { data } = await db()
    .from(TABLE)
    .select("id, email, cell_phone, office_phone, brokerage_name, decision_maker_name")
    .limit(20000);
  return ((data ?? []) as Array<{
    id: string;
    email: string | null;
    cell_phone: string | null;
    office_phone: string | null;
    brokerage_name: string;
    decision_maker_name: string;
  }>).map((row) => ({
    id: row.id,
    email: row.email,
    cellPhone: row.cell_phone,
    officePhone: row.office_phone,
    brokerageName: row.brokerage_name,
    decisionMakerName: row.decision_maker_name,
  }));
}

export async function previewLeadImport(
  rows: Array<{ rowNumber: number; values: Partial<Record<string, string>> }>,
): Promise<{ ok: true; rows: ClassifiedRow[] } | { ok: false; error: "too_many" | "unavailable" }> {
  if (rows.length > IMPORT_ROW_LIMIT) return { ok: false, error: "too_many" };
  // Row validation and in-file duplicates still run when the service role is unset.
  // Duplicate checks against stored leads need the database.
  const existing = isSupabaseAdminConfigured() ? await loadExistingKeys() : [];
  return {
    ok: true,
    rows: classifyImportRows({
      rows: rows.map((row) => ({ rowNumber: row.rowNumber, values: row.values as never })),
      existing,
    }),
  };
}

export async function importBrokerageLeads(
  actor: CrmActor,
  rows: Array<{ rowNumber: number; values: Partial<Record<string, string>> }>,
): Promise<{ ok: true; imported: number; skipped: number } | { ok: false; error: "too_many" | "unavailable" }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "unavailable" };
  if (rows.length > IMPORT_ROW_LIMIT) return { ok: false, error: "too_many" };
  const existing = await loadExistingKeys();
  const classified = classifyImportRows({
    rows: rows.map((row) => ({ rowNumber: row.rowNumber, values: row.values as never })),
    existing,
  });
  let imported = 0;
  let skipped = 0;
  for (const row of classified) {
    if (!row.lead || row.errors.length || row.duplicate) {
      skipped += 1;
      continue;
    }
    const created = await createBrokerageLead(actor, row.lead, "import");
    if (!created.ok) skipped += 1;
    else imported += 1;
  }
  return { ok: true, imported, skipped };
}

export async function exportBrokerageLeads(actor: CrmActor, filters: LeadListFilters): Promise<BrokerageLead[]> {
  if (!isSupabaseAdminConfigured()) return [];
  let query = db().from(TABLE).select("*");
  query = applyFilters(query, filters, actor);
  const { data } = await query.order(SORT_COLUMN[filters.sort], { ascending: filters.dir === "asc" }).limit(5000);
  return ((data ?? []) as LeadRow[]).map(toLead);
}

export { PAGE_SIZE, canDeleteLeads, canEditLead };
