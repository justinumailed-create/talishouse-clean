import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  displayContactName,
  personNamePartsFromFirstLast,
  proposeFastCode,
  proposeFastCodeFromParts,
  RESERVED_FAST_CODES,
} from "@/lib/talispros/fast-code-tracker";
import { loadTakenCodes } from "@/lib/talispros/fast-code-daily-job";
import { recordFastCodeUpdate } from "@/lib/talispros/fast-code-tracker-server";
import { parseCsv } from "@/lib/crm-leads/model";

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

export type ProspectImportReport = {
  queueUpdated: { id: string; brokerage: string; oldCode: string | null; newCode: string | null }[];
  leadsFilled: { fastCode: string; fields: string[] }[];
  nameMismatches: { fastCode: string; storedName: string; csvName: string }[];
  skipped: string[];
  errors: string[];
};

const COLS = [
  "fast_code",
  "brokerage_name",
  "first_name",
  "last_name",
  "position",
  "phone",
  "phone_type",
  "email",
  "town",
  "province",
  "status",
  "source_url",
] as const;

function headerIndex(head: string[]): Record<(typeof COLS)[number], number> {
  const norm = (s: string) => s.replace(/^\uFEFF/, "").trim().toLowerCase();
  const map = Object.fromEntries(COLS.map((c) => [c, -1])) as Record<(typeof COLS)[number], number>;
  head.forEach((h, i) => {
    const key = norm(h) as (typeof COLS)[number];
    if (key in map) map[key] = i;
  });
  return map;
}

function cell(row: string[], idx: number): string {
  if (idx < 0 || idx >= row.length) return "";
  return (row[idx] ?? "").trim();
}

function isPlaceholderEmail(email: string | null | undefined): boolean {
  const e = (email ?? "").trim().toLowerCase();
  return !e || e === "claim@talispros.com";
}

function phoneBuckets(phone: string, phoneType: string): { cell: string | null; office: string | null } {
  const p = phone.trim();
  if (!p) return { cell: null, office: null };
  const t = phoneType.toLowerCase();
  if (/\bcell\b|\bmobile\b|personal|direct/.test(t) && !/\boffice\b/.test(t)) return { cell: p, office: null };
  if (/\boffice\b/.test(t) && !/\bcell\b|\bmobile\b|direct/.test(t)) return { cell: null, office: p };
  if (/\bcell\b|\bmobile\b|direct/.test(t)) return { cell: p, office: null };
  return { cell: null, office: p };
}

export function parseProspectContactsCsv(text: string): ProspectCsvRow[] {
  const table = parseCsv(text);
  if (table.length < 2) return [];
  const idx = headerIndex(table[0] ?? []);
  if (idx.fast_code < 0) throw new Error("CSV missing fast_code column");
  const rows: ProspectCsvRow[] = [];
  for (const raw of table.slice(1)) {
    if (!raw.some((c) => c.trim())) continue;
    rows.push({
      fast_code: cell(raw, idx.fast_code),
      brokerage_name: cell(raw, idx.brokerage_name),
      first_name: cell(raw, idx.first_name),
      last_name: cell(raw, idx.last_name),
      position: cell(raw, idx.position),
      phone: cell(raw, idx.phone),
      phone_type: cell(raw, idx.phone_type),
      email: cell(raw, idx.email),
      town: cell(raw, idx.town),
      province: cell(raw, idx.province),
      status: cell(raw, idx.status),
      source_url: cell(raw, idx.source_url),
    });
  }
  return rows;
}

async function mapsiteIssuedCodes(): Promise<Set<string>> {
  const { data } = await db().from("mapsites").select("fast_code").not("fast_code", "is", null);
  return new Set(
    ((data ?? []) as { fast_code: string | null }[])
      .map((r) => r.fast_code?.trim().toLowerCase())
      .filter((c): c is string => Boolean(c)),
  );
}

