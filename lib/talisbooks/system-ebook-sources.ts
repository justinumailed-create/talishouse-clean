/**
 * Facts, logos, and listing cards from a brokerage's own website.
 * Realtor.ca hosts, board watermarks, and Glasshouse art are dropped.
 */

import sharp from "sharp";
import {
  isBlockedListingUrl,
  isSameBrokerageHost,
  isSkippableBrokerageImage,
} from "@/lib/talisbooks/blocked-listing-sources";
import {
  parseCadAmount,
  type SystemEbookListing,
  type SystemEbookProfile,
} from "@/lib/talisbooks/system-ebook-format";

const OTHER_BROKERAGE =
  /\b(exp realty|eXp Realty|re\/max|remax|royal lepage|century 21|coldwell banker|sutton group|keller williams)\b/i;

const ADDRESS =
  /(?<![\d,$])(\d{1,6}(?:\s+[A-Za-z0-9#./-]+){1,6}\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Way|Boulevard|Blvd|Crescent|Cres|Lane|Ln|Route|Rue|Chemin))\b/i;

const WATERMARK_URL =
  /watermark|realtypress\/images\/listing|mrp-listings|logo-mls|mls-logo|realtor\.ca|glasshouse/i;

export type BrokerageLogoHit = {
  url: string;
  source: "header" | "og" | "icon";
};

export function isRejectedSystemEbookImageUrl(url: string | null | undefined): boolean {
  const raw = url?.trim() || "";
  if (!raw) return true;
  if (isBlockedListingUrl(raw)) return true;
  if (WATERMARK_URL.test(raw)) return true;
  if (/glasshouse/i.test(raw)) return true;
  return false;
}

export function isRejectedListingPhotoUrl(url: string | null | undefined): boolean {
  if (isRejectedSystemEbookImageUrl(url)) return true;
  return isSkippableBrokerageImage({ url: url!.trim() });
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x3[Dd];/g, "=");
}

function readAttr(tag: string, name: string): string {
  const match = tag.match(
    new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, "i"),
  );
  return decodeHtml(match?.[2] ?? match?.[3] ?? match?.[4] ?? "").trim();
}

function resolveAgainst(value: string, base: string): string | null {
  const trimmed = decodeHtml(value).trim();
  if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return null;
  try {
    return new URL(trimmed, base).toString();
  } catch {
    return null;
  }
}

function visibleText(html: string): string {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  ).replace(/\s+/g, " ").trim();
}

function headerRegion(html: string): string {
  const match = html.match(/<header\b[\s\S]*?<\/header>/i);
  return match?.[0] ?? html.slice(0, 8000);
}

