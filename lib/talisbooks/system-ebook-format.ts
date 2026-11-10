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
  photoFit?: "cover" | "contain";
};

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
  const office = profile.officeAddress.trim();
  const broker = profile.brokerName.trim();
  const areas = (profile.areas ?? []).filter((area) => area && area.toLowerCase() !== town.toLowerCase());
  const where = province ? `${town}, ${province}` : town;
  const sentences = [
    `${name} is a real estate brokerage in ${where}.`,
  ];
  if (profile.foundedYear && profile.foundedYear >= 1900 && profile.foundedYear <= 2100) {
    sentences.push(`The office has been part of the ${town} market since ${profile.foundedYear}.`);
  }
  if (broker && office) {
    sentences.push(`${broker} works from ${office}.`);
  } else if (office) {
    sentences.push(`The office is at ${office}.`);
  }
  if (areas.length > 0) {
    sentences.push(`Listings on the brokerage website also reach ${joinList(areas.slice(0, 3))}.`);
  }
  if (profile.phone?.trim()) {
    sentences.push(`The office number published on the website is ${profile.phone.trim()}.`);
  }
  sentences.push(
    `This Talisbook introduces the brokerage, the market around ${town}, and the homes the office is offering on its own website.`,
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
    `${profile.town} is the home market for ${profile.brokerageName}. The pin marks the office at ${profile.officeAddress}.`,
  );
}

export function writeListingBody(listing: SystemEbookListing, brokerageName: string): string {
  const place = `${listing.street.trim()}, ${listing.town.trim()}`;
  const bits: string[] = [];
  if (listing.priceCad != null) bits.push(formatCad(listing.priceCad));
  const facts = listing.facts.map((fact) => fact.trim()).filter(Boolean);
  if (facts.length) bits.push(facts.join(", "));
  const lead = bits.join(". ");
  const sentence = `${brokerageName} is offering ${place} on its own website.`;
  return polishSystemCopy([lead, sentence].filter(Boolean).join(". ").replace(/\.\./g, "."));
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
  copy("slogan");
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
  const officeLine = [profile.officeAddress.trim(), host].filter(Boolean).join(" · ");
  const areaPhoto =
    profile.areaPhotoUrl?.trim() ||
    profile.townPhotoUrls?.find((url) => url.trim()) ||
    "";
  const pages: TalisBooksViewerPage[] = [];

  pushPage(pages, {
    slug: "front-cover",
    pageRole: "cover",
    layout: "cover",
    title: profile.brokerageName,
    subtitle: `${profile.town}, ${profile.province}`,
    brokerageName: profile.brokerageName,
    brokerageLogoUrl: logo.url,
    heroImageUrl: areaPhoto || undefined,
    imageFit: "cover",
    composedCover: true,
    clientEditable: false,
  });

  pushPage(pages, {
    slug: "about",
    pageRole: "property_content",
    layout: "quote",
    title: profile.brokerageName,
    body: writeBrokerageAbout(profile),
    brokerageName: profile.brokerageName,
    brokerageLogoUrl: logo.url,
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
  } else {
    pushPage(pages, {
      slug: "area",
      pageRole: "property_content",
      layout: "quote",
      title: profile.town,
      body: writeAreaCopy(profile),
      clientEditable: false,
    });
  }

  listings.forEach((listing, index) => {
    const photo = listing.photoUrl?.trim() || "";
    const address = `${listing.street.trim()}, ${listing.town.trim()}`;
    pushPage(pages, {
      slug: `listing-${String(index + 1).padStart(2, "0")}`,
      pageRole: "property_content",
      layout: photo ? "caption" : "quote",
      title: address,
      subtitle: listing.priceCad != null ? formatCad(listing.priceCad) : undefined,
      body: writeListingBody(listing, profile.brokerageName),
      heroImageUrl: photo || undefined,
      imageFit: photo ? listing.photoFit ?? "cover" : undefined,
      address,
      pricingLine: listing.priceCad != null ? formatCad(listing.priceCad) : undefined,
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
    latitude: profile.latitude ?? undefined,
    longitude: profile.longitude ?? undefined,
    mapZoom: 13,
    clientEditable: false,
  });

  pushPage(pages, {
    slug: "contact",
    pageRole: "agent_brokerage",
    layout: "agent_summary",
    title: profile.brokerName || profile.brokerageName,
    agentName: profile.brokerName || profile.brokerageName,
    agentTitle: "Broker",
    agentPhone: profile.phone?.trim() || undefined,
    agentEmail: profile.email?.trim() || undefined,
    brokerageName: profile.brokerageName,
    brokerageLogoUrl: logo.url,
    brokerageLine: officeLine,
    address: profile.officeAddress,
    slogan: [profile.officeAddress.trim(), host].filter(Boolean).join(" · "),
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
    heroImageUrl: areaPhoto || undefined,
    imageFit: "cover",
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
