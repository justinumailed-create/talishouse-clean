/**
 * Pure rules for the admin "Leads to approve" table and the research CSV import.
 * No database and no Next.js. Contact approval requires a decision-maker name,
 * a phone and an email. FAST Codes still come from the person's initials.
 */

import { parseCsv } from "@/lib/crm-leads/model";
import {
  displayContactName,
  personNamePartsFromFirstLast,
  proposeFastCodeFromParts,
} from "@/lib/talispros/fast-code-tracker";

export const PROSPECT_COUNTRIES = ["CA", "US"] as const;
export type ProspectCountry = (typeof PROSPECT_COUNTRIES)[number];

export const LEAD_FILTERS = [
  "pending",
  "code_pending",
  "needs_review",
  "approved",
  "rejected",
  "on_hold",
] as const;
export type LeadFilter = (typeof LEAD_FILTERS)[number];

export type ContactGap = "name" | "phone" | "email";

export type ApprovalLead = {
  id: string;
  brokerage: string;
  town: string | null;
  province: string | null;
  country: ProspectCountry;
  status: string;
  proposed_code: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_position: string | null;
  research_notes: string | null;
  created_at: string;
};

const CA_REGIONS = new Set([
  "NL", "NF", "NFLD", "PE", "PEI", "NB", "QC", "ON", "MB", "SK", "AB", "BC", "NS", "NT", "NU", "YT",
  "NEWFOUNDLAND AND LABRADOR", "PRINCE EDWARD ISLAND", "NEW BRUNSWICK", "QUEBEC", "ONTARIO",
  "MANITOBA", "SASKATCHEWAN", "ALBERTA", "BRITISH COLUMBIA", "NOVA SCOTIA",
  "NORTHWEST TERRITORIES", "NUNAVUT", "YUKON",
]);

const US_REGIONS = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY",
  "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND",
  "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
]);

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

export function countryFromRegion(
  region: string | null | undefined,
  hint?: "state" | "province",
): ProspectCountry {
  const code = (region ?? "").trim().toUpperCase();
  if (US_REGIONS.has(code) && !CA_REGIONS.has(code)) return "US";
  if (CA_REGIONS.has(code)) return "CA";
  if (hint === "state") return "US";
  return "CA";
}

export function isLeadFilter(value: string | null | undefined): value is LeadFilter {
  return Boolean(value) && (LEAD_FILTERS as readonly string[]).includes(value as string);
}

export function contactGaps(input: {
  contact_first_name?: string | null;
  contact_last_name?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
}): ContactGap[] {
  const first = (input.contact_first_name ?? "").trim();
  const last = (input.contact_last_name ?? "").trim();
  const name = (input.contact_name ?? "").trim();
  const phone = (input.contact_phone ?? "").trim();
  const email = (input.contact_email ?? "").trim();
  const gaps: ContactGap[] = [];
  const named = Boolean((first && last) || /\S\s+\S/.test(name));
  if (!named) gaps.push("name");
  if (phone.replace(/\D/g, "").length < 7) gaps.push("phone");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) gaps.push("email");
  return gaps;
}

export function isCompleteContact(input: Parameters<typeof contactGaps>[0]): boolean {
  return contactGaps(input).length === 0;
}

/** Pending and on-hold rows with a full contact can be approved. Others are listed, not failed. */
export function partitionReview<T extends ApprovalLead>(
  rows: readonly T[],
  decision: "approved" | "rejected" | "on_hold",
): {
  allow: T[];
  blocked: { id: string; brokerage: string; missing: ContactGap[]; reason: "incomplete" | "closed" }[];
} {
  const allow: T[] = [];
  const blocked: { id: string; brokerage: string; missing: ContactGap[]; reason: "incomplete" | "closed" }[] = [];
  for (const row of rows) {
    const open = row.status === "pending" || row.status === "on_hold";
    if (!open) {
      blocked.push({ id: row.id, brokerage: row.brokerage, missing: [], reason: "closed" });
      continue;
    }
    if (decision === "approved") {
      const missing = contactGaps(row);
      if (missing.length) {
        blocked.push({ id: row.id, brokerage: row.brokerage, missing, reason: "incomplete" });
        continue;
      }
    }
    allow.push(row);
  }
  return { allow, blocked };
}