export function extractBrokerageLogo(html: string, pageUrl: string): BrokerageLogoHit | null {
  const header = headerRegion(html);
  const headerImgs = [...header.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  for (const tag of headerImgs) {
    const src = resolveAgainst(readAttr(tag, "src") || readAttr(tag, "data-src"), pageUrl);
    const label = `${src ?? ""} ${readAttr(tag, "alt")} ${readAttr(tag, "class")} ${readAttr(tag, "id")}`;
    if (!src || isRejectedSystemEbookImageUrl(src)) continue;
    if (/mls|realtor|watermark|social|facebook|instagram/i.test(label)) continue;
    if (/logo|brand/i.test(label) || /class=['"][^'"]*logo/i.test(header.slice(Math.max(0, header.indexOf(tag) - 120), header.indexOf(tag)))) {
      return { url: src, source: "header" };
    }
  }
  if (headerImgs.length > 0) {
    const tag = headerImgs[0]!;
    const src = resolveAgainst(readAttr(tag, "src") || readAttr(tag, "data-src"), pageUrl);
    if (src && !isRejectedSystemEbookImageUrl(src) && !/mls|realtor|facebook|instagram/i.test(src)) {
      return { url: src, source: "header" };
    }
  }

  const og = html.match(
    /<meta\b[^>]*(?:property|name)=["']og:image["'][^>]*>/i,
  );
  if (og) {
    const content = resolveAgainst(readAttr(og[0], "content"), pageUrl);
    if (content && !isRejectedSystemEbookImageUrl(content) && !/mls|realtor/i.test(content)) {
      return { url: content, source: "og" };
    }
  }

  const icon = html.match(
    /<link\b[^>]*rel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["'][^>]*>/i,
  );
  if (icon) {
    const href = resolveAgainst(readAttr(icon[0], "href"), pageUrl);
    if (href && !isRejectedSystemEbookImageUrl(href)) {
      return { url: href, source: "icon" };
    }
  }
  return null;
}

export function extractFoundedYear(html: string): number | null {
  const text = visibleText(html);
  const match = text.match(
    /\b(?:since|established|founded|created|opened)\s+(?:in\s+)?((?:19|20)\d{2})\b/i,
  );
  if (!match) return null;
  const year = Number(match[1]);
  return year >= 1900 && year <= 2100 ? year : null;
}

export function extractPhone(html: string): string | null {
  const tel = html.match(/href=["']tel:([^"']+)["']/i);
  if (tel) {
    const digits = decodeHtml(tel[1]!).replace(/[^\d+()-.\s]/g, "").trim();
    if (digits.replace(/\D/g, "").length >= 10) return digits;
  }
  const text = visibleText(html);
  const shown = text.match(/\b(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/);
  return shown?.[0] ?? null;
}

function townFromTail(tail: string): string | null {
  const cleaned = tail.replace(/\s+/g, " ").replace(/^[, ]+/, "").trim();
  const town = (cleaned.match(/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ.'’\-\s]{1,40}/)?.[0] ?? "")
    .split(/,|\||\(/)[0]!
    .replace(/\s+[A-Z]$/, "")
    .trim();
  if (!town || town.length < 2 || town.length > 40) return null;
  if (/^(?:for|sale|bed|bath|sq|location|the)$/i.test(town)) return null;
  if (/location$/i.test(town)) return null;
  return town;
}

const STREET_TYPE =
  "Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Way|Boulevard|Blvd|Crescent|Cres|Lane|Ln|Route|Rue|Chemin|Court|Ct|Place|Pl|Terrace|Terr|Trail|Highway|Hwy";

const PROVINCE_TAIL =
  /^(?:new brunswick|british columbia|saskatchewan|alberta|qu[eé]bec|ontario|nova scotia|prince edward island|manitoba|newfoundland(?: and labrador)?|pei|nb|bc|sk|ab|qc|on|ns)$/i;

export type ListingExtractContext = {
  brokerageName?: string | null;
  officeTown?: string | null;
};

function normalizeStreet(raw: string): string {
  const cleaned = decodeHtml(raw).replace(/\s+/g, " ").replace(/^(\d{1,6})\s*,\s*/, "$1 ").trim();
  const unit = cleaned.match(/^(\d{1,6})-(\d{1,4})\s+(.+)$/);
  if (unit) return `${unit[1]} ${unit[3]}, Unit ${unit[2]}`;
  return cleaned.replace(/,\s*$/, "");
}

function looksLikeStreet(value: string): boolean {
  return new RegExp(
    `\\b(?:\\d{1,6}\\s+.+\\s+(?:${STREET_TYPE})\\b|\\d{1,6}\\s+Route\\s+\\d+|\\d{1,6}\\s+(?:rue|chemin)\\s+)`,
    "i",
  ).test(value);
}

function factsFrom(text: string): string[] {
  const facts: string[] = [];
  const beds =
    text.match(/\bbedrooms?\s*:\s*(\d{1,2})\b/i) ||
    text.match(/\b(\d{1,2})\s+(?:bed(?:room)?s?|chambres?)\b/i);
  const baths =
    text.match(/\bbathrooms?\s*:\s*(\d{1,2})\b/i) ||
    text.match(/\b(\d{1,2})\s+(?:bath(?:room)?s?|salles?\s+de\s+bain)\b/i);
  const area =
    text.match(/\bfloor area\s*:\s*([\d,]{3,})\s*sq/i) ||
    text.match(/\b([\d,]{3,})\s*(?:sq\.?\s*ft|sqft|pi(?:\s*²|2)?)\b/i);
  const kind = text.match(
    /\b(Single Family|Residential|Condo|Townhouse|Land|Acreage|Commercial|House)\b/i,
  );
  const bedCount = beds ? Number(beds[1]) : 0;
  const bathCount = baths ? Number(baths[1]) : 0;
  if (bedCount >= 1 && bedCount <= 12) facts.push(`${bedCount} bedrooms`);
  if (bathCount >= 1 && bathCount <= 12) facts.push(`${bathCount} bathrooms`);
  if (area) facts.push(`${area[1]!.replace(/\s/g, "")} sq ft`);
  if (kind) facts.push(kind[1]!);
  return facts;
}

function priceFrom(text: string): number | null {
  const dollar = text.match(/\$\s?[\d]{1,3}(?:[,\s]\d{3})+/);
  if (dollar) return parseCadAmount(dollar[0]!.replace(/\s/g, ""));
  const trailing = text.match(/\b(\d{1,3}(?:[,\s]\d{3})+)\s*\$/);
  if (trailing) return parseCadAmount(`$${trailing[1]!.replace(/\s/g, "")}`);
  return null;
}

function parsePlaceLabel(label: string): { street: string; town: string } | null {
  const parts = decodeHtml(label)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const street = normalizeStreet(parts[0] || "");
  if (!street || !looksLikeStreet(street)) return null;
  const town = parts.slice(1).find((part) => !PROVINCE_TAIL.test(part));
  if (!town) return null;
  return { street, town };
}

function brokerageLineAllows(
  line: string,
  context?: ListingExtractContext,
): boolean {
  const text = line.replace(/\s+/g, " ").trim();
  if (!text) return true;
  const name = context?.brokerageName?.trim().toLowerCase() || "";
  const tokens = name
    .split(/\s+/)
    .filter((word) => word.length > 3 && !/^(realty|real|estate|group|inc|ltd|agence|the)$/i.test(word));
  const hit = Boolean(name) && (text.toLowerCase().includes(name) || tokens.some((token) => text.toLowerCase().includes(token)));
  const branch = text.match(/\(([^)]+)\)/)?.[1]?.trim() || "";
  const office = context?.officeTown?.trim().toLowerCase() || "";
  if (hit && branch && office && !branch.toLowerCase().includes(office) && !office.includes(branch.toLowerCase())) {
    return false;
  }
  if (hit) return true;
  if (OTHER_BROKERAGE.test(text) || /courtesy of|listed by/i.test(text)) return false;
  return true;
}

function dedupeListings(listings: SystemEbookListing[]): SystemEbookListing[] {
  const seen = new Set<string>();
  const out: SystemEbookListing[] = [];
  for (const listing of listings) {
    const key = `${listing.street.toLowerCase()}|${listing.town.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(listing);
  }
  return out;
}

function extractStructuredListings(
  html: string,
  context?: ListingExtractContext,
): SystemEbookListing[] {
  const found: SystemEbookListing[] = [];
  for (const match of html.matchAll(
    /<span class="alt-addr">\s*([^<]+?)\s*<\/span>[\s\S]{0,500}?<span class="alt-city">\s*([^<]+?)\s*<\/span>/gi,
  )) {
    const street = normalizeStreet(match[1] || "");
    const town = decodeHtml(match[2] || "").trim();
    if (!looksLikeStreet(street) || !town) continue;
    const around = html.slice(Math.max(0, (match.index ?? 0) - 400), (match.index ?? 0) + 2200);
    const kind = around.match(
      /:\s*(Residential|Land|Commercial|Single Family|Condo|Townhouse|Vacant Land)\b/i,
    );
    const facts = factsFrom(visibleText(around));
    if (kind && !facts.some((fact) => fact.toLowerCase() === kind[1]!.toLowerCase())) {
      facts.push(kind[1]!);
    }
    found.push({
      street,
      town,
      priceCad: priceFrom(visibleText(around)),
      facts,
    });
  }
  for (const match of html.matchAll(/<h4>\s*([^<]+?)\s*<\/h4>((?:(?!<h4>)[\s\S]){0,1600})/gi)) {
    const street = normalizeStreet(match[1] || "");
    const tail = match[2] || "";
    const town = decodeHtml(
      tail.match(/city-province-postalcode[^>]*>\s*([^<,]+)/i)?.[1] ||
        tail.match(/\bin\s+([^,<]{2,40}),\s*(?:prince edward|new brunswick|british columbia|nova scotia|ontario|quebec|qu[eé]bec|alberta|saskatchewan|manitoba)/i)?.[1] ||
        "",
    ).trim();
    if (!looksLikeStreet(street) || !town) continue;
    if (!brokerageLineAllows(tail.match(/<small>\s*([^<]+)\s*<\/small>/i)?.[1] || "", context)) continue;
    const before = html.slice(Math.max(0, (match.index ?? 0) - 2400), match.index ?? 0);
    const previousHeading = before.lastIndexOf("<h4");
    const priceScope = (previousHeading >= 0 ? before.slice(previousHeading) : before) + tail;
    found.push({
      street,
      town,
      priceCad: priceFrom(priceScope),
      facts: factsFrom(visibleText(tail)),
    });
  }
  for (const match of html.matchAll(/class="listing-card__address">\s*([^<]+?)\s*</gi)) {
    const place = parsePlaceLabel(match[1] || "");
    if (!place) continue;
    const around = html.slice(Math.max(0, (match.index ?? 0) - 700), (match.index ?? 0) + 200);
    if (!brokerageLineAllows(visibleText(around), context)) continue;
    found.push({
      street: place.street,
      town: place.town,
      priceCad: priceFrom(around),
      facts: factsFrom(visibleText(around)),
    });
  }
  for (const match of html.matchAll(
    /<span class="rcr-slider__title">\s*([^<]+?)\s*<\/span>((?:(?!<span class="rcr-slider__title")[\s\S]){0,500})/gi,
  )) {
    const place = parsePlaceLabel(match[1] || "");
    if (!place) continue;
    const tail = visibleText(match[2] || "");
    found.push({
      street: place.street,
      town: place.town,
      priceCad: priceFrom(tail),
      facts: factsFrom(tail),
    });
  }
  return found;
}

const LISTING_INDEX =
  /\/(?:listings(?:\/listings)?|officelistings|our-listings|properties-our-listings|team-listings|proprietes|inscriptions)(?:\/|$|\?)/i;
const REGIONAL_FEED =
  /recip\.html|mls-search|listing-search|\/idx(?:\/|$)|kootenay-mls|inter-agences|interagency/i;
const ASSET_LINK = /\.(?:css|js|mjs|png|jpe?g|webp|gif|svg|ico|woff2?|pdf)(?:$|\?)/i;

export function listingIndexLinks(html: string, pageUrl: string): string[] {
  const preferred: string[] = [];
  const rest: string[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(/href\s*=\s*("([^"]+)"|'([^']+)'|([^\s"'=<>]+))/gi)) {
    const href = decodeHtml(match[2] || match[3] || match[4] || "").replace(/&#0*38;|&amp;/gi, "&");
    if (!href || ASSET_LINK.test(href) || REGIONAL_FEED.test(href)) continue;
    if (!/listing|propert|office|our-|inscription|propriete|for-sale|a-vendre|ventes/i.test(href)) continue;
    const absolute = resolveAgainst(href, pageUrl);
    if (!absolute || isBlockedListingUrl(absolute) || !isSameBrokerageHost(absolute, pageUrl)) continue;
    const key = absolute.split("#")[0]!;
    if (seen.has(key)) continue;
    seen.add(key);
    if (LISTING_INDEX.test(key) || /posts_per_page=48|_pg=2|[?&]paged=2/.test(key)) preferred.push(key);
    else rest.push(key);
  }
  return [...preferred, ...rest].slice(0, 6);
}

export function extractListingCandidates(
  html: string,
  pageUrl: string,
  context?: ListingExtractContext,
): SystemEbookListing[] {
  const structured = dedupeListings(extractStructuredListings(html, context));
  if (structured.length > 0) return structured;

  const text = visibleText(html);
  const found: SystemEbookListing[] = [];
  const seen = new Set<string>();
  const priceRe = /\$\s?[\d]{1,3}(?:,\d{3})+/g;
  for (const priceMatch of text.matchAll(priceRe)) {
    const at = priceMatch.index ?? 0;
    const window = text.slice(Math.max(0, at - 40), at + 140);
    if (/\b(search mls|public mls)\b/i.test(window)) continue;
    const address = window.match(ADDRESS);
    if (!address || address.index == null) continue;
    const card = window.slice(0, address.index + address[0].length);
    if (OTHER_BROKERAGE.test(card)) continue;
    const street = address[1]!.replace(/\s+/g, " ").trim();
    const after = window.slice(window.indexOf(street) + street.length);
    const town = townFromTail(after) || townFromTail(window.slice(0, window.indexOf(street)));
    if (!town) continue;
    const key = `${street.toLowerCase()}|${town.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const priceCad = parseCadAmount(priceMatch[0] ?? "");
    const facts: string[] = [];
    const beds = window.match(/\b([1-9]|1[0-2])\s+bed(?:room)?s?\b/i);
    const baths = window.match(/\b([1-9]|1[0-2])\s+bath(?:room)?s?\b/i);
    const area = window.match(/\b([\d,]{3,})\s*sq\.?\s*ft\b/i);
    const kind = window.match(/\b(Single Family|Residential|Condo|Townhouse|Land|Acreage|Commercial)\b/i);
    if (beds) facts.push(`${beds[1]} bedrooms`);
    if (baths) facts.push(`${baths[1]} bathrooms`);
    if (area) facts.push(`${area[1]} sq ft`);
    if (kind) facts.push(kind[1]!);
    found.push({ street, town, priceCad, facts });
    if (found.length >= 6) break;
  }

  // Attach a same-site photo when the card names the street and the image is not a known watermark path.
  const images = [...html.matchAll(/<(?:img|a|div)\b[^>]*>/gi)].map((match) => match[0]);
  for (const listing of found) {
    const needle = listing.street.toLowerCase().slice(0, 18);
    for (const tag of images) {
      const blob = decodeHtml(tag).toLowerCase();
      if (!blob.includes(needle)) continue;
      const raw =
        readAttr(tag, "data-src") ||
        readAttr(tag, "data-full-src") ||
        readAttr(tag, "src") ||
        "";
      const background = tag.match(/background(?:-image)?:\s*url\(([^)]+)\)/i);
      const candidate = resolveAgainst(raw || background?.[1]?.replace(/['"]/g, "") || "", pageUrl);
      if (!candidate || isRejectedListingPhotoUrl(candidate)) continue;
      if (!isSameBrokerageHost(candidate, pageUrl) && !/myrealpage\.com/i.test(candidate)) continue;
      listing.photoUrl = candidate;
      break;
    }
  }
  return found;
}

function glyphRatio(data: Buffer, width: number, height: number): number {
  const lum = (index: number) =>
    data[index * 3]! + data[index * 3 + 1]! + data[index * 3 + 2]!;
  let glyphs = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const value = lum(index);
      const around = (lum(index - 1) + lum(index + 1) + lum(index - width) + lum(index + width)) / 4;
      count += 1;
      if (value > 520 && value > around + 90) glyphs += 1;
    }
  }
  return count === 0 ? 0 : glyphs / count;
}

/**
 * Board marks such as REALTOR and SASK MLS sit as light type in a corner.
 * A smooth photograph does not. Skipping a false positive is safer than
 * printing a watermark in the book.
 */
export async function bufferShowsCornerWatermark(buffer: Buffer): Promise<boolean> {
  try {
    const meta = await sharp(buffer, { failOn: "none" }).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (width < 80 || height < 80) return false;
    const cropW = Math.min(280, width);
    const cropH = Math.min(48, height);
    const raw = await sharp(buffer, { failOn: "none" })
      .extract({
        left: width - cropW,
        top: height - cropH,
        width: cropW,
        height: cropH,
      })
      .removeAlpha()
      .raw()
      .toBuffer();
    return glyphRatio(raw, cropW, cropH) > 0.015;
  } catch {
    return false;
  }
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  if (isRejectedListingPhotoUrl(url)) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const response = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; TalisprosEbookImages/1.0; +https://www.talispros.com)", accept: "image/*" },
    });
    if (!response.ok) return null;
    if (isBlockedListingUrl(response.url)) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 4_000 || buffer.length > 12_000_000) return null;
    return buffer;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function dropWatermarkedListingPhotos(
  listings: SystemEbookListing[],
): Promise<SystemEbookListing[]> {
  const next: SystemEbookListing[] = [];
  for (const listing of listings) {
    const photo = listing.photoUrl?.trim() || "";
    if (!photo || isRejectedListingPhotoUrl(photo)) {
      next.push({ ...listing, photoUrl: null });
      continue;
    }
    const buffer = await fetchImageBuffer(photo);
    if (!buffer || (await bufferShowsCornerWatermark(buffer))) {
      next.push({ ...listing, photoUrl: null });
      continue;
    }
    next.push(listing);
  }
  return next;
}

export async function enrichProfileFromWebsite(
  profile: SystemEbookProfile,
): Promise<SystemEbookProfile> {
  const page = await readBrokerageSite(profile.website);
  if (!page) return { ...profile, extractedListingCount: profile.listings?.length ?? 0 };
  const logo = extractBrokerageLogo(page.html, page.finalUrl);
  const context: ListingExtractContext = {
    brokerageName: profile.brokerageName,
    officeTown: profile.town,
  };
  const pages = [page];
  for (const link of listingIndexLinks(page.html, page.finalUrl).slice(0, 4)) {
    const extra = await readBrokerageSite(link);
    if (extra) pages.push(extra);
  }
  let listings: SystemEbookListing[] = [];
  for (const source of pages) {
    listings = dedupeListings([
      ...listings,
      ...extractListingCandidates(source.html, source.finalUrl, context),
    ]);
  }
  const officeToken = profile.town.trim().toLowerCase().split(/\s+/)[0] || "";
  const crawledOfficePage =
    officeToken.length > 3 &&
    pages.some((source) => source.finalUrl.toLowerCase().includes(officeToken));
  if (crawledOfficePage) {
    const local = listings.filter((listing) => {
      const place = listing.town.toLowerCase();
      return place.includes(officeToken) || officeToken.includes(place);
    });
    if (local.length > 0) listings = local;
  }
  const extractedListingCount = listings.length;
  const photosChecked = await dropWatermarkedListingPhotos(listings.slice(0, 24));
  return {
    ...profile,
    logoUrl: profile.logoUrl?.trim() || logo?.url || null,
    foundedYear: profile.foundedYear ?? extractFoundedYear(page.html),
    phone: profile.phone?.trim() || extractPhone(page.html),
    extractedListingCount,
    listings: profile.listings?.length ? profile.listings : photosChecked,
  };
}

export async function readBrokerageSite(url: string): Promise<{ html: string; finalUrl: string } | null> {
  if (isBlockedListingUrl(url)) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const response = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; TalisprosEbookImages/1.0; +https://www.talispros.com)",
        accept: "text/html",
      },
    });
    if (!response.ok) return null;
    if (isBlockedListingUrl(response.url)) return null;
    const html = (await response.text()).slice(0, 1_500_000);
    return { html, finalUrl: response.url || url };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
