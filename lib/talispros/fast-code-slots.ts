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
export type SlotEntry = {
  slotId: string;
  fastCode: string;
  town: string;
  province: string;
  href: string;
  /** When the Mapsite was added (created / claimed), ISO timestamp. */
  addedAt: string | null;
  /**
   * Logo from the prospect's eBook or the Logo & Card Editor.
   * Null means the row shows an initials badge (never a broken image).
   */
  logoUrl: string | null;
  /** Letters for the badge when `logoUrl` is missing. */
  initials: string;
  /** Realty / brokerage shown on the strip. */
  brokerage: string;
};

/** Platform stand-in logos are not a prospect's own mark. */
const GENERIC_SLOT_LOGOS = new Set([
  "/logo.png",
  "/images/mapsites/header-fallback-logo.jpeg",
  "/assets/windswept-tree-logo.png",
]);

/**
 * Non-realty marks that must never appear on a FAST Code strip.
 * The plug image is stored data, not a code fallback: `mapsites.logo_url`
 * for FAST Code PP03, copied from build request "Rahul's PIN" (requested
 * code pp01) and `mapsite_assets.logo_image` for that request. The file
 * name is the stored object, so a later copy of the same upload is caught too.
 */
const BLOCKED_SLOT_LOGO_MARKERS = [
  "powermycode",
  "power-my-code",
  "logo-1783763252674",
];

function isBlockedSlotLogo(url: string): boolean {
  const path = (url.split("?")[0]?.split("#")[0] || url).toLowerCase();
  if (GENERIC_SLOT_LOGOS.has(path)) return true;
  return BLOCKED_SLOT_LOGO_MARKERS.some((marker) => path.includes(marker));
}

/** First usable realty logo. Platform and non-realty marks are skipped. */
export function pickSlotLogoUrl(candidates: Array<string | null | undefined>): string | null {
  for (const raw of candidates) {
    if (typeof raw !== "string") continue;
    const url = raw.trim();
    if (!url || isBlockedSlotLogo(url)) continue;
    if (url.startsWith("/") || url.startsWith("data:image/") || /^https?:\/\//i.test(url)) {
      return url;
    }
  }
  return null;
}

const GENERIC_BROKERAGE = /^(mapsite|demo mapsite|demo-mapsite|home pin address|rahul's pin)$/i;

/** Realty name for the strip. A generic title falls back to the town. */
export function slotBrokerageName(title: string | null | undefined, town: string): string {
  const named = (title || "").replace(/\s+/g, " ").trim();
  if (named && !GENERIC_BROKERAGE.test(named)) return named;
  const place = town.trim();
  return place && place.toLowerCase() !== "mapsite" ? place : "";
}

/** Agency logo stored on a Talisbook™ (RM22 hydration or a top-level logo field). */
export function ebookLogoFromBookMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const record = metadata as Record<string, unknown>;
  const hydration = record.rm22SlotHydration;
  if (hydration && typeof hydration === "object" && !Array.isArray(hydration)) {
    const logo = (hydration as Record<string, unknown>).agencyLogoUrl;
    if (typeof logo === "string" && logo.trim()) return logo.trim();
  }
  for (const key of ["agencyLogoUrl", "brokerageLogoUrl", "logoUrl", "logo_url"] as const) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

const INITIAL_SKIP = new Set([
  "a",
  "an",
  "the",
  "of",
  "and",
  "de",
  "du",
  "la",
  "le",
  "les",
  "des",
  "d",
  "inc",
  "ltd",
  "llc",
  "corp",
  "co",
  "group",
  "limited",
  "real",
  "estate",
  "realty",
  "agence",
  "immobiliere",
  "immobilière",
]);

/**
 * Badge letters from the prospect's name (property title), else the town,
 * else the FAST Code. A leading acronym such as DFH is kept whole.
 */
export function slotInitials(label: string | null | undefined, fastCode: string): string {
  const words = (label || "")
    .replace(/[™®]/g, "")
    .split(/[^A-Za-z0-9À-ÿ]+/)
    .map((word) => word.trim())
    .filter((word) => word && !INITIAL_SKIP.has(word.toLowerCase()));
  if (words.length >= 1 && /^[A-Z0-9]{2,4}$/.test(words[0])) return words[0];
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1) {
    const word = words[0];
    return (word.length <= 3 ? word : word.slice(0, 2)).toUpperCase();
  }
  const code = fastCode.replace(/[^A-Za-z0-9]/g, "");
  return (code.slice(0, 2) || "MS").toUpperCase();
}

/** Newest Mapsite first; entries without a date go last. */
export function sortSlotEntriesNewestFirst<T extends { addedAt: string | null }>(entries: T[]): T[] {
  const time = (value: string | null) => {
    const ms = value ? Date.parse(value) : NaN;
    return Number.isFinite(ms) ? ms : -Infinity;
  };
  return [...entries].sort((a, b) => time(b.addedAt) - time(a.addedAt));
}

/** "Nov 4, 2026" (EN) / "4. Nov. 2026" (DE). UTC so server and browser agree. */
export function formatSlotAddedDate(value: string | null | undefined, locale: string): string {
  const ms = value ? Date.parse(value) : NaN;
  if (!Number.isFinite(ms)) return "";
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(ms));
}
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