export function leadNeedsReview(row: { id: string; research_notes?: string | null }, flagged: ReadonlySet<string>): boolean {
  if (flagged.has(row.id)) return true;
  return /needs review/i.test(row.research_notes ?? "");
}

export function leadStatusKey(
  row: { id: string; status: string; proposed_code?: string | null; research_notes?: string | null },
  flagged: ReadonlySet<string>,
): LeadFilter {
  if (row.status === "approved" || row.status === "rejected" || row.status === "on_hold") return row.status;
  if (leadNeedsReview(row, flagged)) return "needs_review";
  if (!(row.proposed_code ?? "").trim()) return "code_pending";
  return "pending";
}

export function rowMatchesLeadFilter(
  row: ApprovalLead,
  filter: LeadFilter | null,
  flagged: ReadonlySet<string>,
): boolean {
  if (!filter) return true;
  if (filter === "pending") return row.status === "pending";
  if (filter === "code_pending") return row.status === "pending" && !(row.proposed_code ?? "").trim();
  if (filter === "needs_review") return leadNeedsReview(row, flagged) && row.status !== "approved" && row.status !== "rejected";
  return row.status === filter;
}

export function decisionMakerLabel(row: {
  contact_first_name?: string | null;
  contact_last_name?: string | null;
  contact_name?: string | null;
}): string {
  const first = (row.contact_first_name ?? "").trim();
  const last = (row.contact_last_name ?? "").trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return (row.contact_name ?? "").trim();
}

