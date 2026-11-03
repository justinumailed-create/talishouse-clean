/**
 * FAST Code slots on the demo Mapsite page (/talispros/demo-mapsite).
 *
 * Each sales associate keeps one list of up to 15 prepared Mapsites. The
 * signed-in agent sees and edits their own list. The public page (Arun,
 * Nov 4) lists the FAST Codes with town and province under the write-up and
 * links each straight to its Mapsite. It never shows who prepared a code:
 * no names, no counts per person, no labels on the groups.
 */
import { MAPSITE_APP_PATH, claimedMapSiteSegmentForAccountOrPlan } from "@/lib/talispros/mapsite-state";

export const FAST_CODE_SLOT_LIMIT = 15;

/** Sales associates whose lists show on the public panel, in this order. */
export const SALES_ASSOCIATE_LOGINS = ["aritri", "enanko"] as const;

export const DEMO_MAPSITE_SLOT_OPEN_PATH = "/talispros/demo-mapsite/open";

export function demoMapsiteSlotOpenHref(slotId: string): string {
  return `${DEMO_MAPSITE_SLOT_OPEN_PATH}/${encodeURIComponent(slotId)}`;
}

/** FAST Codes are letters, digits and dashes. Anything else is rejected before a lookup. */
export function normalizeSlotFastCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim();
  if (!/^[A-Za-z0-9-]{2,40}$/.test(code)) return null;
  return code;
}

const COUNTRY = /^(canada|ca)$/i;
const POSTAL_ONLY = /^[A-Z]{2}\s+[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i;
const POSTAL_TAIL = /\s+[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i;

/**
 * Town for the public list, from the Mapsite address:
 * "8 Main St, Winnipeg, MB R2C 2Y6, Canada" → "Winnipeg".
 */
export function mapsiteTownFromAddress(
  address: string | null | undefined,
  fallbackTitle?: string | null,
): string {
  const parts = (address || "")
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && !COUNTRY.test(p));
  let town = "";
  if (parts.length >= 3) town = parts[parts.length - 2];
  else if (parts.length === 2) town = POSTAL_ONLY.test(parts[1]) ? parts[0] : parts[1];
  else if (parts.length === 1) town = parts[0];
  town = town.replace(POSTAL_TAIL, "").trim();
  return town || (fallbackTitle || "").trim() || "Mapsite";
}

const PROVINCES: Record<string, string> = {
  "newfoundland and labrador": "NL",
  "terre-neuve-et-labrador": "NL",
  "prince edward island": "PE",
  "île-du-prince-édouard": "PE",
  "nova scotia": "NS",
  "nouvelle-écosse": "NS",
  "new brunswick": "NB",
  "nouveau-brunswick": "NB",
  quebec: "QC",
  québec: "QC",
  ontario: "ON",
  manitoba: "MB",
  saskatchewan: "SK",
  alberta: "AB",
  "british columbia": "BC",
  "colombie-britannique": "BC",
  yukon: "YT",
  "northwest territories": "NT",
  nunavut: "NU",
};
const PROVINCE_CODES = new Set(Object.values(PROVINCES));

/**
 * Province for the public list, from the Mapsite address:
 * "6 Main St, Corner Brook, NL A2H 2Z3, Canada" → "NL". Empty when unknown.
 */
export function mapsiteProvinceFromAddress(address: string | null | undefined): string {
  const parts = (address || "")
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && !COUNTRY.test(p));
  for (let i = parts.length - 1; i >= 1; i -= 1) {
    const part = parts[i].replace(POSTAL_TAIL, "").trim();
    const upper = part.toUpperCase();
    if (PROVINCE_CODES.has(upper)) return upper;
    const named = PROVINCES[part.toLowerCase()];
    if (named) return named;
  }
  return "";
}

/** "Corner Brook, NL" (or just the town when the province is unknown). */
export function slotPlaceLabel(town: string, province: string): string {
  return province ? `${town}, ${province}` : town;
}

export function mapsiteHrefForSlot(accountType: string | null | undefined, fastCode: string): string {
  return `${MAPSITE_APP_PATH}/${claimedMapSiteSegmentForAccountOrPlan(accountType)}/${fastCode.trim().toLowerCase()}`;
}

/** One prepared Mapsite: FAST Code, town, province and its Mapsite path. */
export type SlotEntry = { slotId: string; fastCode: string; town: string; province: string; href: string };
/** One associate's list on the public page. Deliberately carries no name or id. */
export type PublicSlotList = { entries: SlotEntry[] };

export type OwnSlotEntry = SlotEntry;
export type OwnSlotList = { count: number; limit: number; entries: OwnSlotEntry[] };

export type FastCodeSlotsPanelData = {
  /** Unlabeled groups, one per sales associate other than the viewer. */
  associates: PublicSlotList[];
  /** The signed-in agent's own list, which they can edit. Null for everyone else. */
  own: OwnSlotList | null;
};