async function updateQueueContact(
  rowId: string,
  row: ProspectCsvRow,
  taken: Set<string>,
  actor: string,
  report: ProspectImportReport,
  oldCode: string | null,
  brokerage: string,
  assignedAgentId: string | null,
  holdCodePendingReview = false,
): Promise<void> {
  const parts = personNamePartsFromFirstLast(row.first_name || null, row.last_name || null);
  const contactName = parts ? displayContactName(parts) : null;
  const phones = phoneBuckets(row.phone, row.phone_type);

  // Free the old proposed code from the taken set when regenerating.
  if (oldCode) taken.delete(oldCode.toLowerCase());
  // Dual decision-makers / branch ambiguity: fill contacts but leave code pending.
  const newCode =
    holdCodePendingReview
      ? null
      : parts && row.first_name && row.last_name
        ? proposeFastCodeFromParts(row.first_name, row.last_name, taken)
        : null;
  if (newCode) taken.add(newCode);

  const patch: Record<string, unknown> = {
    contact_first_name: row.first_name || null,
    contact_last_name: row.last_name || null,
    contact_name: contactName,
    contact_position: row.position || null,
    contact_phone: phones.cell || phones.office || row.phone || null,
    contact_email: row.email || null,
    proposed_code: newCode,
  };
  if (row.town) patch.town = row.town;
  if (row.province) patch.province = row.province;
  if (row.source_url) patch.source_url = row.source_url;

  const { error } = await db().from("prospect_queue").update(patch).eq("id", rowId);
  if (error) {
    report.errors.push(`queue ${rowId}: ${error.message}`);
    return;
  }

  if (oldCode?.toLowerCase() !== (newCode ?? "").toLowerCase()) {
    report.queueUpdated.push({
      id: rowId,
      brokerage,
      oldCode: oldCode ? oldCode.toLowerCase() : null,
      newCode,
    });
    if (newCode) {
      await recordFastCodeUpdate({
        fastCode: newCode,
        agentId: assignedAgentId,
        eventType: "note",
        note: `Code corrected to decision-maker initials${oldCode ? ` (was ${oldCode.toLowerCase()})` : ""}`,
        details: { queueId: rowId, from: oldCode, to: newCode, reason: "person_initials" },
        createdBy: actor,
      });
    } else if (oldCode) {
      await recordFastCodeUpdate({
        fastCode: oldCode,
        agentId: assignedAgentId,
        eventType: "note",
        note: "Code cleared: decision maker name needed",
        details: { queueId: rowId, from: oldCode, to: null, reason: "person_initials" },
        createdBy: actor,
      });
    }
  } else {
    report.queueUpdated.push({
      id: rowId,
      brokerage,
      oldCode: oldCode ? oldCode.toLowerCase() : null,
      newCode,
    });
  }
}

async function fillLeadEmptyFields(row: ProspectCsvRow, report: ProspectImportReport): Promise<void> {
  const code = row.fast_code.trim().toLowerCase();
  const { data: lead } = await db()
    .from("brokerage_leads")
    .select("id, decision_maker_name, position, cell_phone, email, office_phone")
    .eq("fast_code", code)
    .maybeSingle();
  if (!lead) {
    report.skipped.push(`${code}: no brokerage_leads row`);
    return;
  }
  const leadRow = lead as {
    id: string;
    decision_maker_name: string;
    position: string;
    cell_phone: string | null;
    email: string | null;
    office_phone: string | null;
  };

  const csvName = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
  const stored = (leadRow.decision_maker_name ?? "").trim();
  if (csvName && stored) {
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ");
    // Exact or "stored contains csv" / "csv is subset of stored" (e.g. John vs John Duncan Knox)
    const sn = norm(stored);
    const cn = norm(csvName);
    if (sn !== cn && !sn.includes(cn) && !cn.includes(sn)) {
      report.nameMismatches.push({ fastCode: code, storedName: stored, csvName });
    } else if (sn !== cn) {
      // Soft mismatch (middle names): list but do not change.
      report.nameMismatches.push({ fastCode: code, storedName: stored, csvName });
    }
  }

  const phones = phoneBuckets(row.phone, row.phone_type);
  const patch: Record<string, unknown> = {};
  const filled: string[] = [];

  // Never overwrite non-empty values. Treat claim@ placeholder as empty for fill.
  if (!leadRow.cell_phone && phones.cell) {
    patch.cell_phone = phones.cell;
    filled.push("cell_phone");
  }
  if (!leadRow.office_phone && phones.office) {
    patch.office_phone = phones.office;
    filled.push("office_phone");
  }
  // If phone_type was ambiguous and both empty, prefer cell when type mentions direct/cell else office.
  if (!leadRow.cell_phone && !leadRow.office_phone && row.phone && !phones.cell && !phones.office) {
    patch.office_phone = row.phone;
    filled.push("office_phone");
  }
  if (isPlaceholderEmail(leadRow.email) && row.email) {
    // Only fill when stored email is empty/placeholder; never overwrite a real email.
    if (!leadRow.email || isPlaceholderEmail(leadRow.email)) {
      // Task: never overwrite non-empty. claim@ is non-empty string — leave it.
      // Only fill truly empty email.
    }
  }
  if (!(leadRow.email ?? "").trim() && row.email) {
    patch.email = row.email.toLowerCase();
    filled.push("email");
  }
  // Position already required on leads; skip if set.

  if (!filled.length) {
    report.skipped.push(`${code}: no empty contact fields to fill`);
    return;
  }
  const { error } = await db()
    .from("brokerage_leads")
    .update({ ...patch, updated_at: new Date().toISOString(), updated_by_name: "prospect-csv-import" })
    .eq("id", leadRow.id);
  if (error) {
    report.errors.push(`lead ${code}: ${error.message}`);
    return;
  }
  report.leadsFilled.push({ fastCode: code, fields: filled });
}

