/**
 * Standard system Talisbook™.
 *
 * The open book stays the RM22 / North Shore frame: a 16:9 spread made of
 * two 960×1080 leaves. Photos are cover-fitted or contain-fitted inside
 * that frame. They never become the page size.
 *
 * Page order:
 *   front cover, the protected market (about 80 km, page 2, beside the
 *   Mapsite zoom), about the brokerage, the area page, listing pages,
 *   a contact page, and a back cover.
 * Landscape centerfolds remain a viewer layout. System pages do not use a
 * photo as the spread that resizes the book.
 */

import { slotInitials } from "@/lib/talispros/fast-code-slots";
import type { TalisBooksViewerBook, TalisBooksViewerPage } from "@/lib/talisbooks/viewer/types";
import { RESERVED_BOOK_SPREAD_ASPECT } from "@/lib/talisbooks/viewer/spread-layout";

export const SYSTEM_EBOOK_LEAF_WIDTH = 960;
export const SYSTEM_EBOOK_LEAF_HEIGHT = 1080;
export const SYSTEM_EBOOK_SPREAD_ASPECT = RESERVED_BOOK_SPREAD_ASPECT;

export const SYSTEM_EBOOK_FAST_CODES = [
  "dw01",
  "hml01",
  "jdk01",
  "km01",
  "lb01",
  "pp03",
  "sdp01",
  "wg01",
  "ys01",
  "kk01",
  "kd01",
  "mkj01",
] as const;

/** These three keep their town photographs and the CC BY line on the back cover. */
export const SYSTEM_EBOOK_TOWN_PHOTO_CODES = ["kk01", "kd01", "mkj01"] as const;

const MAX_LISTING_PAGES = 6;

const TALIS_MARKS = ["Talisbooks", "Talismaps", "Talispros", "Talisbook", "Talisu", "Tsplits"];

export type SystemEbookListing = {
  street: string;
  town: string;
  priceCad: number | null;
  /** Short facts already in our words: "6 bedrooms", "2 bathrooms", "2,559 sq ft". */
  facts: string[];
  /** A photo of this listing. Own-site files are preferred. An MLS CDN file is kept only when the image has no visible board mark. */
  photoUrl?: string | null;
  /** Where the accepted photo was hosted before any storage copy. */
  photoHost?: "own-site" | "mls" | null;
  /** Static Talismaps™ image when the listing has no clean photo. */
  mapImageUrl?: string | null;
  /** Optional write-up. When set, it is used instead of the generated sentences. */
  story?: string | null;
  photoFit?: "cover" | "contain";
  latitude?: number | null;
  longitude?: number | null;
};

export type ListingVisualKind = "brokerage-photo" | "talismaps" | "town-photo" | "none";

export type SystemEbookProfile = {
  fastCode: string;
  brokerageName: string;
  brokerName: string;
  officeAddress: string;
  town: string;
  province: string;
  website: string;
  phone?: string | null;
  email?: string | null;
  /** Null when the site has no header logo, og:image, or favicon. */
  logoUrl?: string | null;
  foundedYear?: number | null;
  /** Other towns the office actually works in. */
  areas?: string[];
  listings?: SystemEbookListing[];
  /** How many own listings the site crawl found, before photo checks. */
  extractedListingCount?: number;
  /** Accepted photos hosted on the brokerage's own site. */
  ownSitePhotoCount?: number;
  /** Accepted photos from an MLS CDN with no visible watermark. */
  mlsPhotoCount?: number;
  /** Photos dropped because a mark was visible, or the file could not be checked. */
  rejectedWatermarkCount?: number;
  /** Clean area photograph. Town-photo books pass their stored photos here. */
  areaPhotoUrl?: string | null;
  areaPhotoFit?: "cover" | "contain";
  /** Talismaps™ still of the town, used when the site has no clean cover photo. */
  coverMapUrl?: string | null;
  /** Closer Talismaps™ still for the area leaf. */
  areaMapUrl?: string | null;
  /** Office pin with about an 80 km radius. */
  marketMapUrl?: string | null;
  /** Light plate behind a dark logo. Dark plate behind a white or transparent logo. */
  logoPlate?: "light" | "dark" | "none";
  latitude?: number | null;
  longitude?: number | null;
  /** Kept exactly, including the CC BY wording. */
  photoCredit?: string | null;
  /** Extra town photographs that must remain in the book. */
  townPhotoUrls?: string[];
};

