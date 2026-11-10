/**
 * Standard system Talisbook™.
 *
 * The open book stays the RM22 / North Shore frame: a 16:9 spread made of
 * two 960×1080 leaves. Photos are cover-fitted or contain-fitted inside
 * that frame. They never become the page size.
 *
 * Page order follows the brokerage book already used by the editor:
 *   front cover, about the brokerage, listing pages, an area page,
 *   a market page, a contact page, and a back cover.
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
  /** A photo from the brokerage site that is not watermarked. */
  photoUrl?: string | null;
  /** Static Talismaps™ image when the listing has no clean photo. */
  mapImageUrl?: string | null;
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
  /** Clean area photograph. Town-photo books pass their stored photos here. */
  areaPhotoUrl?: string | null;
  areaPhotoFit?: "cover" | "contain";
  /** Talismaps™ still of the town, used when the site has no clean cover photo. */
  coverMapUrl?: string | null;
  /** Closer Talismaps™ still for the area leaf. */
  areaMapUrl?: string | null;
  /** Office pin with about an 80 km radius. */
  marketMapUrl?: string | null;
  /** Light plate behind a dark logo. None leaves a dark logo file as-is. */
  logoPlate?: "light" | "none";
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
  return withBrandMarks(normalizeDistanceCopy(text)).replace(/\s+/g, " ").trim();
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
  const areas = (profile.areas ?? []).filter((area) => area && area.toLowerCase() !== town.toLowerCase());
  const where = province ? `${town}, ${province}` : town;
  const sentences = [`${name} is a real estate brokerage in ${where}.`];
  if (profile.foundedYear && profile.foundedYear >= 1900 && profile.foundedYear <= 2100) {
    sentences.push(`The office has been part of the ${town} market since ${profile.foundedYear}.`);
  }
  if (broker) {
    sentences.push(`${broker} leads the office.`);
  }
  if (areas.length > 0) {
    sentences.push(`The work also reaches ${joinList(areas.slice(0, 3))}.`);
  }
  sentences.push(
    `This Talisbook introduces the brokerage, the market around ${town}, and the homes on the brokerage website.`,
  );
  return polishSystemCopy(sentences.join(" "));
}

export function writeAreaCopy(profile: SystemEbookProfile): string {
  const areas = (profile.areas ?? []).slice(0, 3);
  const reach =
    areas.length > 0
      ? ` The same office also works in ${joinList(areas)}, still inside a Canadian market measured in kilometres.`
      : ` Distances around ${profile.town} are counted in kilometres.`;
  return polishSystemCopy(
    `${profile.town}, ${profile.province} is the market ${profile.brokerageName} works in.${reach} The pages that follow stay with what the brokerage itself publishes.`,
  );
}

export function writeMarketCopy(profile: SystemEbookProfile): string {
  return polishSystemCopy(
    `${profile.town} is the home market for ${profile.brokerageName}. The pin marks the office at ${profile.officeAddress}. The circle around that pin is about 80 km.`,
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

export function writeListingBody(
  listing: SystemEbookListing,
  profile: SystemEbookProfile,
): string {
  const street = listing.street.trim();
  const town = listing.town.trim();
  const beds = factMatch(listing.facts, /(\d+)\s+bed/i);
  const baths = factMatch(listing.facts, /(\d+)\s+bath/i);
  const area = factMatch(listing.facts, /([\d,]+\s*sq\s*ft)/i);
  const kind = factMatch(listing.facts, /residential|land|condo|townhouse|commercial/i);
  const homeKind = kind ? kind.toLowerCase() : "home";
  const details = [beds, baths, area].filter(Boolean).map((item) => item!.toLowerCase());
  const detail = details.length ? `, with ${details.join(", ")}` : "";
  const lead = `${street} is a ${homeKind} in ${town}${detail}.`;
  let reach = `${profile.brokerageName} is the brokerage offering it, in the ${profile.town} market.`;
  if (
    listing.latitude != null &&
    listing.longitude != null &&
    profile.latitude != null &&
    profile.longitude != null
  ) {
    const km = distanceKm(profile.latitude, profile.longitude, listing.latitude, listing.longitude);
    reach = `The pin sits ${formatDistanceKm(km)} from the ${profile.brokerageName} office in ${profile.town}.`;
  }
  const price =
    listing.priceCad != null
      ? `The figure on the brokerage website is ${formatCad(listing.priceCad)}.`
      : `${town} is part of the area the office already works in.`;
  return polishSystemCopy(`${lead} ${reach} ${price}`);
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
  const listings = (profile.listings ?? [])
    .filter((listing) => listing.street.trim() && listing.town.trim())
    .slice(0, MAX_LISTING_PAGES);
  const lackedListings = listings.length === 0;
  const logo = logoFor(profile);
  const host = websiteHost(profile.website);
  const townPhotos = (profile.townPhotoUrls ?? []).map((url) => url.trim()).filter(Boolean);
  const areaPhoto = profile.areaPhotoUrl?.trim() || townPhotos[0] || "";
  const coverHero = areaPhoto || profile.coverMapUrl?.trim() || profile.marketMapUrl?.trim() || "";
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
    slug: "about",
    pageRole: "property_content",
    layout: "essay",
    title: profile.brokerageName,
    subtitle: profile.town,
    body: writeBrokerageAbout(profile),
    address: profile.officeAddress,
    brokerageLine: townsServed ? `Towns: ${townsServed}` : undefined,
    agentPhone: profile.phone?.trim() || undefined,
    clientEditable: false,
  });

  if (areaPhoto) {
    pushPage(pages, {
      slug: "area-photo",
      pageRole: "property_content",
      layout: "facing",
      title: `${profile.town}, ${profile.province}`,
      heroImageUrl: areaPhoto,
      imageFit: profile.areaPhotoFit ?? "contain",
      captionsEnabled: true,
      captionAlign: "left",
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
    const townPhoto = townPhotos[index % Math.max(townPhotos.length, 1)] || "";
    const visual = chooseListingVisual({
      photoUrl: listing.photoUrl,
      mapImageUrl: listing.mapImageUrl,
      townPhotoUrl: listing.photoUrl || listing.mapImageUrl ? null : townPhoto,
    });
    const address = `${listing.street.trim()}, ${listing.town.trim()}`;
    pushPage(pages, {
      slug: `listing-${String(index + 1).padStart(2, "0")}`,
      pageRole: "property_content",
      layout: "listing",
      title: listing.street.trim(),
      subtitle: listing.town.trim(),
      body: writeListingBody(listing, profile),
      heroImageUrl: visual.url || undefined,
      imageFit: "cover",
      address,
      pricingLine: listing.priceCad != null ? formatCad(listing.priceCad) : undefined,
      signoff: listingFactsLine(listing.facts),
      brokerageName: profile.brokerageName,
      agentPhone: profile.phone?.trim() || undefined,
      slogan: host,
      latitude: listing.latitude ?? undefined,
      longitude: listing.longitude ?? undefined,
      clientEditable: false,
    });
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
    slug: "contact",
    pageRole: "agent_brokerage",
    layout: "contact",
    title: profile.brokerName || profile.brokerageName,
    agentName: profile.brokerName || profile.brokerageName,
    agentTitle: "Broker",
    agentPhone: profile.phone?.trim() || undefined,
    brokerageName: profile.brokerageName,
    brokerageLogoUrl: logo.url,
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
    metadata,
    pages,
    pageRows,
    book,
  };
}
