"use server";

import { revalidatePath } from "next/cache";
import { crmCopy } from "@/lib/crm-leads/copy";
import {
  IMPORT_ROW_LIMIT,
  canDeleteLeads,
  canEditLead,
  toCsv,
  validateLeadValues,
  type LeadField,
  type LeadIssue,
  type LeadListFilters,
} from "@/lib/crm-leads/model";
import {
  createBrokerageLead,
  deleteBrokerageLead,
  exportBrokerageLeads,
  getBrokerageLead,
  importBrokerageLeads,
  parseLeadFilters,
  previewLeadImport,
  requireCrmActor,
  updateBrokerageLead,
} from "@/lib/crm-leads/server";
import { getLocale } from "@/lib/i18n/server";

export type SaveLeadResult =
  | { ok: true; id: string }
  | { ok: false; error: string; issues: LeadIssue[] };

function revalidateLeads(id?: string) {
  revalidatePath("/admin/agent/leads");
  revalidatePath("/admin/agent");
  if (id) revalidatePath(`/admin/agent/leads/${id}`);
}

export async function saveLeadAction(
  id: string | null,
  values: Partial<Record<LeadField, string>>,
): Promise<SaveLeadResult> {
  const copy = crmCopy(await getLocale());
  const actor = await requireCrmActor();
  if (!actor) return { ok: false, error: copy.unauthorized, issues: [] };
  let storedCountry: string | null = null;
  if (id) {
    const existing = await getBrokerageLead(actor, id);
    if (!existing) return { ok: false, error: copy.notFound, issues: [] };
    if (!canEditLead(actor, existing)) return { ok: false, error: copy.editDenied, issues: [] };
    storedCountry = existing.country;
  }
  const parsed = validateLeadValues(values, { storedCountry });
  if (!parsed.lead) return { ok: false, error: copy.genericError, issues: parsed.errors };
  if (!id) {
    const created = await createBrokerageLead(actor, parsed.lead, "create");
    if (!created.ok) return { ok: false, error: copy.genericError, issues: [] };
    revalidateLeads(created.id);
    return { ok: true, id: created.id };
  }
  const updated = await updateBrokerageLead(actor, id, parsed.lead);
  if (!updated.ok) {
    if (updated.error === "forbidden") return { ok: false, error: copy.editDenied, issues: [] };
    if (updated.error === "not_found") return { ok: false, error: copy.notFound, issues: [] };
    return { ok: false, error: copy.genericError, issues: [] };
  }
  revalidateLeads(id);
  return { ok: true, id };
}

export async function deleteLeadAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const copy = crmCopy(await getLocale());
  const actor = await requireCrmActor();
  // Refuse before any database call. The SQL trigger also rejects raw deletes.
  if (!actor || !canDeleteLeads(actor)) return { ok: false, error: copy.deleteDenied };
  const result = await deleteBrokerageLead(actor, id);
  if (!result.ok) {
    if (result.error === "forbidden") return { ok: false, error: copy.deleteDenied };
    if (result.error === "not_found") return { ok: false, error: copy.notFound };
    return { ok: false, error: copy.genericError };
  }
  revalidateLeads();
  return { ok: true };
}

export async function previewLeadImportAction(
  rows: Array<{ rowNumber: number; values: Partial<Record<LeadField, string>> }>,
) {
  const copy = crmCopy(await getLocale());
  const actor = await requireCrmActor();
  if (!actor) return { ok: false as const, error: copy.unauthorized };
  if (rows.length > IMPORT_ROW_LIMIT) return { ok: false as const, error: copy.tooMany.replace("{max}", String(IMPORT_ROW_LIMIT)) };
  const preview = await previewLeadImport(rows);
  if (!preview.ok) return { ok: false as const, error: copy.genericError };
  return { ok: true as const, rows: preview.rows };
}

export async function importLeadsAction(
  rows: Array<{ rowNumber: number; values: Partial<Record<LeadField, string>> }>,
): Promise<{ ok: true; imported: number; skipped: number } | { ok: false; error: string }> {
  const copy = crmCopy(await getLocale());
  const actor = await requireCrmActor();
  if (!actor) return { ok: false, error: copy.unauthorized };
  const result = await importBrokerageLeads(actor, rows);
  if (!result.ok) return { ok: false, error: result.error === "too_many" ? copy.tooMany.replace("{max}", String(IMPORT_ROW_LIMIT)) : copy.genericError };
  revalidateLeads();
  return { ok: true, imported: result.imported, skipped: result.skipped };
}

export async function exportLeadsAction(filters: LeadListFilters): Promise<{ ok: true; csv: string } | { ok: false; error: string }> {
  const copy = crmCopy(await getLocale());
  const actor = await requireCrmActor();
  if (!actor) return { ok: false, error: copy.unauthorized };
  const safe = parseLeadFilters(
    {
      q: filters.q,
      status: filters.status,
      country: filters.country,
      market: filters.market,
      agent: filters.agentId,
      scope: filters.scope,
      sort: filters.sort,
      dir: filters.dir,
    },
    actor,
  );
  const leads = await exportBrokerageLeads(actor, safe);
  const headers = [
    "Decision maker name",
    "Position",
    "Cell phone",
    "Email",
    "Brokerage name",
    "Brokerage website",
    "Brokerage address",
    "Office phone",
    "Latitude",
    "Longitude",
    "Country",
    "Market",
    "Status",
    "Notes",
    "Agent",
    "Created at",
  ];
  const csv = toCsv(
    headers,
    leads.map((lead) => [
      lead.decisionMakerName,
      lead.position.replaceAll("_", " "),
      lead.cellPhone,
      lead.email,
      lead.brokerageName,
      lead.brokerageWebsite,
      lead.brokerageAddress,
      lead.officePhone,
      lead.latitude,
      lead.longitude,
      lead.country,
      lead.market,
      lead.status.replaceAll("_", " "),
      lead.notes,
      lead.createdByName,
      lead.createdAt,
    ]),
  );
  return { ok: true, csv };
}

export async function leadTemplateAction(): Promise<string> {
  const actor = await requireCrmActor();
  if (!actor) return "";
  return toCsv(
    [
      "Decision maker name",
      "Position",
      "Cell phone",
      "Email",
      "Brokerage name",
      "Brokerage website",
      "Brokerage address",
      "Office phone",
      "Latitude",
      "Longitude",
      "Country",
      "Market",
      "Status",
      "Notes",
    ],
    [],
  );
}