export type SystemEbookPageRow = {
  title: string;
  slug: string;
  page_number: number;
  sort_order: number;
  content: Record<string, unknown>;
  is_visible: boolean;
};

export type SystemEbookDocument = {
  title: string;
  subtitle: string;
  description: string;
  lackedListings: boolean;
  logoFound: boolean;
  listingCount: number;
  /** Listings read from the brokerage site. The book may instead use an approved preview. */
  extractedListingCount: number;
  ownSitePhotoCount: number;
  mlsPhotoCount: number;
  rejectedWatermarkCount: number;
  usedApprovedPreview: boolean;
  metadata: Record<string, unknown>;
  pages: TalisBooksViewerPage[];
  pageRows: SystemEbookPageRow[];
  book: TalisBooksViewerBook;
};

export function systemEbookLackedListingsMessage(fastCode: string): string {
  return `[system-ebook] ${fastCode.trim().toLowerCase()}: no usable listings on the brokerage website`;
}

export function withBrandMarks(text: string): string {
  let next = text.replace(/Mapsite™/g, "Mapsite").replace(/FAST Code™/g, "FAST Code");
  for (const name of TALIS_MARKS) {
    next = next.replace(new RegExp(`\\b${name}(?!™)`, "g"), `${name}™`);
  }
  return next;
}

export function formatCad(amount: number): string {
  const rounded = Math.round(amount);
  return `CAD ${new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 }).format(rounded)}`;
}

/**
 * 5064551980 and (506) 455-1980 both become 506-455-1980.
 * Anything that is not a North American number (area and exchange cannot
 * start with 0 or 1) becomes an empty string so the book leaves the line out.
 */
export function formatCanadianPhone(raw: string | null | undefined): string {
  const digits = (raw || "").replace(/\D/g, "");
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (local.length !== 10) return "";
  if (local[0] === "0" || local[0] === "1") return "";
  if (local[3] === "0" || local[3] === "1") return "";
  return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
}

/** Record phone when it is a real number, otherwise the one scraped from the brokerage site. */
export function preferUsablePhone(
  record: string | null | undefined,
  scraped: string | null | undefined,
): string | null {
  return formatCanadianPhone(record) || formatCanadianPhone(scraped) || null;
}

