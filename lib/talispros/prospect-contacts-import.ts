import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { proposeFastCode, RESERVED_FAST_CODES } from "@/lib/talispros/fast-code-tracker";
import { loadTakenCodes } from "@/lib/talispros/fast-code-daily-job";
import { recordFastCodeUpdate } from "@/lib/talispros/fast-code-tracker-server";
import {
  parseProspectImportCsv,
  planProspectImport,
  type CsvContactRow,
  type ImportPlan,
  type LeadSnapshot,
  type PlanItem,
  type ProspectCountry,
  type QueueSnapshot,
} from "@/lib/talispros/prospect-approval";

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

export type ProspectCsvRow = {
  fast_code: string;
  brokerage_name: string;
  first_name: string;
  last_name: string;
  position: string;
  phone: string;
  phone_type: string;
  email: string;
  town: string;
  province: string;
  status: string;
  source_url: string;
};

export type ProspectImportPreview = {
  matched: number;
  newCa: number;
  newUs: number;
  incomplete: number;
  contactIncomplete: number;
  overwrites: ImportPlan["overwrites"];
  skipped: { line: number; brokerage: string; reason: PlanItem extends { reason: infer R } ? R : string }[];
  created: { line: number; brokerage: string; town: string | null; country: ProspectCountry }[];
};

export type ProspectImportReport = {
  queueUpdated: { id: string; brokerage: string; oldCode: string | null; newCode: string | null }[];
  leadsFilled: { fastCode: string; fields: string[] }[];
  nameMismatches: { fastCode: string; storedName: string; csvName: string }[];
  skipped: string[];
  errors: string[];
  dryRun: boolean;
  preview: ProspectImportPreview;
};

export function parseProspectContactsCsv(text: string): ProspectCsvRow[] {
  return parseProspectImportCsv(text).map((row) => ({
    fast_code: row.matchToken,
    brokerage_name: row.brokerage,
    first_name: row.firstName,
    last_name: row.lastName,
    position: row.position,
    phone: row.phone,
    phone_type: row.format,
    email: row.email,
    town: row.town,
    province: row.region,
    status: row.statusNote,
    source_url: row.sourceUrl,
  }));
}

async function mapsiteIssuedCodes(): Promise<Set<string>> {
  const { data } = await db().from("mapsites").select("fast_code").not("fast_code", "is", null);
  return new Set(
    ((data ?? []) as { fast_code: string | null }[])
      .map((r) => r.fast_code?.trim().toLowerCase())
      .filter((c): c is string => Boolean(c)),
  );
}

const QUEUE_COLUMNS =
  "id, brokerage, town, province, status, proposed_code, contact_first_name, contact_last_name, contact_name, contact_phone, contact_email, contact_position, office_phone, office_address, website, source_url, research_notes, assigned_agent_id, country";

function emptyPreview(): ProspectImportPreview {
  return { matched: 0, newCa: 0, newUs: 0, incomplete: 0, contactIncomplete: 0, overwrites: [], skipped: [], created: [] };
}

function previewFromPlan(plan: ImportPlan): ProspectImportPreview {
  return {
    matched: plan.matched,
    newCa: plan.newCa,
    newUs: plan.newUs,
    incomplete: plan.incomplete,
    contactIncomplete: plan.contactIncomplete,
    overwrites: plan.overwrites,
    skipped: plan.items.flatMap((item) =>
      item.kind === "incomplete" ? [{ line: item.line, brokerage: item.brokerage, reason: item.reason }] : [],
    ),
    created: plan.items.flatMap((item) =>
      item.kind === "new"
        ? [{ line: item.line, brokerage: item.draft.brokerage, town: item.draft.town, country: item.country }]
        : [],
    ),
  };
}

async function loadQueueSnapshots(): Promise<{ rows: QueueSnapshot[]; agents: Map<string, string | null> }> {
  let res = await db().from("prospect_queue").select(QUEUE_COLUMNS);
  if (res.error && /country/i.test(res.error.message)) {
    res = await db().from("prospect_queue").select(QUEUE_COLUMNS.replace(", country", ""));
  }
  if (res.error) throw new Error(res.error.message);
  const agents = new Map<string, string | null>();
  const rows = ((res.data ?? []) as (QueueSnapshot & { assigned_agent_id?: string | null })[]).map((row) => {
    agents.set(row.id, row.assigned_agent_id ?? null);
    return {
      id: row.id,
      brokerage: row.brokerage,
      town: row.town,
      province: row.province,
      country: row.country === "US" ? "US" : "CA",
      status: row.status,
      proposed_code: row.proposed_code,
      contact_first_name: row.contact_first_name,
      contact_last_name: row.contact_last_name,
      contact_name: row.contact_name,
      contact_phone: row.contact_phone,
      contact_email: row.contact_email,
      contact_position: row.contact_position,
      office_phone: row.office_phone,
      office_address: row.office_address,
      website: row.website,
      source_url: row.source_url,
      research_notes: row.research_notes,
    } satisfies QueueSnapshot;
  });
  return { rows, agents };
}