/**
 * Admin CSV import for prospect queue + empty lead CRM fields on built Mapsites.
 * Never changes issued Mapsite FAST Codes or owner names. Never deletes.
 */
export async function importProspectContactsCsv(
  text: string,
  actor: string,
): Promise<ProspectImportReport> {
  const report: ProspectImportReport = {
    queueUpdated: [],
    leadsFilled: [],
    nameMismatches: [],
    skipped: [],
    errors: [],
  };
  const rows = parseProspectContactsCsv(text);
  if (!rows.length) {
    report.errors.push("CSV has no data rows");
    return report;
  }

  const issued = await mapsiteIssuedCodes();
  const taken = await loadTakenCodes();
  // Also treat reserved as taken.
  for (const r of RESERVED_FAST_CODES) taken.add(r);

  const { data: queueRows } = await db()
    .from("prospect_queue")
    .select("id, brokerage, contact_name, proposed_code, assigned_agent_id, status, research_notes");
  type QueueRow = {
    id: string;
    brokerage: string;
    contact_name: string | null;
    proposed_code: string | null;
    assigned_agent_id: string | null;
    status: string;
    research_notes: string | null;
  };
  const queueList = (queueRows ?? []) as QueueRow[];
  const byId = new Map(queueList.map((q) => [q.id, q]));
  const byCode = new Map<string, QueueRow>();
  for (const q of queueList) {
    if (q.proposed_code) byCode.set(q.proposed_code.toLowerCase(), q);
  }

  // Also compare mapsite agent names for mismatches when we have a lead or mapsite.
  const { data: maps } = await db()
    .from("mapsites")
    .select("fast_code, agent_name")
    .not("fast_code", "is", null);
  const mapNames = new Map(
    ((maps ?? []) as { fast_code: string; agent_name: string | null }[]).map((m) => [
      m.fast_code.toLowerCase(),
      (m.agent_name ?? "").trim(),
    ]),
  );

  for (const row of rows) {
    const key = row.fast_code.trim();
    if (!key) {
      report.skipped.push("row with empty fast_code");
      continue;
    }

    // partial status: skip blank fields (handled by only writing non-empty CSV values)
    if (key.toLowerCase().startsWith("pq:")) {
      const id = key.slice(3).trim();
      const q = byId.get(id);
      if (!q) {
        report.errors.push(`unknown queue id ${id}`);
        continue;
      }
      const hold = /needs review|code pending/i.test(q.research_notes ?? "");
      await updateQueueContact(q.id, row, taken, actor, report, q.proposed_code, q.brokerage, q.assigned_agent_id, hold);
      continue;
    }

    const code = key.toLowerCase();
    if (issued.has(code)) {
      const storedMapName = mapNames.get(code) ?? "";
      const csvName = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
      if (csvName && storedMapName) {
        const sn = storedMapName.toLowerCase().replace(/\s+/g, " ");
        const cn = csvName.toLowerCase().replace(/\s+/g, " ");
        if (sn !== cn) {
          report.nameMismatches.push({ fastCode: code, storedName: storedMapName, csvName });
        }
      }
      await fillLeadEmptyFields(row, report);
      continue;
    }

    const q = byCode.get(code);
    if (q) {
      // Queue-only code (not issued as Mapsite) — safe to re-derive from person name.
      const hold = /needs review|code pending/i.test(q.research_notes ?? "");
      await updateQueueContact(q.id, row, taken, actor, report, q.proposed_code, q.brokerage, q.assigned_agent_id, hold);
      continue;
    }

    report.skipped.push(`${code}: not a queue row or known Mapsite lead target`);
  }

  // Dedupe name mismatches
  const seen = new Set<string>();
  report.nameMismatches = report.nameMismatches.filter((m) => {
    const k = `${m.fastCode}|${m.storedName}|${m.csvName}`;
    if (seen.has(k)) return false;
    seen.add(k);
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
