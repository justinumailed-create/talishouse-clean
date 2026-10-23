/**
 * Pure brokerage-lead rules: field lists, CSV parse/mapping, validation,
 * duplicate detection and delete permission. No database and no Next.js.
 *
 * Agents see their own leads by default and may open everyone else's read-only.
 * Only a superadmin may delete. CSV rows are attributed to the uploading agent;
 * a column that names another agent is ignored.
 */

export const LEAD_POSITIONS = ["broker", "acting_broker", "managing_broker", "team_leader"] as const;
export type LeadPosition = (typeof LEAD_POSITIONS)[number];

export const LEAD_COUNTRIES = ["Canada", "USA"] as const;
export type LeadCountry = (typeof LEAD_COUNTRIES)[number];

export const LEAD_STATUSES = ["new", "contacted", "replied", "registered", "not_interested"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_FIELDS = [
  "decision_maker_name",
  "position",
  "cell_phone",
  "email",
  "brokerage_name",
  "brokerage_website",
  "brokerage_address",
  "office_phone",
  "latitude",
  "longitude",
  "country",
  "market",
  "status",
  "notes",
] as const;
export type LeadField = (typeof LEAD_FIELDS)[number];

export const CSV_TEMPLATE_HEADERS = [
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
] as const;

export type CrmRole = "agent" | "superadmin";

export type CrmActor = {
  role: CrmRole;
  name: string;
  agentId: string | null;
};

/** Agents never delete. The database trigger enforces the same rule. */
export function canDeleteLeads(actor: { role: CrmRole }): boolean {
  return actor.role === "superadmin";
}

export function canEditLead(
  actor: { role: CrmRole; agentId: string | null },
  lead: { createdByAgentId: string | null },
): boolean {
  if (actor.role === "superadmin") return true;
  return Boolean(actor.agentId) && actor.agentId === lead.createdByAgentId;
}

export type LeadIssue =
  | { code: "required"; field: LeadField }
  | { code: "email" }
  | { code: "phone"; field: "cell_phone" | "office_phone" }
  | { code: "position" }
  | { code: "country" }
  | { code: "status" }
  | { code: "latlng" }
  | { code: "website" }
  | { code: "too_long"; field: LeadField };

export type NormalizedLead = {
  decisionMakerName: string;
  position: LeadPosition;
  cellPhone: string | null;
  email: string | null;
  brokerageName: string;
  brokerageWebsite: string | null;
  brokerageAddress: string | null;
  officePhone: string | null;
  latitude: number | null;
  longitude: number | null;
  country: LeadCountry;
  market: string | null;
  status: LeadStatus;
  notes: string | null;
};

export type ExistingLeadKey = {
  id: string;
  email: string | null;
  cellPhone: string | null;
  officePhone: string | null;
  brokerageName: string;
  decisionMakerName: string;
};

export type DuplicateHit = {
  reason: "email" | "phone" | "brokerage_name";
  matchId: string | null;
  matchLabel: string;
};

export type ClassifiedRow = {
  rowNumber: number;
  lead: NormalizedLead | null;
  /** Raw name and brokerage, kept when the row fails validation. */
  displayName: string;
  displayBrokerage: string;
  errors: LeadIssue[];
  duplicate: DuplicateHit | null;
};

const HEADER_SYNONYMS: Record<LeadField, readonly string[]> = {
  decision_maker_name: ["decision maker name", "decision maker", "contact name", "broker name", "name"],
  position: ["position", "title", "role"],
  cell_phone: ["cell phone", "mobile phone", "cell number", "mobile", "cell", "phone"],
  email: ["email address", "e mail", "email"],
  brokerage_name: ["brokerage name", "brokerage", "company name", "company", "office name"],
  brokerage_website: ["brokerage website", "website", "web site", "url", "web"],
  brokerage_address: ["brokerage address", "full brokerage address", "full address", "office address", "address"],
  office_phone: ["office phone", "office telephone", "brokerage phone", "work phone", "office tel"],
  latitude: ["latitude", "lat"],
  longitude: ["longitude", "lng", "lon", "long"],
  country: ["country"],
  market: ["market anchor town", "anchor town", "market", "town", "city"],
  status: ["status"],
  notes: ["notes", "note", "comments", "comment"],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_MIN_DIGITS = 7;

export function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function normalizeEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function nameKey(brokerage: string | null | undefined, person: string | null | undefined): string {
  return `${(brokerage ?? "").trim().toLowerCase()}|${(person ?? "").trim().toLowerCase()}`;
}

/** NANP numbers compare without a leading country code 1. Short fragments are not keys. */
export function phoneDuplicateKey(value: string | null | undefined): string {
  let digits = digitsOnly(value);
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return digits.length >= PHONE_MIN_DIGITS ? digits : "";
}

export function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[_/|-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 1;
          continue;
        }
        inQuotes = false;
        continue;
      }
      cell += c;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      continue;
    }
    if (c === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += c;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  while (rows.length > 0 && rows[rows.length - 1].every((c) => c.trim() === "")) rows.pop();
  return rows;
}