async function loadLeadSnapshots(codes: string[]): Promise<LeadSnapshot[]> {
  if (!codes.length) return [];
  const { data } = await db()
    .from("brokerage_leads")
    .select("fast_code, decision_maker_name, cell_phone, office_phone, email")
    .in("fast_code", codes);
  return ((data ?? []) as {
    fast_code: string;
    decision_maker_name: string | null;
    cell_phone: string | null;
    office_phone: string | null;
    email: string | null;
  }[]).map((row) => ({
    fastCode: row.fast_code.toLowerCase(),
    decisionMakerName: row.decision_maker_name,
    cellPhone: row.cell_phone,
    officePhone: row.office_phone,
    email: row.email,
  }));
}

async function writeQueue(id: string | null, payload: Record<string, unknown>, insert: boolean): Promise<{ id: string | null; error: string | null }> {
  const attempt = async (body: Record<string, unknown>) => {
    if (insert) {
      const res = await db().from("prospect_queue").insert(body).select("id").maybeSingle();
      return { id: (res.data as { id?: string } | null)?.id ?? null, error: res.error?.message ?? null };
    }
    const res = await db().from("prospect_queue").update(body).eq("id", id!);
    return { id, error: res.error?.message ?? null };
  };
  let result = await attempt(payload);
  if (result.error && /country/i.test(result.error)) {
    const { country: _country, ...rest } = payload;
    void _country;
    result = await attempt(rest);
  }
  return result;
}

async function applyPlanItem(
  item: PlanItem,
  actor: string,
  agents: Map<string, string | null>,
  report: ProspectImportReport,
): Promise<void> {
  if (item.kind === "incomplete") {
    report.skipped.push(`${item.brokerage || "row " + item.line}: ${item.reason}`);
    return;
  }
  if (item.kind === "matched" && item.target === "lead" && item.fastCode) {
    const fields = Object.keys(item.patch);
    if (!fields.length) {
      report.skipped.push(`${item.fastCode}: no empty contact fields to fill`);
      return;
    }
    const { error } = await db()
      .from("brokerage_leads")
      .update({ ...item.patch, updated_at: new Date().toISOString(), updated_by_name: "prospect-csv-import" })
      .eq("fast_code", item.fastCode);
    if (error) {
      report.errors.push(`lead ${item.fastCode}: ${error.message}`);
      return;
    }
    report.leadsFilled.push({ fastCode: item.fastCode, fields });
    for (const change of item.changes) {
      if (change.field === "first_name" && change.from && !change.apply) {
        report.nameMismatches.push({ fastCode: item.fastCode, storedName: change.from, csvName: change.to });
      }
    }
    return;
  }
  if (item.kind === "matched" && item.target === "queue" && item.queueId && !item.queueId.startsWith("new:")) {
    const codeChange = item.changes.find((c) => c.field === "proposed_code" && c.apply);
    if (!Object.keys(item.patch).length) {
      report.queueUpdated.push({
        id: item.queueId,
        brokerage: item.brokerage,
        oldCode: codeChange?.from || null,
        newCode: codeChange?.to || item.fastCode,
      });
      return;
    }
    const written = await writeQueue(item.queueId, item.patch, false);
    if (written.error) {
      report.errors.push(`queue ${item.queueId}: ${written.error}`);
      return;
    }
    const oldCode = codeChange?.from ? codeChange.from.toLowerCase() : item.fastCode;
    const newCode = (item.patch.proposed_code as string | null | undefined) ?? item.fastCode;
    report.queueUpdated.push({
      id: item.queueId,
      brokerage: item.brokerage,
      oldCode: oldCode ? oldCode.toLowerCase() : null,
      newCode: newCode ? newCode.toLowerCase() : null,
    });
    if (codeChange && newCode && oldCode?.toLowerCase() !== newCode.toLowerCase()) {
      await recordFastCodeUpdate({
        fastCode: newCode,
        agentId: agents.get(item.queueId) ?? null,
        eventType: "note",
        note: `Code corrected to decision-maker initials${oldCode ? ` (was ${oldCode.toLowerCase()})` : ""}`,
        details: { queueId: item.queueId, from: oldCode, to: newCode, reason: "person_initials" },
        createdBy: actor,
      });
    }
    return;
  }
  if (item.kind === "new") {
    const written = await writeQueue(null, item.draft, true);
    if (written.error || !written.id) {
      report.errors.push(`${item.draft.brokerage}: ${written.error ?? "insert failed"}`);
      return;
    }
    report.queueUpdated.push({
      id: written.id,
      brokerage: item.draft.brokerage,
      oldCode: null,
      newCode: item.draft.proposed_code,
    });
    if (item.draft.proposed_code) {
      await recordFastCodeUpdate({
        fastCode: item.draft.proposed_code,
        agentId: null,
        eventType: "note",
        note: "Code set from decision-maker initials",
        details: { queueId: written.id, from: null, to: item.draft.proposed_code, reason: "person_initials" },
        createdBy: actor,
      });
    }
  }
}