/** THIRD AVENUE becomes Third Avenue. Mixed-case words such as Route stay as written. */
export function titleCaseAddress(value: string): string {
  const small = new Set(["of", "and", "the", "de", "du", "la", "le", "des"]);
  let wordIndex = 0;
  return value
    .trim()
    .split(/(\s+)/)
    .map((token) => {
      if (!/[A-Za-zÀ-ÿ]/.test(token)) return token;
      const letters = token.replace(/[^A-Za-zÀ-ÿ]/g, "");
      const uniform = letters === letters.toUpperCase() || letters === letters.toLowerCase();
      if (!uniform) {
        wordIndex += 1;
        return token;
      }
      const lower = token.toLowerCase();
      const bare = lower.replace(/[^a-zà-ÿ]/gi, "");
      const cased =
        wordIndex > 0 && small.has(bare)
          ? lower
          : lower.replace(/[A-Za-zÀ-ÿ]+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
      wordIndex += 1;
      return cased;
    })
    .join("");
}

const TOWN_COORDINATES: Record<string, [number, number]> = {
  nelson: [49.4928, -117.2948],
  esquimalt: [48.432, -123.414],
  saanich: [48.484, -123.381],
  victoria: [48.4284, -123.3656],
  squilax: [50.883, -119.633],
  chase: [50.819, -119.684],
  "scotch creek": [50.89, -119.46],
  "turtle valley": [50.92, -119.7],
  kamloops: [50.6745, -120.3273],
  vancouver: [49.2827, -123.1207],
  surrey: [49.1913, -122.849],
  squamish: [49.7016, -123.1558],
  castlegar: [49.323, -117.659],
  trail: [49.0966, -117.711],
  salmo: [49.194, -117.277],
  kaslo: [49.911, -116.916],
  creston: [49.0955, -116.51],
  kelowna: [49.888, -119.496],
  "lake country": [50.026, -119.414],
  vernon: [50.267, -119.272],
  penticton: [49.5, -119.594],
  "salmon arm": [50.702, -119.272],
  revelstoke: [50.998, -118.196],
  cranbrook: [49.51, -115.769],
  invermere: [50.509, -116.03],
  osoyoos: [49.033, -119.466],
  sorrento: [50.883, -119.467],
  sidney: [48.6501, -123.3986],
  langford: [48.4506, -123.5058],
  canmore: [51.089, -115.359],
  cochrane: [51.189, -114.468],
  calgary: [51.0447, -114.0719],
  fredericton: [45.9636, -66.6431],
  edmundston: [47.3737, -68.3251],
  "north battleford": [52.7575, -108.2861],
  battleford: [52.738, -108.315],
  charlottetown: [46.2382, -63.1311],
  souris: [46.355, -62.254],
  moncton: [46.0878, -64.7782],
};

/** Known towns farther than 80 km from the office are left out. Unknown towns stay. */
export function isWithinOfficeRadius(
  town: string,
  officeLatitude: number | null | undefined,
  officeLongitude: number | null | undefined,
  kilometres = 80,
): boolean {
  if (officeLatitude == null || officeLongitude == null) return true;
  const blob = town.trim().toLowerCase().replace(/\s+/g, " ");
  const names = Object.keys(TOWN_COORDINATES).sort((a, b) => b.length - a.length);
  const mentioned = names.filter((name) => new RegExp(`\\b${name}\\b`).test(blob));
  if (mentioned.length === 0) return true;
  return mentioned.some((name) => {
    const coords = TOWN_COORDINATES[name]!;
    return distanceKm(officeLatitude, officeLongitude, coords[0], coords[1]) <= kilometres;
  });
}

/** A dollar figure is CAD. An explicit foreign currency is omitted. */
export function parseCadAmount(text: string | null | undefined): number | null {
  const raw = text?.trim() || "";
  if (!raw) return null;
  if (/\b(USD|EUR|GBP|AUD|US\$|U\.S\.)\b/i.test(raw)) return null;
  const match = raw.match(/\$\s?([\d]{1,3}(?:,\d{3})+|\d{3,})(?:\.\d+)?/);
  if (!match) return null;
  const amount = Number(match[1]!.replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

export function milesToKilometres(miles: number): string {
  const km = miles * 1.60934;
  const shown = km >= 10 ? String(Math.round(km)) : km.toFixed(1).replace(/\.0$/, "");
  return `${shown} km`;
}

/** Distances are written in kilometres. Mile figures are converted. */
export function normalizeDistanceCopy(text: string): string {
  return text.replace(
    /\b(\d+(?:\.\d+)?)\s*(?:miles|mile|mi)\b/gi,
    (_, raw: string) => milesToKilometres(Number(raw)),
  );
}

export function polishSystemCopy(text: string): string {
  const withoutBoardLinks = text.replace(/https?:\/\/(?:[\w.-]+\.)?realtor\.ca\S*/gi, "").replace(/\brealtor\.ca\b/gi, "");
  return withBrandMarks(normalizeDistanceCopy(withoutBoardLinks)).replace(/\s+/g, " ").trim();
}

export function initialsLogoDataUrl(initials: string): string {
  const letters = initials.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "RE";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 96">` +
    `<rect width="240" height="96" fill="#111111"/>` +
    `<text x="120" y="62" text-anchor="middle" fill="#ffffff" ` +
    `font-family="Helvetica, Arial, sans-serif" font-size="42" font-weight="700">${letters}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function brokerageInitials(name: string, fastCode: string): string {
  return slotInitials(name, fastCode);
}

const PROVINCE_NAMES: Record<string, string> = {
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
};

export function placeFromOfficeAddress(address: string): { town: string; province: string } {
  const code = address.match(/\b(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)\b/)?.[1] ?? "";
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  const town = (parts.length >= 2 ? parts[parts.length - 2] : parts[0]) ?? "";
  return { town, province: PROVINCE_NAMES[code] ?? "" };
}

function websiteHost(website: string): string {
  try {
    return new URL(website).host.replace(/^www\./, "");
  } catch {
    return website.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  }
}

function joinList(items: string[]): string {
  const unique = items.map((item) => item.trim()).filter(Boolean);
  if (unique.length === 0) return "";
  if (unique.length === 1) return unique[0]!;
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")}, and ${unique[unique.length - 1]}`;
}

export function writeBrokerageAbout(profile: SystemEbookProfile): string {
  const name = profile.brokerageName.trim();
  const town = profile.town.trim();
  const province = profile.province.trim();
  const broker = profile.brokerName.trim();
  const address = profile.officeAddress.trim();
  const host = websiteHost(profile.website);
  const areas = (profile.areas ?? []).filter((area) => area && area.toLowerCase() !== town.toLowerCase());
  const where = province ? `${town}, ${province}` : town;
  const sentences = [
    address
      ? `${name} keeps its office at ${address}.`
      : `${name} is based in ${where}.`,
  ];
  if (broker) {
    sentences.push(`${broker} leads the ${town} office.`);
  } else if (address) {
    sentences.push(`The office is in ${where}.`);
  }
  if (profile.foundedYear && profile.foundedYear >= 1900 && profile.foundedYear <= 2100) {
    sentences.push(`The firm has been part of the local market since ${profile.foundedYear}.`);
  }
  if (areas.length > 0) {
    sentences.push(`Work from this office also reaches ${joinList(areas.slice(0, 4))}.`);
  } else {
    sentences.push(`${town} is the home market, and the day-to-day work stays close to the office.`);
  }
  if (host) sentences.push(`Current listings are on ${host}.`);
  return polishSystemCopy(sentences.join(" "));
}

export function writeAreaCopy(profile: SystemEbookProfile): string {
  const name = profile.brokerageName.trim();
  const town = profile.town.trim();
  const address = profile.officeAddress.trim();
  const areas = (profile.areas ?? [])
    .map((area) => area.trim())
    .filter((area) => area && area.toLowerCase() !== town.toLowerCase())
    .slice(0, 4);
  const sentences = [
    address
      ? `${town} is home ground for ${name}, and the office is at ${address}.`
      : `${town} is home ground for ${name}.`,
  ];
  if (areas.length > 0) {
    sentences.push(
      `${joinList(areas)} ${areas.length === 1 ? "is" : "are"} in the same market, within about 80 km of the office.`,
    );
  } else {
    sentences.push(`The market runs about 80 km around ${town}.`);
  }
  sentences.push(`The streets in this book are the ones the office is listing now.`);
  return polishSystemCopy(sentences.join(" "));
}

export function writeMarketCopy(profile: SystemEbookProfile): string {
  return polishSystemCopy(
    `${profile.town} is the home market for ${profile.brokerageName}. The office is at ${profile.officeAddress}. The map takes in about 80 km around that office.`,
  );
}

export function distanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return "";
  if (km < 1) return "under 1 km";
  return `${Math.round(km)} km`;
}

function factMatch(facts: string[], pattern: RegExp): string | null {
  const found = facts.find((fact) => pattern.test(fact));
  return found?.trim() || null;
}

export function listingFactsLine(facts: string[]): string {
  const beds = factMatch(facts, /bed/i);
  const baths = factMatch(facts, /bath/i);
  const area = factMatch(facts, /sq/i);
  const kind = factMatch(facts, /residential|land|condo|townhouse|commercial|house|single/i);
  return [beds, baths, area, kind].filter(Boolean).join("  ·  ");
}

export function chooseListingVisual(input: {
  photoUrl?: string | null;
  mapImageUrl?: string | null;
  townPhotoUrl?: string | null;
}): { kind: ListingVisualKind; url: string | null } {
  const photo = input.photoUrl?.trim() || "";
  if (photo) return { kind: "brokerage-photo", url: photo };
  const map = input.mapImageUrl?.trim() || "";
  if (map) return { kind: "talismaps", url: map };
  const town = input.townPhotoUrl?.trim() || "";
  if (town) return { kind: "town-photo", url: town };
  return { kind: "none", url: null };
}

/**
 * Talismaps™ static image. MapTiler is the basemap vendor for Talismaps™.
 * Returns null when the key is still the placeholder, so a caller can use a
 * prepared still instead of a broken tile request.
 */
export function talismapsStaticMapUrl(input: {
  latitude: number;
  longitude: number;
  zoom: number;
  width: number;
  height: number;
  apiKey?: string | null;
}): string | null {
  const key = input.apiKey?.trim() || "";
  if (!key || key === "YOUR_MAPTILER_API_KEY" || key.length < 8) return null;
  const zoom = Math.max(3, Math.min(16, Math.round(input.zoom)));
  const lon = input.longitude.toFixed(5);
  const lat = input.latitude.toFixed(5);
  return (
    `https://api.maptiler.com/maps/streets-v2/static/${lon},${lat},${zoom}/` +
    `${input.width}x${input.height}.png?key=${encodeURIComponent(key)}` +
    `&markers=${lon},${lat}`
  );
}

function listingKindPhrase(kind: string | null): string | null {
  if (!kind) return null;
  const lower = kind.toLowerCase();
  if (/commercial/.test(lower)) return "commercial property";
  if (/condo/.test(lower)) return "condo";
  if (/townhouse/.test(lower)) return "townhouse";
  if (/land|acreage/.test(lower)) return "piece of land";
  if (/single|house|residential/.test(lower)) return "house";
  return lower;
}

function pickVariant(seed: string, count: number): number {
  let total = 0;
  for (const char of seed) total = (total + char.charCodeAt(0)) % 997;
  return total % count;
}

export function writeListingBody(
  listing: SystemEbookListing,
  profile: SystemEbookProfile,
): string {
  if (listing.story?.trim()) return polishSystemCopy(listing.story);
  const street = titleCaseAddress(listing.street.trim());
  const town = listing.town.trim();
  const name = profile.brokerageName.trim();
  const officeTown = profile.town.trim();
  const beds = factMatch(listing.facts, /(\d+)\s+bed/i);
  const baths = factMatch(listing.facts, /(\d+)\s+bath/i);
  const area = factMatch(listing.facts, /([\d,]+\s*sq\s*ft)/i);
  const lot = factMatch(listing.facts, /acre|hectare|lot/i);
  const kind = listingKindPhrase(
    factMatch(listing.facts, /residential|land|condo|townhouse|commercial|house|single|acreage/i),
  );
  const known = [beds, baths, area, lot].filter(Boolean).map((item) => item!.toLowerCase());
  const sameTown = town.toLowerCase() === officeTown.toLowerCase();
  const openings = kind
    ? [
        `${street} is a ${kind} in ${town}.`,
        `In ${town}, ${street} is a ${kind}.`,
        `${street}, in ${town}, is a ${kind}.`,
      ]
    : [
        `${street} is listed in ${town}.`,
        `The listing at ${street} is in ${town}.`,
        `${town} is the setting for ${street}.`,
      ];
  const sentences = [openings[pickVariant(street, openings.length)]!];
  if (known.length > 0) {
    sentences.push(`It has ${joinList(known)}.`);
  }
  const places = sameTown
    ? [
        `The office is in ${town} as well.`,
        `${name} works from ${town}.`,
        `Buyers are already in ${town}, where the office sits.`,
      ]
    : [
        `${town} is one of the communities ${name} serves from ${officeTown}.`,
        `From the ${officeTown} office, ${name} already works in ${town}.`,
        `${officeTown} is where the office is, and ${town} is part of that market.`,
      ];
  sentences.push(places[pickVariant(`${town}|${name}`, places.length)]!);
  return polishSystemCopy(sentences.join(" "));
}

function logoFor(profile: SystemEbookProfile): { url: string; found: boolean } {
  const url = profile.logoUrl?.trim() || "";
  if (url) return { url, found: true };
  return {
    url: initialsLogoDataUrl(brokerageInitials(profile.brokerageName, profile.fastCode)),
    found: false,
  };
}

function pageContent(page: TalisBooksViewerPage): Record<string, unknown> {
  const content: Record<string, unknown> = {
    pageRole: page.pageRole,
    layout: page.layout,
    title: page.title,
    body: page.body ?? "",
  };
  const copy = (key: keyof TalisBooksViewerPage) => {
    const value = page[key];
    if (value == null || value === "") return;
    content[key] = value;
  };
  copy("subtitle");
  copy("heroImageUrl");
  copy("brokerageName");
  copy("brokerageLogoUrl");
  copy("brokerageLine");
  copy("agentName");
  copy("agentTitle");
  copy("agentPhone");
  copy("agentEmail");
  copy("address");
  copy("latitude");
  copy("longitude");
  copy("mapZoom");
  copy("composedCover");
  copy("imageFit");
  copy("logoPlate");
  copy("slogan");
  copy("pricingLine");
  copy("signoff");
  return content;
}

function pushPage(
  pages: TalisBooksViewerPage[],
  page: Omit<TalisBooksViewerPage, "pageNumber" | "id"> & { slug: string },
) {
  const pageNumber = pages.length + 1;
  pages.push({
    ...page,
    id: `system-${page.slug}`,
    pageNumber,
  });
}

export function buildSystemEbook(profile: SystemEbookProfile): SystemEbookDocument {
  const fastCode = profile.fastCode.trim().toLowerCase();
  const phone = formatCanadianPhone(profile.phone);
  const listings = (profile.listings ?? [])
    .filter((listing) => listing.street.trim() && listing.town.trim() && Boolean(listing.photoUrl?.trim()))
    .slice(0, MAX_LISTING_PAGES);
  const lackedListings = listings.length === 0;
  const servedTowns = new Set(
    (profile.areas ?? []).map((area) => area.trim().toLowerCase()).filter(Boolean),
  );
  const areas = [...(profile.areas ?? []).map((area) => area.trim()).filter(Boolean)];
  for (const listing of listings) {
    const town = listing.town.trim();
    const key = town.toLowerCase();
    if (!town || key === profile.town.trim().toLowerCase() || servedTowns.has(key)) continue;
    servedTowns.add(key);
    areas.push(town);
  }
  profile = { ...profile, areas: areas.slice(0, 5) };
  const logo = logoFor(profile);
  const host = websiteHost(profile.website);
  const townPhotos = (profile.townPhotoUrls ?? []).map((url) => url.trim()).filter(Boolean);
  const ownListingPhoto =
    listings.find((listing) => listing.photoHost !== "mls" && listing.photoUrl?.trim())?.photoUrl?.trim() ||
    listings.find((listing) => listing.photoUrl?.trim())?.photoUrl?.trim() ||
    "";
  const areaPhoto =
    profile.areaPhotoUrl?.trim() || townPhotos[0] || profile.coverMapUrl?.trim() || ownListingPhoto;
  const coverHero = areaPhoto;
  const areaVisual = profile.areaMapUrl?.trim() || "";
  const marketVisual = profile.marketMapUrl?.trim() || areaVisual || "";
  const townsServed = [profile.town, ...(profile.areas ?? [])]
    .map((town) => town.trim())
    .filter(Boolean)
    .filter((town, index, all) => all.findIndex((item) => item.toLowerCase() === town.toLowerCase()) === index)
    .slice(0, 4)
    .join(", ");
  const pages: TalisBooksViewerPage[] = [];
  const plate = profile.logoPlate ?? "light";

  pushPage(pages, {
    slug: "front-cover",
    pageRole: "cover",
    layout: "cover",
    title: profile.brokerageName,
    subtitle: `${profile.town}, ${profile.province}`,
    brokerageName: profile.brokerageName,
    brokerageLogoUrl: logo.url,
    heroImageUrl: coverHero || undefined,
    imageFit: "cover",
    logoPlate: plate,
    composedCover: true,
    clientEditable: false,
  });

  pushPage(pages, {
    slug: "market",
    pageRole: "property_content",
    layout: "maps",
    title: profile.town,
    address: profile.officeAddress,
    body: writeMarketCopy(profile),
    heroImageUrl: marketVisual || undefined,
    latitude: profile.latitude ?? undefined,
    longitude: profile.longitude ?? undefined,
    mapZoom: 9,
    clientEditable: false,
  });

  pushPage(pages, {
    slug: "about",
    pageRole: "property_content",
    layout: "essay",
    title: profile.brokerageName,
    subtitle: profile.town,
    body: writeBrokerageAbout(profile),
    address: profile.officeAddress,
    brokerageLine: townsServed ? `Towns: ${townsServed}` : undefined,
    agentPhone: phone || undefined,
    clientEditable: false,
  });

  if (areaPhoto) {
    pushPage(pages, {
      slug: "area",
      pageRole: "property_content",
      layout: "caption",
      title: profile.town,
      subtitle: profile.province,
      body: writeAreaCopy(profile),
      heroImageUrl: areaPhoto,
      imageFit: profile.areaPhotoFit ?? "cover",
      address: profile.officeAddress,
      clientEditable: false,
    });
  } else if (areaVisual) {
    pushPage(pages, {
      slug: "area-map",
      pageRole: "property_content",
      layout: "maps",
      title: profile.town,
      address: profile.officeAddress,
      body: writeAreaCopy(profile),
      heroImageUrl: areaVisual,
      latitude: profile.latitude ?? undefined,
      longitude: profile.longitude ?? undefined,
      clientEditable: false,
    });
  } else {
    pushPage(pages, {
      slug: "area",
      pageRole: "property_content",
      layout: "essay",
      title: profile.town,
      subtitle: profile.province,
      body: writeAreaCopy(profile),
      address: profile.officeAddress,
      clientEditable: false,
    });
  }

  listings.forEach((listing, index) => {
    const visual = chooseListingVisual({ photoUrl: listing.photoUrl });
    const street = titleCaseAddress(listing.street.trim());
    const address = `${street}, ${listing.town.trim()}`;
    pushPage(pages, {
      slug: `listing-${String(index + 1).padStart(2, "0")}`,
      pageRole: "property_content",
      layout: "listing",
      title: street,
      subtitle: listing.town.trim(),
      body: writeListingBody({ ...listing, street }, profile),
      heroImageUrl: visual.url || undefined,
      imageFit: "cover",
      address,
      pricingLine: listing.priceCad != null && listing.priceCad > 0 ? formatCad(listing.priceCad) : undefined,
      signoff: listingFactsLine(listing.facts),
      brokerageName: profile.brokerageName,
      agentPhone: phone || undefined,
      slogan: host,
      latitude: listing.latitude ?? undefined,
      longitude: listing.longitude ?? undefined,
      clientEditable: false,
    });
  });

  pushPage(pages, {
    slug: "contact",
    pageRole: "agent_brokerage",
    layout: "contact",
    title: profile.brokerName || profile.brokerageName,
    agentName: profile.brokerName || profile.brokerageName,
    agentTitle: "Broker",
    agentPhone: phone || undefined,
    brokerageName: profile.brokerageName,
    brokerageLogoUrl: logo.url,
    logoPlate: plate,
    address: profile.officeAddress,
    slogan: host,
    clientEditable: false,
  });

  // The back cover sits alone when the page count is even.
  if ((pages.length + 1) % 2 !== 0) {
    pushPage(pages, {
      slug: "around-town",
      pageRole: "property_content",
      layout: "quote",
      title: `Around ${profile.town}`,
      body: polishSystemCopy(
        `${profile.brokerageName} keeps its office in ${profile.town}. People start at ${profile.officeAddress}, and the website is ${host}.`,
      ),
      clientEditable: false,
    });
  }

  const credit = profile.photoCredit?.trim() || "";
  pushPage(pages, {
    slug: "back-cover",
    pageRole: "cover",
    layout: "cover",
    title: profile.brokerageName,
    subtitle: `${profile.town}, ${profile.province}`,
    body: credit || polishSystemCopy("A Talisbook on Tsplits."),
    brokerageName: profile.brokerageName,
    brokerageLogoUrl: logo.url,
    heroImageUrl: coverHero || undefined,
    imageFit: "cover",
    logoPlate: plate,
    composedCover: true,
    clientEditable: false,
  });

  const title = profile.brokerageName.trim();
  const subtitle = profile.officeAddress.trim();
  const description = polishSystemCopy(
    `A Talisbook for ${title} in ${profile.province ? `${profile.town}, ${profile.province}` : profile.town}.`,
  );
  const pageRows: SystemEbookPageRow[] = pages.map((page) => ({
    title: page.title,
    slug: page.id.replace(/^system-/, ""),
    page_number: page.pageNumber,
    sort_order: page.pageNumber,
    content: pageContent(page),
    is_visible: true,
  }));
  const metadata: Record<string, unknown> = {
    fixedPageFrame: true,
    systemEbookFormat: "standard",
    skipPermanentPages: true,
    exactPdfPages: false,
    autoGenerated: true,
    source: "self-service-pdf",
    listingImageSource: "brokerage-website",
    lackedListings,
    logoFound: logo.found,
    coverImageUrl: areaPhoto || null,
    backCoverImageUrl: areaPhoto || null,
    explicitCovers: true,
    coverSpreadOpening: false,
  };

  const book: TalisBooksViewerBook = {
    id: `preview-${fastCode}`,
    slug: `preview-${fastCode}-system-ebook`,
    fastCode,
    title,
    subtitle,
    description,
    viewerStyle: "magazine",
    fixedPageFrame: true,
    isolatedBookshelf: true,
    pages,
  };

  return {
    title,
    subtitle,
    description,
    lackedListings,
    logoFound: logo.found,
    listingCount: listings.length,
    extractedListingCount: profile.extractedListingCount ?? listings.length,
    ownSitePhotoCount: listings.filter((listing) => listing.photoHost !== "mls").length,
    mlsPhotoCount: listings.filter((listing) => listing.photoHost === "mls").length,
    rejectedWatermarkCount: profile.rejectedWatermarkCount ?? 0,
    usedApprovedPreview: false,
    metadata,
    pages,
    pageRows,
    book,
  };
}