export function autoMapColumns(headers: readonly string[]): Partial<Record<LeadField, number>> {
  const scored: Array<{ field: LeadField; index: number; score: number }> = [];
  headers.forEach((header, index) => {
    const norm = normalizeHeader(header);
    if (!norm) return;
    (Object.keys(HEADER_SYNONYMS) as LeadField[]).forEach((field) => {
      for (const synonym of HEADER_SYNONYMS[field]) {
        if (norm === synonym) scored.push({ field, index, score: 1000 + synonym.length });
      }
    });
  });
  scored.sort((a, b) => b.score - a.score);
  const mapping: Partial<Record<LeadField, number>> = {};
  const usedCols = new Set<number>();
  for (const item of scored) {
    if (mapping[item.field] !== undefined || usedCols.has(item.index)) continue;
    mapping[item.field] = item.index;
    usedCols.add(item.index);
  }
  return mapping;
}

export function csvTemplate(): string {
  return `${CSV_TEMPLATE_HEADERS.join(",")}\n`;
}

function clean(value: string | undefined, max: number): { value: string; tooLong: boolean } {
  const v = (value ?? "").trim().replace(/\s+/g, " ");
  return { value: v.slice(0, max), tooLong: v.length > max };
}

export function normalizePosition(raw: string | undefined): LeadPosition | null {
  const v = (raw ?? "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (v === "broker") return "broker";
  if (v === "acting broker") return "acting_broker";
  if (v === "managing broker") return "managing_broker";
  if (v === "team leader") return "team_leader";
  return null;
}

export function normalizeCountry(raw: string | undefined): LeadCountry | null {
  const v = (raw ?? "").trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
  if (v === "canada" || v === "ca" || v === "can") return "Canada";
  if (v === "usa" || v === "us" || v === "united states" || v === "united states of america") return "USA";
  return null;
}

export function normalizeStatus(raw: string | undefined): LeadStatus | null {
  const v = (raw ?? "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (!v) return "new";
  if (v === "new") return "new";
  if (v === "contacted") return "contacted";
  if (v === "replied" || v === "reply") return "replied";
  if (v === "registered") return "registered";
  if (v === "not interested") return "not_interested";
  return null;
}

function normalizeWebsite(raw: string): { value: string | null; ok: boolean } {
  const v = raw.trim();
  if (!v) return { value: null, ok: true };
  if (/\s/.test(v)) return { value: null, ok: false };
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return { value: null, ok: false };
    if (!url.hostname.includes(".")) return { value: null, ok: false };
    return { value: url.toString(), ok: true };
  } catch {
    return { value: null, ok: false };
  }
}

function optionalPhone(raw: string, field: "cell_phone" | "office_phone", errors: LeadIssue[]): string | null {
  const v = raw.trim();
  if (!v) return null;
  const digits = digitsOnly(v);
  if (digits.length < PHONE_MIN_DIGITS || digits.length > 15) {
    errors.push({ code: "phone", field });
    return null;
  }
  return v.slice(0, 40);
}

export function validateLeadValues(values: Partial<Record<LeadField, string>>): {
  lead: NormalizedLead | null;
  errors: LeadIssue[];
} {
  const errors: LeadIssue[] = [];
  const name = clean(values.decision_maker_name, 200);
  const brokerage = clean(values.brokerage_name, 200);
  const market = clean(values.market, 120);
  const address = clean(values.brokerage_address, 500);
  const notes = (values.notes ?? "").trim();
  if (!name.value) errors.push({ code: "required", field: "decision_maker_name" });
  else if (name.tooLong) errors.push({ code: "too_long", field: "decision_maker_name" });
  if (!brokerage.value) errors.push({ code: "required", field: "brokerage_name" });
  else if (brokerage.tooLong) errors.push({ code: "too_long", field: "brokerage_name" });
  if (market.tooLong) errors.push({ code: "too_long", field: "market" });
  if (address.tooLong) errors.push({ code: "too_long", field: "brokerage_address" });
  if (notes.length > 5000) errors.push({ code: "too_long", field: "notes" });

  const position = normalizePosition(values.position);
  if (!position) errors.push({ code: "position" });
  const country = normalizeCountry(values.country);
  if (!country) errors.push({ code: "country" });
  const status = normalizeStatus(values.status);
  if (!status) errors.push({ code: "status" });

  const emailRaw = (values.email ?? "").trim();
  let email: string | null = null;
  if (emailRaw) {
    if (!EMAIL_RE.test(emailRaw) || emailRaw.length > 320) errors.push({ code: "email" });
    else email = emailRaw.toLowerCase();
  }

  const cellPhone = optionalPhone(values.cell_phone ?? "", "cell_phone", errors);
  const officePhone = optionalPhone(values.office_phone ?? "", "office_phone", errors);
  const website = normalizeWebsite(values.brokerage_website ?? "");
  if (!website.ok) errors.push({ code: "website" });

  const latRaw = (values.latitude ?? "").trim();
  const lngRaw = (values.longitude ?? "").trim();
  let latitude: number | null = null;
  let longitude: number | null = null;
  if (latRaw || lngRaw) {
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (!latRaw || !lngRaw || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      errors.push({ code: "latlng" });
    } else {
      latitude = lat;
      longitude = lng;
    }
  }

  if (errors.length || !position || !country || !status || !name.value || !brokerage.value) {
    return { lead: null, errors };
  }
  return {
    lead: {
      decisionMakerName: name.value,
      position,
      cellPhone,
      email,
      brokerageName: brokerage.value,
      brokerageWebsite: website.value,
      brokerageAddress: address.value || null,
      officePhone,
      latitude,
      longitude,
      country,
      market: market.value || null,
      status,
      notes: notes ? notes.slice(0, 5000) : null,
    },
    errors: [],
  };
}

function labelOf(lead: { decisionMakerName: string; brokerageName: string }): string {
  return `${lead.decisionMakerName} · ${lead.brokerageName}`;
}

export function classifyImportRows(input: {
  rows: Array<{ rowNumber: number; values: Partial<Record<LeadField, string>> }>;
  existing: readonly ExistingLeadKey[];
}): ClassifiedRow[] {
  const byEmail = new Map<string, { id: string | null; label: string }>();
  const byPhone = new Map<string, { id: string | null; label: string }>();
  const byName = new Map<string, { id: string | null; label: string }>();

  function remember(
    map: Map<string, { id: string | null; label: string }>,
    key: string,
    hit: { id: string | null; label: string },
  ) {
    if (key && !map.has(key)) map.set(key, hit);
  }

  for (const row of input.existing) {
    const label = `${row.decisionMakerName} · ${row.brokerageName}`;
    const hit = { id: row.id, label };
    remember(byEmail, normalizeEmail(row.email), hit);
    remember(byPhone, phoneDuplicateKey(row.cellPhone), hit);
    remember(byPhone, phoneDuplicateKey(row.officePhone), hit);
    remember(byName, nameKey(row.brokerageName, row.decisionMakerName), hit);
  }

  return input.rows.map((row) => {
    const { lead, errors } = validateLeadValues(row.values);
    const displayName = (row.values.decision_maker_name ?? "").trim();
    const displayBrokerage = (row.values.brokerage_name ?? "").trim();
    let duplicate: DuplicateHit | null = null;
    if (lead) {
      const email = normalizeEmail(lead.email);
      const phones = [phoneDuplicateKey(lead.cellPhone), phoneDuplicateKey(lead.officePhone)].filter(Boolean);
      const key = nameKey(lead.brokerageName, lead.decisionMakerName);
      const emailHit = email ? byEmail.get(email) : undefined;
      const phoneHit = phones.map((p) => byPhone.get(p)).find(Boolean);
      const nameHit = key !== "|" ? byName.get(key) : undefined;
      if (emailHit) duplicate = { reason: "email", matchId: emailHit.id, matchLabel: emailHit.label };
      else if (phoneHit) duplicate = { reason: "phone", matchId: phoneHit.id, matchLabel: phoneHit.label };
      else if (nameHit) duplicate = { reason: "brokerage_name", matchId: nameHit.id, matchLabel: nameHit.label };

      const self = { id: null as string | null, label: labelOf(lead) };
      remember(byEmail, email, self);
      for (const p of phones) remember(byPhone, p, self);
      remember(byName, key, self);
    }
    return { rowNumber: row.rowNumber, lead, displayName, displayBrokerage, errors, duplicate };
  });
}

export function applyMapping(
  table: string[][],
  mapping: Partial<Record<LeadField, number>>,
): Array<{ rowNumber: number; values: Partial<Record<LeadField, string>> }> {
  return table
    .slice(1)
    .map((cells, index) => {
      const values: Partial<Record<LeadField, string>> = {};
      for (const field of LEAD_FIELDS) {
        const col = mapping[field];
        if (col === undefined) continue;
        values[field] = cells[col] ?? "";
      }
      return { rowNumber: index + 2, values };
    })
    .filter((row) => Object.values(row.values).some((v) => (v ?? "").trim()));
}

function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(headers: readonly string[], rows: ReadonlyArray<readonly (string | number | null | undefined)[]>): string {
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) lines.push(row.map(csvCell).join(","));
  return `${lines.join("\n")}\n`;
}

export const IMPORT_ROW_LIMIT = 200;

export const LEAD_SORTS = ["created_at", "decision_maker_name", "brokerage_name", "status", "market", "country"] as const;
export type LeadSort = (typeof LEAD_SORTS)[number];

export type LeadListFilters = {
  q: string;
  status: LeadStatus | "";
  country: LeadCountry | "";
  market: string;
  agentId: string;
  scope: "mine" | "all";
  sort: LeadSort;
  dir: "asc" | "desc";
  page: number;
};