/**
 * Admin CSV import for the review queue and empty lead fields on built Mapsites.
 * Pass dryRun to preview matched, new and skipped rows without writing.
 * Issued Mapsite FAST Codes and non-empty lead values are never replaced.
 */
export async function importProspectContactsCsv(
  text: string,
  actor: string,
  opts?: { dryRun?: boolean },
): Promise<ProspectImportReport> {
  const dryRun = opts?.dryRun !== false;
  const report: ProspectImportReport = {
    queueUpdated: [],
    leadsFilled: [],
    nameMismatches: [],
    skipped: [],
    errors: [],
    dryRun,
    preview: emptyPreview(),
  };
  let rows: CsvContactRow[] = [];
  try {
    rows = parseProspectImportCsv(text);
  } catch (e) {
    report.errors.push(e instanceof Error ? e.message : String(e));
    return report;
  }
  if (!rows.length) {
    report.errors.push("CSV has no data rows");
    return report;
  }
  const issued = await mapsiteIssuedCodes();
  const { rows: queue, agents } = await loadQueueSnapshots();
  const codes = [...new Set(rows.map((row) => row.matchToken.trim().toLowerCase()).filter((code) => issued.has(code)))];
  const [leads, taken] = await Promise.all([loadLeadSnapshots(codes), loadTakenCodes()]);
  for (const reserved of RESERVED_FAST_CODES) taken.add(reserved);
  const plan = planProspectImport({ rows, queue, issuedCodes: issued, leads, takenCodes: taken });
  report.preview = previewFromPlan(plan);
  if (dryRun) {
    report.skipped = report.preview.skipped.map((row) => `${row.brokerage || "row " + row.line}: ${row.reason}`);
    return report;
  }
  for (const item of plan.items) {
    await applyPlanItem(item, actor, agents, report);
  }
  const seen = new Set<string>();
  report.nameMismatches = report.nameMismatches.filter((m) => {
    const key = `${m.fastCode}|${m.storedName}|${m.csvName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return report;
}

/** Re-derive brokerage-based queue codes that were never issued as Mapsites. */
export async function fixBrokerageDerivedQueueCodes(actor: string): Promise<ProspectImportReport> {
  const report: ProspectImportReport = {
    queueUpdated: [],
    leadsFilled: [],
    nameMismatches: [],
    skipped: [],
    errors: [],
    dryRun: false,
    preview: emptyPreview(),
  };
  const issued = await mapsiteIssuedCodes();
  const taken = await loadTakenCodes();
  const { data: queueRows } = await db()
    .from("prospect_queue")
    .select("id, brokerage, contact_name, contact_first_name, contact_last_name, proposed_code, assigned_agent_id, status");
  for (const q of (queueRows ?? []) as {
    id: string;
    brokerage: string;
    contact_name: string | null;
    contact_first_name: string | null;
    contact_last_name: string | null;
    proposed_code: string | null;
    assigned_agent_id: string | null;
    status: string;
  }[]) {
    const code = q.proposed_code?.toLowerCase() ?? null;
    if (code && issued.has(code)) {
      report.skipped.push(`${code}: issued Mapsite — left unchanged`);
      continue;
    }
    const name =
      (q.contact_first_name && q.contact_last_name
        ? `${q.contact_first_name} ${q.contact_last_name}`
        : null) || q.contact_name;
    if (code) taken.delete(code);
    const resolved = name ? proposeFastCode(name, taken) : null;
    if (code && resolved && code === resolved) {
      taken.add(resolved);
      continue;
    }
    if (!name) {
      if (!code) continue;
      const { error } = await db().from("prospect_queue").update({ proposed_code: null }).eq("id", q.id);
      if (error) report.errors.push(`${q.id}: ${error.message}`);
      else {
        report.queueUpdated.push({ id: q.id, brokerage: q.brokerage, oldCode: code, newCode: null });
        await recordFastCodeUpdate({
          fastCode: code,
          agentId: q.assigned_agent_id,
          eventType: "note",
          note: "Code cleared: decision maker name needed (was brokerage-derived)",
          details: { queueId: q.id, from: code, to: null, reason: "person_initials" },
          createdBy: actor,
        });
      }
      continue;
    }
    if (resolved) taken.add(resolved);
    if ((code ?? null) === (resolved ?? null)) continue;
    const { error } = await db().from("prospect_queue").update({ proposed_code: resolved }).eq("id", q.id);
    if (error) report.errors.push(`${q.id}: ${error.message}`);
    else {
      report.queueUpdated.push({ id: q.id, brokerage: q.brokerage, oldCode: code, newCode: resolved });
      if (resolved) {
        await recordFastCodeUpdate({
          fastCode: resolved,
          agentId: q.assigned_agent_id,
          eventType: "note",
          note: `Code set from decision-maker initials${code ? ` (was ${code})` : ""}`,
          details: { queueId: q.id, from: code, to: resolved, reason: "person_initials" },
          createdBy: actor,
        });
      }
    }
  }
  return report;
}
