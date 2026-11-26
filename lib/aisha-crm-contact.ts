/**
 * Build a Contact CRM payload from a qualifying Aisha meeting.
 * Pure mapping + dedup keys. Persistence lives in aisha-transcript-ingest.ts.
 */

import { AISHA_CALL_SOURCE } from "@/lib/aisha-transcript-routing";

export { AISHA_CALL_SOURCE };
import {
  CRM_PLACEHOLDER_BROKERAGE_NAME,
  CRM_PLACEHOLDER_CALLER_NAME,
} from "@/lib/crm-leads/field-permissions";
import { LEAD_COUNTRIES, type LeadCountry, type LeadPosition, type LeadStatus } from "@/lib/crm-leads/model";

export const AISHA_CRM_STATUS: LeadStatus = "new"; // existing enum; treated as Potential Prospect
export const AISHA_CRM_POSITION: LeadPosition = "prospect";

const CANADA_RE =
  /\b(canada|canadian|ontario|quebec|qu[eé]bec|british columbia|alberta|manitoba|saskatchewan|nova scotia|new brunswick|prince edward|newfoundland|yukon|nunavut|northwest territories|\bon\b|\bbc\b|\bab\b|\bqc\b|\bmb\b|\bsk\b|\bns\b|\bnb\b|\bpe\b|\bnl\b)\b/i;
const USA_RE =
  /\b(usa|u\.s\.a\.|u\.s\.|united states|america|alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|hampshire|jersey|mexico|york|carolina|dakota|ohio|oklahoma|oregon|pennsylvania|rhode|tennessee|texas|utah|vermont|virginia|washington|wisconsin|wyoming)\b/i;

export function inferLeadCountry(
  ...values: Array<string | null | undefined>
): LeadCountry | null {
  const text = values.filter(Boolean).join(" ");
  if (!text.trim()) return null;
  const hasCanada = CANADA_RE.test(text);
  const hasUsa = USA_RE.test(text);
  if (hasCanada && !hasUsa) return "Canada";
  if (hasUsa && !hasCanada) return "USA";
  for (const country of LEAD_COUNTRIES) {
    if (text.trim().toLowerCase() === country.toLowerCase()) return country;
  }
  return null;
}

export type AishaCrmContactDraft = {
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
  country: LeadCountry | null;
  market: string | null;
  status: LeadStatus;
  notes: string;
  source: typeof AISHA_CALL_SOURCE;
  sourceConversationId: string;
  fastCode: string | null;
};

export type AishaCrmMeeting = {
  id: string;
  startUnix?: number | null;
  title?: string | null;
  summary?: string | null;
  callerName?: string | null;
  validContact?: { kind: "phone" | "email"; value: string } | null;
  contactRaw?: string | null;
  fields?: Record<string, unknown> | null;
  transcript?: ReadonlyArray<{ role: string; message: string }>;
};

function str(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t ? t : null;
}

function firstStr(...values: unknown[]): string | null {
  for (const value of values) {
    const t = str(value);
    if (t) return t;
  }
  return null;
}

export function extractFastCode(fields: Record<string, unknown> | null | undefined, text?: string | null): string | null {
  const fromFields = firstStr(fields?.fast_code, fields?.fastCode, fields?.agent_code, fields?.agentCode);
  if (fromFields) return fromFields.toLowerCase();
  if (!text) return null;
  const match = text.match(/\b([a-z]{2}\d{2}|[a-z]{4}\d{2})\b/i);
  return match ? match[1].toLowerCase() : null;
}

export function buildAishaCrmNotes(meeting: AishaCrmMeeting): string {
  const lines: string[] = ["Potential Prospect from an Aisha Call."];
  if (meeting.title) lines.push(`Title: ${meeting.title}`);
  if (meeting.summary) lines.push(`Summary: ${meeting.summary}`);
  const fields = meeting.fields ?? {};
  for (const [label, key] of [
    ["Interest", "account_type_interest"],
    ["Business", "business_type"],
    ["Market", "market_location"],
    ["Goals", "goals"],
    ["Notes learned", "notes_learned"],
  ] as const) {
    const value = str(fields[key]);
    if (value) lines.push(`${label}: ${value}`);
  }
  lines.push(`Transcript reference: Aisha conversation ${meeting.id}`);
  return lines.join("\n");
}

export function buildAishaCrmContactDraft(meeting: AishaCrmMeeting): AishaCrmContactDraft {
  const fields = meeting.fields ?? {};
  const email =
    meeting.validContact?.kind === "email"
      ? meeting.validContact.value
      : firstStr(fields.email, String(fields.contact ?? "").includes("@") ? fields.contact : null);
  const phone =
    meeting.validContact?.kind === "phone"
      ? meeting.validContact.value
      : firstStr(fields.phone, fields.callback_phone, fields.cell_phone, fields.contact);
  const market = firstStr(fields.market_location, fields.market);
  const business = firstStr(fields.business_type, fields.brokerage_name, fields.company);
  const country = inferLeadCountry(str(fields.country), market, business, meeting.summary, meeting.title);
  const fastCode = extractFastCode(fields, [meeting.summary, meeting.title].filter(Boolean).join(" "));

  return {
    decisionMakerName: firstStr(meeting.callerName, fields.caller_name, fields.name) ?? CRM_PLACEHOLDER_CALLER_NAME,
    position: AISHA_CRM_POSITION,
    cellPhone: phone,
    email,
    brokerageName: business ?? CRM_PLACEHOLDER_BROKERAGE_NAME,
    brokerageWebsite: firstStr(fields.website, fields.brokerage_website),
    brokerageAddress: firstStr(fields.address, fields.brokerage_address),
    officePhone: firstStr(fields.office_phone),
    latitude: null,
    longitude: null,
    country,
    market,
    status: AISHA_CRM_STATUS,
    notes: buildAishaCrmNotes(meeting),
    source: AISHA_CALL_SOURCE,
    sourceConversationId: meeting.id,
    fastCode,
  };
}

export type CrmDedupKey = {
  sourceConversationId?: string | null;
  email?: string | null;
  cellPhone?: string | null;
};

export function normalizeEmailKey(value: string | null | undefined): string | null {
  const t = (value ?? "").trim().toLowerCase();
  return t || null;
}

export function normalizePhoneKey(value: string | null | undefined): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (/^1\d{10}$/.test(digits)) return digits.slice(1);
  return digits.length >= 7 ? digits : null;
}

/**
 * Find an existing contact that should be reused instead of inserting a new one.
 * Conversation ID wins; then email; then phone.
 */
export function findExistingCrmContact<T extends CrmDedupKey & { id: string }>(
  draft: CrmDedupKey,
  existing: readonly T[],
): { match: T; reason: "conversation" | "email" | "phone" } | null {
  const conversationId = (draft.sourceConversationId ?? "").trim();
  if (conversationId) {
    const hit = existing.find((row) => (row.sourceConversationId ?? "").trim() === conversationId);
    if (hit) return { match: hit, reason: "conversation" };
  }
  const email = normalizeEmailKey(draft.email);
  if (email) {
    const hit = existing.find((row) => normalizeEmailKey(row.email) === email);
    if (hit) return { match: hit, reason: "email" };
  }
  const phone = normalizePhoneKey(draft.cellPhone);
  if (phone) {
    const hit = existing.find((row) => normalizePhoneKey(row.cellPhone) === phone);
    if (hit) return { match: hit, reason: "phone" };
  }
  return null;
}
