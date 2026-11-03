/**
 * FAST Code slots on the demo Mapsite page (/talispros/demo-mapsite).
 *
 * Each sales associate keeps one list of up to 15 prepared Mapsites. The
 * signed-in agent sees and edits their own FAST Codes. Everyone else sees the
 * associate's name, the towns and the count; a town opens the Mapsite through
 * `/talispros/demo-mapsite/open/<slot id>` so the code never reaches the page.
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

export function mapsiteHrefForSlot(accountType: string | null | undefined, fastCode: string): string {
  return `${MAPSITE_APP_PATH}/${claimedMapSiteSegmentForAccountOrPlan(accountType)}/${fastCode.trim().toLowerCase()}`;
}

export type PublicSlotEntry = { slotId: string; town: string };
export type PublicSlotList = { name: string; count: number; entries: PublicSlotEntry[] };

export type OwnSlotEntry = { slotId: string; town: string; fastCode: string; href: string };
export type OwnSlotList = { name: string; count: number; limit: number; entries: OwnSlotEntry[] };

export type FastCodeSlotsPanelData = {
  /** Lists of the other sales associates (no FAST Codes). */
  associates: PublicSlotList[];
  /** The signed-in agent's own list, with codes. Null for everyone else. */
  own: OwnSlotList | null;
};