/** "Christopher (Chris) Dang" → Christopher / Dang. A single word has no last name. */
export function splitBrokerName(raw: string | null | undefined): { firstName: string; lastName: string } {
  const stripped = (raw ?? "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/,.*$/, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = stripped.split(" ").filter((w) => /\p{L}/u.test(w));
  if (words.length < 2) return { firstName: words[0] ?? "", lastName: "" };
  return { firstName: words[0]!, lastName: words.slice(1).join(" ") };
}

export function normalizeTownKey(town: string | null | undefined): string {
  return (town ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function compactBrokerageKey(name: string | null | undefined): string {
  const withoutParens = (name ?? "").replace(/\([^)]*\)/g, " ");
  return withoutParens
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(inc|ltd|lte|ltee|limited|llc|corp|corporation|co|the|inc\.|ltd\.)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "");
}

export function brokerageMatchScore(a: string, b: string): number {
  const ca = compactBrokerageKey(a);
  const cb = compactBrokerageKey(b);
  if (!ca || !cb) return 0;
  if (ca === cb) return 3;
  const shorter = ca.length <= cb.length ? ca : cb;
  const longer = ca.length <= cb.length ? cb : ca;
  if (shorter.length >= 12 && longer.startsWith(shorter)) return 2;
  return 0;
}

export function townsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeTownKey(a);
  const nb = normalizeTownKey(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length <= nb.length ? nb : na;
  return shorter.length >= 4 && (longer.startsWith(shorter) || longer.includes(` ${shorter}`));
}

export function queueIdsFromToken(token: string | null | undefined): string[] {
  const found = (token ?? "").match(UUID_RE) ?? [];
  return [...new Set(found.map((id) => id.toLowerCase()))];
}

export function fastCodeFromToken(token: string | null | undefined): string | null {
  const raw = (token ?? "").trim().toLowerCase();
  if (!raw || /\s/.test(raw) || raw.startsWith("pq:")) return null;
  if (queueIdsFromToken(raw).length) return null;
  if (/replacement|not in site/i.test(raw)) return null;
  if (/^[a-z][a-z0-9-]{1,16}$/.test(raw) && /\d/.test(raw)) return raw;
  return null;
}

export type ImportField =
  | "first_name"
  | "last_name"
  | "phone"
  | "email"
  | "position"
  | "town"
  | "province"
  | "office_phone"
  | "office_address"
  | "website"
  | "source_url"
  | "notes"
  | "proposed_code";

export type FieldChange = {
  field: ImportField;
  from: string;
  to: string;
  /** False when an existing value is shown and left as it is. */
  apply: boolean;
};

export type CsvContactRow = {
  line: number;
  format: "legacy" | "research";
  brokerage: string;
  firstName: string;
  lastName: string;
  position: string;
  phone: string;
  email: string;
  town: string;
  region: string;
  country: ProspectCountry;
  sourceUrl: string;
  website: string;
  officePhone: string;
  officeAddress: string;
  notes: string;
  market: string;
  rank: string;
  matchToken: string;
  statusNote: string;
};

export type QueueSnapshot = {
  id: string;
  brokerage: string;
  town: string | null;
  province: string | null;
  country?: ProspectCountry | null;
  status: string;
  proposed_code: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_position: string | null;
  office_phone: string | null;
  office_address: string | null;
  website: string | null;
  source_url: string | null;
  research_notes: string | null;
};

export type LeadSnapshot = {
  fastCode: string;
  decisionMakerName: string | null;
  cellPhone: string | null;
  officePhone: string | null;
  email: string | null;
};

export type NewQueueDraft = {
  brokerage: string;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_name: string | null;
  contact_position: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  office_phone: string | null;
  office_address: string | null;
  website: string | null;
  town: string | null;
  province: string | null;
  country: ProspectCountry;
  source_url: string;
  research_notes: string | null;
  market: string | null;
  market_rank: number | null;
  status: "pending";
  sourced_by: "TalisBOT™";
  proposed_code: string | null;
};

export type PlanItem =
  | {
      kind: "matched";
      line: number;
      brokerage: string;
      queueId: string | null;
      fastCode: string | null;
      target: "queue" | "lead";
      changes: FieldChange[];
      contactIncomplete: boolean;
      patch: Record<string, string | null>;
    }
  | { kind: "new"; line: number; country: ProspectCountry; draft: NewQueueDraft; contactIncomplete: boolean }
  | { kind: "incomplete"; line: number; brokerage: string; reason: "missing_brokerage" | "missing_source" | "ambiguous" | "empty" };

export type ImportPlan = {
  items: PlanItem[];
  matched: number;
  newCa: number;
  newUs: number;
  incomplete: number;
  contactIncomplete: number;
  overwrites: { line: number; brokerage: string; field: ImportField; from: string; to: string; apply: boolean }[];
};

function headerKey(value: string): string {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function cell(row: string[], idx: number): string {
  if (idx < 0 || idx >= row.length) return "";
  return (row[idx] ?? "").trim();
}

function indexHeaders(head: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  head.forEach((h, i) => {
    const key = headerKey(h);
    if (key && !(key in map)) map[key] = i;
  });
  return map;
}

function phoneBuckets(phone: string, phoneType: string): { cell: string; office: string } {
  const p = phone.trim();
  if (!p) return { cell: "", office: "" };
  const t = phoneType.toLowerCase();
  if (/\bcell\b|\bmobile\b|personal|direct/.test(t) && !/\boffice\b/.test(t)) return { cell: p, office: "" };
  if (/\boffice\b/.test(t) && !/\bcell\b|\bmobile\b|direct/.test(t)) return { cell: "", office: p };
  if (/\bcell\b|\bmobile\b|direct/.test(t)) return { cell: p, office: "" };
  return { cell: "", office: p };
}

export function parseProspectImportCsv(text: string): CsvContactRow[] {
  const table = parseCsv(text);
  if (table.length < 2) return [];
  const idx = indexHeaders(table[0] ?? []);
  const hasLegacy = "fast_code" in idx && ("first_name" in idx || "last_name" in idx);
  const hasResearch =
    "broker_name" in idx || "fast_code_or_prospect_id" in idx || "cell" in idx || ("state" in idx && "brokerage_name" in idx);
  if (!hasLegacy && !hasResearch && !("brokerage_name" in idx)) {
    throw new Error("CSV missing fast_code or brokerage_name column");
  }
  const format: CsvContactRow["format"] = hasLegacy && !hasResearch ? "legacy" : "research";
  const rows: CsvContactRow[] = [];
  for (let n = 1; n < table.length; n++) {
    const raw = table[n] ?? [];
    if (!raw.some((c) => c.trim())) continue;
    const brokerage = cell(raw, idx.brokerage_name ?? -1);
    const brokerName = cell(raw, idx.broker_name ?? -1);
    let firstName = cell(raw, idx.first_name ?? -1);
    let lastName = cell(raw, idx.last_name ?? -1);
    if ((!firstName || !lastName) && brokerName) {
      const split = splitBrokerName(brokerName);
      if (!firstName) firstName = split.firstName;
      if (!lastName) lastName = split.lastName;
    }
    const phoneCol = cell(raw, idx.phone ?? -1);
    const cellCol = cell(raw, idx.cell ?? -1);
    const phoneType = cell(raw, idx.phone_type ?? -1);
    const officeCol = cell(raw, idx.office_phone ?? -1);
    let phone = "";
    let officePhone = officeCol;
    if (format === "research") {
      phone = cellCol || phoneCol;
      officePhone = officeCol;
    } else {
      const buckets = phoneBuckets(phoneCol, phoneType);
      phone = buckets.cell || buckets.office || phoneCol;
      officePhone = officeCol || buckets.office;
      if (phone && officePhone && phone === officePhone && buckets.cell) officePhone = "";
    }
    const region = cell(raw, idx.province ?? -1) || cell(raw, idx.state ?? -1);
    const hint = "state" in idx && !("province" in idx) ? "state" : "province";
    const town = cell(raw, idx.town ?? -1) || cell(raw, idx.anchor_town ?? -1);
    const token = cell(raw, idx.fast_code_or_prospect_id ?? -1) || cell(raw, idx.fast_code ?? -1);
    const rank = cell(raw, idx.rank ?? -1);
    rows.push({
      line: n + 1,
      format,
      brokerage,
      firstName,
      lastName,
      position: cell(raw, idx.position ?? -1),
      phone,
      email: cell(raw, idx.email ?? -1),
      town,
      region,
      country: countryFromRegion(region, hint),
      sourceUrl: cell(raw, idx.source_url ?? -1),
      website: cell(raw, idx.website ?? -1),
      officePhone,
      officeAddress: cell(raw, idx.office_address ?? -1),
      notes: cell(raw, idx.notes ?? -1),
      market: cell(raw, idx.market ?? -1),
      rank,
      matchToken: token,
      statusNote: cell(raw, idx.status ?? -1),
    });
  }
  return rows;
}

function sameValue(field: ImportField, current: string, incoming: string): boolean {
  if (field === "email") return current.trim().toLowerCase() === incoming.trim().toLowerCase();
  if (field === "phone" || field === "office_phone") {
    const a = current.replace(/\D/g, "");
    const b = incoming.replace(/\D/g, "");
    if (a.length >= 7 && a === b) return true;
  }
  return current.trim().toLowerCase().replace(/\s+/g, " ") === incoming.trim().toLowerCase().replace(/\s+/g, " ");
}

function consider(
  changes: FieldChange[],
  field: ImportField,
  current: string | null | undefined,
  incoming: string,
  opts?: { contact?: boolean },
): void {
  const next = incoming.trim();
  if (!next) return;
  const prev = (current ?? "").trim();
  if (!prev) {
    changes.push({ field, from: "", to: field === "email" ? next.toLowerCase() : next, apply: true });
    return;
  }
  if (sameValue(field, prev, next)) return;
  // Contact fields are the point of the file: show them and apply on confirm.
  // Other non-empty values are shown and kept.
  const apply = Boolean(opts?.contact);
  changes.push({ field, from: prev, to: field === "email" ? next.toLowerCase() : next, apply });
}

function notesNeedReview(notes: string | null | undefined): boolean {
  return /needs review/i.test(notes ?? "");
}

function cloneQueue(row: QueueSnapshot): QueueSnapshot {
  return { ...row };
}

function pickQueueByIds(ids: string[], row: CsvContactRow, byId: Map<string, QueueSnapshot>): string | null {
  const existing = ids.filter((id) => byId.has(id));
  if (!existing.length) return null;
  const scored = existing
    .map((id) => {
      const q = byId.get(id)!;
      const score = brokerageMatchScore(q.brokerage, row.brokerage);
      const town = townsMatch(q.town, row.town) ? 1 : 0;
      return { id, score, town };
    })
    .sort((a, b) => b.score - a.score || b.town - a.town);
  const top = scored.filter((s) => s.score === scored[0]!.score && s.score > 0);
  if (top.length === 1) return top[0]!.id;
  if (top.length > 1) {
    const townHits = top.filter((s) => s.town);
    if (townHits.length === 1) return townHits[0]!.id;
    return null;
  }
  if (existing.length === 1) return existing[0]!;
  return null;
}

function pickQueueByName(row: CsvContactRow, queue: readonly QueueSnapshot[]): { id: string } | { ambiguous: true } | null {
  if (!row.brokerage || !row.town) return null;
  const hits = queue
    .map((q) => ({ id: q.id, score: brokerageMatchScore(q.brokerage, row.brokerage), town: townsMatch(q.town, row.town) }))
    .filter((h) => h.score > 0 && h.town);
  if (!hits.length) return null;
  const best = Math.max(...hits.map((h) => h.score));
  const top = hits.filter((h) => h.score === best);
  if (top.length > 1) return { ambiguous: true };
  return { id: top[0]!.id };
}

function contactOf(row: CsvContactRow) {
  return {
    contact_first_name: row.firstName,
    contact_last_name: row.lastName,
    contact_phone: row.phone,
    contact_email: row.email,
  };
}

function buildPatch(changes: FieldChange[], row: CsvContactRow, current: QueueSnapshot, taken: Set<string>): Record<string, string | null> {
  const patch: Record<string, string | null> = {};
  const applied = new Set(changes.filter((c) => c.apply).map((c) => c.field));
  if (applied.has("first_name")) patch.contact_first_name = row.firstName || null;
  if (applied.has("last_name")) patch.contact_last_name = row.lastName || null;
  if (applied.has("phone")) patch.contact_phone = row.phone || null;
  if (applied.has("email")) patch.contact_email = row.email.toLowerCase();
  if (applied.has("position")) patch.contact_position = row.position || null;
  if (applied.has("town")) patch.town = row.town || null;
  if (applied.has("province")) patch.province = row.region || null;
  if (applied.has("office_phone")) patch.office_phone = row.officePhone || null;
  if (applied.has("office_address")) patch.office_address = row.officeAddress || null;
  if (applied.has("website")) patch.website = row.website || null;
  if (applied.has("source_url")) patch.source_url = row.sourceUrl || null;
  if (applied.has("first_name") || applied.has("last_name")) {
    const first = applied.has("first_name") ? row.firstName : (current.contact_first_name ?? "");
    const last = applied.has("last_name") ? row.lastName : (current.contact_last_name ?? "");
    const parts = personNamePartsFromFirstLast(first, last);
    patch.contact_name = parts ? displayContactName(parts) : [first, last].filter(Boolean).join(" ") || null;
    const hold = notesNeedReview(current.research_notes) || notesNeedReview(row.notes);
    if (!hold && parts) {
      if (current.proposed_code) taken.delete(current.proposed_code.toLowerCase());
      const code = proposeFastCodeFromParts(first, last, taken);
      if (code && code.toLowerCase() !== (current.proposed_code ?? "").toLowerCase()) {
        patch.proposed_code = code;
        taken.add(code);
        changes.push({
          field: "proposed_code",
          from: current.proposed_code ?? "",
          to: code,
          apply: true,
        });
      } else if (current.proposed_code) {
        taken.add(current.proposed_code.toLowerCase());
      }
    }
  }
  if (applied.has("notes") || (row.notes && !(current.research_notes ?? "").includes(row.notes))) {
    const prev = (current.research_notes ?? "").trim();
    const next = prev ? `${prev}\n${row.notes}` : row.notes;
    if (row.notes && next !== prev) {
      patch.research_notes = next;
      if (!changes.some((c) => c.field === "notes")) {
        changes.push({ field: "notes", from: prev, to: next, apply: true });
      }
    }
  }
  return patch;
}

function queueChanges(row: CsvContactRow, current: QueueSnapshot): FieldChange[] {
  const changes: FieldChange[] = [];
  consider(changes, "first_name", current.contact_first_name, row.firstName, { contact: true });
  consider(changes, "last_name", current.contact_last_name, row.lastName, { contact: true });
  consider(changes, "phone", current.contact_phone, row.phone, { contact: true });
  consider(changes, "email", current.contact_email, row.email, { contact: true });
  consider(changes, "position", current.contact_position, row.position, { contact: true });
  consider(changes, "town", current.town, row.town);
  consider(changes, "province", current.province, row.region);
  consider(changes, "office_phone", current.office_phone, row.officePhone);
  consider(changes, "office_address", current.office_address, row.officeAddress);
  consider(changes, "website", current.website, row.website);
  consider(changes, "source_url", current.source_url, row.sourceUrl);
  if (row.notes && !(current.research_notes ?? "").includes(row.notes)) {
    const prev = (current.research_notes ?? "").trim();
    changes.push({ field: "notes", from: prev, to: prev ? `${prev}\n${row.notes}` : row.notes, apply: true });
  }
  return changes;
}

function applyChangesToSnapshot(snapshot: QueueSnapshot, patch: Record<string, string | null>): void {
  for (const [key, value] of Object.entries(patch)) {
    (snapshot as Record<string, string | null>)[key] = value;
  }
}

function draftFromRow(row: CsvContactRow, taken: Set<string>, queueNotes: string | null): NewQueueDraft {
  const parts = personNamePartsFromFirstLast(row.firstName, row.lastName);
  const hold = notesNeedReview(row.notes) || notesNeedReview(queueNotes);
  const proposed = !hold && parts ? proposeFastCodeFromParts(row.firstName, row.lastName, taken) : null;
  if (proposed) taken.add(proposed);
  const rank = /^\d+$/.test(row.rank) ? Number(row.rank) : null;
  return {
    brokerage: row.brokerage,
    contact_first_name: row.firstName || null,
    contact_last_name: row.lastName || null,
    contact_name: parts ? displayContactName(parts) : null,
    contact_position: row.position || null,
    contact_phone: row.phone || null,
    contact_email: row.email ? row.email.toLowerCase() : null,
    office_phone: row.officePhone || null,
    office_address: row.officeAddress || null,
    website: row.website || null,
    town: row.town || null,
    province: row.region || null,
    country: row.country,
    source_url: row.sourceUrl,
    research_notes: row.notes || null,
    market: row.market || null,
    market_rank: rank,
    status: "pending",
    sourced_by: "TalisBOT™",
    proposed_code: proposed,
  };
}

function leadChanges(row: CsvContactRow, lead: LeadSnapshot): FieldChange[] {
  const changes: FieldChange[] = [];
  const csvName = [row.firstName, row.lastName].filter(Boolean).join(" ").trim();
  if (csvName && (lead.decisionMakerName ?? "").trim() && !sameValue("first_name", lead.decisionMakerName ?? "", csvName)) {
    changes.push({ field: "first_name", from: lead.decisionMakerName ?? "", to: csvName, apply: false });
  }
  consider(changes, "phone", lead.cellPhone, row.phone, { contact: false });
  // Empty lead phone may be filled. consider() already applies fills.
  // Issued Mapsite contacts are never overwritten: force apply false when a value exists.
  for (const change of changes) {
    if (change.from) change.apply = false;
  }
  if (!(lead.cellPhone ?? "").trim() && row.phone) {
    const existing = changes.find((c) => c.field === "phone");
    if (!existing) changes.push({ field: "phone", from: "", to: row.phone, apply: true });
  }
  if (!(lead.officePhone ?? "").trim() && row.officePhone && row.officePhone !== row.phone) {
    changes.push({ field: "office_phone", from: "", to: row.officePhone, apply: true });
  }
  const email = (lead.email ?? "").trim();
  if (!email && row.email) changes.push({ field: "email", from: "", to: row.email.toLowerCase(), apply: true });
  else if (email && row.email && !sameValue("email", email, row.email)) {
    changes.push({ field: "email", from: email, to: row.email.toLowerCase(), apply: false });
  }
  return changes;
}

function hasAnyContact(row: CsvContactRow): boolean {
  return Boolean(row.firstName || row.lastName || row.phone || row.email);
}

export function planProspectImport(input: {
  rows: readonly CsvContactRow[];
  queue: readonly QueueSnapshot[];
  issuedCodes: ReadonlySet<string>;
  leads?: readonly LeadSnapshot[];
  takenCodes?: ReadonlySet<string>;
}): ImportPlan {
  const queue = input.queue.map(cloneQueue);
  const byId = new Map(queue.map((q) => [q.id.toLowerCase(), q]));
  const byCode = new Map<string, QueueSnapshot>();
  for (const q of queue) {
    if (q.proposed_code) byCode.set(q.proposed_code.toLowerCase(), q);
  }
  const leads = new Map((input.leads ?? []).map((l) => [l.fastCode.toLowerCase(), l]));
  const taken = new Set([...(input.takenCodes ?? [])].map((c) => c.toLowerCase()));
  for (const code of input.issuedCodes) taken.add(code.toLowerCase());
  const items: PlanItem[] = [];
  const drafts = new Map<string, NewQueueDraft>();

  const remember = (id: string, draft: NewQueueDraft) => {
    drafts.set(id, draft);
    const snapshot: QueueSnapshot = {
      id,
      brokerage: draft.brokerage,
      town: draft.town,
      province: draft.province,
      country: draft.country,
      status: "pending",
      proposed_code: draft.proposed_code,
      contact_first_name: draft.contact_first_name,
      contact_last_name: draft.contact_last_name,
      contact_name: draft.contact_name,
      contact_phone: draft.contact_phone,
      contact_email: draft.contact_email,
      contact_position: draft.contact_position,
      office_phone: draft.office_phone,
      office_address: draft.office_address,
      website: draft.website,
      source_url: draft.source_url,
      research_notes: draft.research_notes,
    };
    queue.push(snapshot);
    byId.set(id.toLowerCase(), snapshot);
    if (snapshot.proposed_code) byCode.set(snapshot.proposed_code.toLowerCase(), snapshot);
  };

  for (const row of input.rows) {
    if (!row.brokerage && !row.matchToken) {
      items.push({ kind: "incomplete", line: row.line, brokerage: "", reason: "empty" });
      continue;
    }
    if (!row.brokerage) {
      items.push({ kind: "incomplete", line: row.line, brokerage: "", reason: "missing_brokerage" });
      continue;
    }

    const ids = queueIdsFromToken(row.matchToken);
    let queueHit: QueueSnapshot | null = null;
    let ambiguous = false;
    if (ids.length) {
      const picked = pickQueueByIds(ids, row, byId);
      if (picked) queueHit = byId.get(picked) ?? null;
      else if (ids.filter((id) => byId.has(id)).length > 1) ambiguous = true;
    }

    const code = fastCodeFromToken(row.matchToken);
    if (!queueHit && !ambiguous && code) {
      queueHit = byCode.get(code) ?? null;
    }

    if (!queueHit && !ambiguous && code && input.issuedCodes.has(code)) {
      const lead = leads.get(code);
      const changes = lead ? leadChanges(row, lead) : [];
      const patch: Record<string, string | null> = {};
      for (const change of changes) {
        if (!change.apply) continue;
        if (change.field === "phone") patch.cell_phone = change.to;
        if (change.field === "office_phone") patch.office_phone = change.to;
        if (change.field === "email") patch.email = change.to;
      }
      items.push({
        kind: "matched",
        line: row.line,
        brokerage: row.brokerage,
        queueId: null,
        fastCode: code,
        target: "lead",
        changes,
        contactIncomplete: !isCompleteContact(contactOf(row)),
        patch,
      });
      continue;
    }

    if (!queueHit && !ambiguous) {
      const named = pickQueueByName(row, queue);
      if (named && "ambiguous" in named) ambiguous = true;
      else if (named) queueHit = byId.get(named.id) ?? null;
    }

    if (ambiguous && !queueHit) {
      items.push({ kind: "incomplete", line: row.line, brokerage: row.brokerage, reason: "ambiguous" });
      continue;
    }

    if (queueHit) {
      const changes = queueChanges(row, queueHit);
      const patch = buildPatch(changes, row, queueHit, taken);
      applyChangesToSnapshot(queueHit, patch);
      const draft = drafts.get(queueHit.id);
      if (draft) Object.assign(draft, patch);
      const after = {
        contact_first_name: queueHit.contact_first_name,
        contact_last_name: queueHit.contact_last_name,
        contact_name: queueHit.contact_name,
        contact_phone: queueHit.contact_phone,
        contact_email: queueHit.contact_email,
      };
      items.push({
        kind: "matched",
        line: row.line,
        brokerage: row.brokerage,
        queueId: queueHit.id,
        fastCode: queueHit.proposed_code,
        target: "queue",
        changes,
        contactIncomplete: !isCompleteContact(after),
        patch,
      });
      continue;
    }

    if (!row.sourceUrl.trim()) {
      items.push({ kind: "incomplete", line: row.line, brokerage: row.brokerage, reason: "missing_source" });
      continue;
    }
    if (!hasAnyContact(row)) {
      items.push({ kind: "incomplete", line: row.line, brokerage: row.brokerage, reason: "empty" });
      continue;
    }

    const draft = draftFromRow(row, taken, null);
    const syntheticId = `new:${row.line}`;
    remember(syntheticId, draft);
    items.push({
      kind: "new",
      line: row.line,
      country: draft.country,
      draft,
      contactIncomplete: !isCompleteContact({
        contact_first_name: draft.contact_first_name,
        contact_last_name: draft.contact_last_name,
        contact_phone: draft.contact_phone,
        contact_email: draft.contact_email,
      }),
    });
  }

  const overwrites = items.flatMap((item) => {
    if (item.kind !== "matched") return [];
    return item.changes
      .filter((c) => c.from && c.to && c.from !== c.to)
      .map((c) => ({ line: item.line, brokerage: item.brokerage, field: c.field, from: c.from, to: c.to, apply: c.apply }));
  });

  return {
    items,
    matched: items.filter((i) => i.kind === "matched").length,
    newCa: items.filter((i) => i.kind === "new" && i.country === "CA").length,
    newUs: items.filter((i) => i.kind === "new" && i.country === "US").length,
    incomplete: items.filter((i) => i.kind === "incomplete").length,
    contactIncomplete: items.filter((i) => i.kind !== "incomplete" && i.contactIncomplete).length,
    overwrites,
  };
}

export const LEADS_PAGE_SIZE = 20;
