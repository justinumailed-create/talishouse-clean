/**
 * Facts, logos, and listing cards from a brokerage's own website.
 * Own-site photos are preferred. An MLS CDN photo is kept only when the
 * image itself has no REALTOR® / MLS® mark. Glasshouse art stays out.
 */

import { execFile } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import {
  isBlockedListingUrl,
  isSameBrokerageHost,
  isSkippableBrokerageImage,
} from "@/lib/talisbooks/blocked-listing-sources";
import {
  distanceKm,
  formatCanadianPhone,
  isWithinOfficeRadius,
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

/** Stock banners and empty marks are not a brokerage logo. */
export function isPlaceholderBrandImage(url: string | null | undefined): boolean {
  return /placeholder|custom-banner|banner-placeholder|spacer|blank|no-image|via\.placeholder|trans-256/i.test(
    url || "",
  );
}

/**
 * MLS / board CDNs. A file from one of these is allowed only after the
 * pixels themselves show no REALTOR® or MLS® mark.
 */
export function isMlsCdnPhoto(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/\.$/, "");
    return (
      host.endsWith("myrealpage.com") ||
      host.endsWith("nine10.ca") ||
      host.endsWith("realtyninja.com") ||
      host === "realtor.ca" ||
      host.endsWith(".realtor.ca")
    );
  } catch {
    return false;
  }
}

export function listingPhotoHost(url: string): "own-site" | "mls" {
  return isMlsCdnPhoto(url) ? "mls" : "own-site";
}

function photoFromCard(slice: string, pageUrl: string, which: "first" | "last" = "first"): string | null {
  const found: string[] = [];
  const raws: string[] = [];
  for (const match of slice.matchAll(/(?:data-full-src|data-src|src)\s*=\s*["']([^"']+)["']/gi)) {
    raws.push(match[1] || "");
  }
  for (const match of slice.matchAll(/background(?:-image)?\s*:\s*url\(([^)]+)\)/gi)) {
    raws.push((match[1] || "").replace(/['"]/g, ""));
  }
  for (const raw of raws) {
    const url = resolveAgainst(raw, pageUrl);
    if (!url || url.startsWith("data:") || isPlaceholderBrandImage(url)) continue;
    if (isRejectedListingPhotoUrl(url) && !isMlsCdnPhoto(url)) continue;
    if (isBlockedListingUrl(url) && !isMlsCdnPhoto(url)) continue;
    if (/logo|icon|favicon|sprite|badge/i.test(url)) continue;
    found.push(url);
  }
  if (found.length === 0) return null;
  const own = found.filter((url) => listingPhotoHost(url) === "own-site");
  const pool = own.length > 0 ? own : found;
  return which === "last" ? pool[pool.length - 1]! : pool[0]!;
}

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
    if (!src || isRejectedSystemEbookImageUrl(src) || isPlaceholderBrandImage(src)) continue;
    if (/mls|realtor|watermark|social|facebook|instagram/i.test(label)) continue;
    if (/logo|brand/i.test(label) || /class=['"][^'"]*logo/i.test(header.slice(Math.max(0, header.indexOf(tag) - 120), header.indexOf(tag)))) {
      return { url: src, source: "header" };
    }
  }
  if (headerImgs.length > 0) {
    const tag = headerImgs[0]!;
    const src = resolveAgainst(readAttr(tag, "src") || readAttr(tag, "data-src"), pageUrl);
    if (src && !isRejectedSystemEbookImageUrl(src) && !isPlaceholderBrandImage(src) && !/mls|realtor|facebook|instagram/i.test(src)) {
      return { url: src, source: "header" };
    }
  }

  for (const tag of html.matchAll(/<img\b[^>]*>/gi)) {
    const src = resolveAgainst(readAttr(tag[0]!, "src") || readAttr(tag[0]!, "data-src"), pageUrl);
    const label = `${src ?? ""} ${readAttr(tag[0]!, "alt")} ${readAttr(tag[0]!, "class")}`;
    if (!src || isRejectedSystemEbookImageUrl(src) || isPlaceholderBrandImage(src)) continue;
    if (!/logo|brand/i.test(label)) continue;
    if (/mls|realtor|watermark|facebook|instagram|favicon/i.test(label)) continue;
    return { url: src, source: "header" };
  }

  const og = html.match(
    /<meta\b[^>]*(?:property|name)=["']og:image["'][^>]*>/i,
  );
  if (og) {
    const content = resolveAgainst(readAttr(og[0], "content"), pageUrl);
    if (content && !isRejectedSystemEbookImageUrl(content) && !isPlaceholderBrandImage(content) && !/mls|realtor/i.test(content)) {
      return { url: content, source: "og" };
    }
  }

  const icon = html.match(
    /<link\b[^>]*rel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["'][^>]*>/i,
  );
  if (icon) {
    const href = resolveAgainst(readAttr(icon[0], "href"), pageUrl);
    if (href && !isRejectedSystemEbookImageUrl(href) && !isPlaceholderBrandImage(href)) {
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
  const hyphen = cleaned.match(/^(\d{1,6})-(\d{1,4})\s+(.+)$/);
  if (hyphen && new RegExp(`\\b(?:${STREET_TYPE})\\b`, "i").test(hyphen[3]!)) {
    return `${hyphen[1]} ${hyphen[3]}, Unit ${hyphen[2]}`;
  }
  const unit = cleaned.match(/^(\d{1,4})\s+(\d{2,6})\s+(.+)$/);
  if (unit && new RegExp(`\\b(?:${STREET_TYPE})\\b`, "i").test(unit[3]!)) {
    return `${unit[2]} ${unit[3]}, Unit ${unit[1]}`;
  }
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
  pageUrl: string,
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
    const office = around.match(/contact-office">([^<]+)/i)?.[1] || "";
    if (office && !brokerageLineAllows(office, context)) continue;
    found.push({
      street,
      town,
      priceCad: priceFrom(visibleText(around)),
      facts,
      photoUrl: photoFromCard(around, pageUrl),
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
      photoUrl: photoFromCard(priceScope, pageUrl),
    });
  }
  for (const match of html.matchAll(/class="listing-(?:card__)?address">\s*([^<]+?)\s*</gi)) {
    const place = parsePlaceLabel(match[1] || "");
    if (!place) continue;
    const around = html.slice(Math.max(0, (match.index ?? 0) - 2500), (match.index ?? 0) + 400);
    const credit = around.match(/(?:courtesy of|listed by|contact-office">)\s*([^<]{0,80})/i)?.[1] || "";
    if (credit && !brokerageLineAllows(credit, context)) continue;
    found.push({
      street: place.street,
      town: place.town,
      priceCad: priceFrom(around),
      facts: factsFrom(visibleText(around)),
      photoUrl: photoFromCard(around, pageUrl, "last"),
    });
  }
  for (const match of html.matchAll(
    /<span class="rcr-slider__title">\s*([^<]+?)\s*<\/span>((?:(?!<span class="rcr-slider__title")[\s\S]){0,500})/gi,
  )) {
    const place = parsePlaceLabel(match[1] || "");
    if (!place) continue;
    const tail = visibleText(match[2] || "");
    const beforeTitle = html.slice(Math.max(0, (match.index ?? 0) - 1200), (match.index ?? 0) + (match[2] || "").length);
    found.push({
      street: place.street,
      town: place.town,
      priceCad: priceFrom(tail),
      facts: factsFrom(tail),
      photoUrl: photoFromCard(beforeTitle, pageUrl),
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
  const structured = dedupeListings(extractStructuredListings(html, pageUrl, context));
  if (structured.length > 0) {
    for (const listing of structured) {
      if (listing.photoUrl) continue;
      const needle = listing.street.toLowerCase().slice(0, 22);
      for (const tag of html.matchAll(/<img\b[^>]*>/gi)) {
        const blob = decodeHtml(tag[0]!).toLowerCase();
        if (!blob.includes(needle)) continue;
        const photo = photoFromCard(tag[0]!, pageUrl);
        if (photo) {
          listing.photoUrl = photo;
          break;
        }
      }
    }
    return structured;
  }

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

/**
 * The board mark is the REALTOR® R-in-a-square, light or dark, usually in a
 * corner (sometimes inset under a white letterbox). Matching that silhouette
 * against pixels that are lighter or darker than a local blur separates it
 * from roofs, snow, and sky. A score in the gap between known clean photos
 * and known marked photos is treated as marked.
 */
const MARK_TEMPLATE_PATH = join(process.cwd(), "lib/talisbooks/realtor-mark-template.png");
const MARK_PRESENT_SCORE = 0.4;
const MARK_UNSURE_SCORE = 0.36;

type MarkTemplate = {
  dev: Float32Array;
  varT: number;
  width: number;
  height: number;
};

let markTemplates: MarkTemplate[] | null = null;

async function realtorMarkTemplates(): Promise<MarkTemplate[]> {
  if (markTemplates) return markTemplates;
  const file = readFileSync(MARK_TEMPLATE_PATH);
  const built: MarkTemplate[] = [];
  for (const width of [48, 66]) {
    const { data, info } = await sharp(file).resize({ width }).greyscale().raw().toBuffer({ resolveWithObject: true });
    const pixels = new Float32Array(data.length);
    for (let index = 0; index < data.length; index += 1) pixels[index] = 255 - data[index]!;
    let sum = 0;
    for (let index = 0; index < pixels.length; index += 1) sum += pixels[index]!;
    const mean = sum / pixels.length;
    const dev = new Float32Array(pixels.length);
    let varT = 0;
    for (let index = 0; index < pixels.length; index += 1) {
      dev[index] = pixels[index]! - mean;
      varT += dev[index]! * dev[index]!;
    }
    built.push({ dev, varT, width: info.width, height: info.height });
  }
  markTemplates = built;
  return built;
}

function overlayMasks(data: Buffer, width: number, height: number): { light: Buffer; dark: Buffer } {
  const lum = new Float32Array(width * height);
  for (let index = 0; index < lum.length; index += 1) {
    lum[index] = (data[index * 3]! + data[index * 3 + 1]! + data[index * 3 + 2]!) / 3;
  }
  const radius = 6;
  const span = radius * 2 + 1;
  const horizontal = new Float32Array(width * height);
  const blur = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      for (let offset = -radius; offset <= radius; offset += 1) {
        sum += lum[y * width + Math.min(width - 1, Math.max(0, x + offset))]!;
      }
      horizontal[y * width + x] = sum / span;
    }
  }
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      let sum = 0;
      for (let offset = -radius; offset <= radius; offset += 1) {
        sum += horizontal[Math.min(height - 1, Math.max(0, y + offset)) * width + x]!;
      }
      blur[y * width + x] = sum / span;
    }
  }
  const light = Buffer.alloc(width * height);
  const dark = Buffer.alloc(width * height);
  for (let index = 0; index < lum.length; index += 1) {
    const lift = lum[index]! - blur[index]!;
    if (lift > 14 && lum[index]! > 120) light[index] = 255;
    if (lift < -14) dark[index] = 255;
  }
  return { light, dark };
}

function templateScoreAt(
  mask: Buffer,
  imageWidth: number,
  imageHeight: number,
  template: MarkTemplate,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): number {
  const { dev, varT, width: templateWidth, height: templateHeight } = template;
  if (varT < 1) return 0;
  let best = 0;
  const step = 2;
  const yEnd = Math.min(y1, imageHeight - templateHeight);
  const xEnd = Math.min(x1, imageWidth - templateWidth);
  for (let y = y0; y <= yEnd; y += step) {
    for (let x = x0; x <= xEnd; x += step) {
      let sum = 0;
      for (let ty = 0; ty < templateHeight; ty += 1) {
        const row = (y + ty) * imageWidth + x;
        for (let tx = 0; tx < templateWidth; tx += 1) sum += mask[row + tx]!;
      }
      const mean = sum / (templateWidth * templateHeight);
      let corr = 0;
      let varI = 0;
      for (let ty = 0; ty < templateHeight; ty += 1) {
        const row = (y + ty) * imageWidth + x;
        const templateRow = ty * templateWidth;
        for (let tx = 0; tx < templateWidth; tx += 1) {
          const delta = mask[row + tx]! - mean;
          varI += delta * delta;
          corr += delta * dev[templateRow + tx]!;
        }
      }
      const score = corr / Math.sqrt(varI * varT + 1e-3);
      if (score > best) best = score;
    }
  }
  return best;
}

async function realtorMarkScore(buffer: Buffer): Promise<number> {
  const { data, info } = await sharp(buffer, { failOn: "none" })
    .resize({ width: 520 })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { light, dark } = overlayMasks(data, info.width, info.height);
  const templates = await realtorMarkTemplates();
  // The mark sits in the outer corner, sometimes below a white letterbox.
  // A window or cabinet further inside the frame is not that mark.
  const corners: Array<[number, number, number, number]> = [
    [0, 0, 0.22, 0.32],
    [0.78, 0, 1, 0.32],
    [0, 0.72, 0.22, 1],
    [0.78, 0.72, 1, 1],
  ];
  let best = 0;
  for (const mask of [light, dark]) {
    for (const template of templates) {
      for (const [a, b, c, d] of corners) {
        const score = templateScoreAt(
          mask,
          info.width,
          info.height,
          template,
          Math.floor(a * info.width),
          Math.floor(b * info.height),
          Math.floor(c * info.width),
          Math.floor(d * info.height),
        );
        if (score > best) best = score;
        if (best >= 0.55) return best;
      }
    }
  }
  return best;
}

let tesseractReady: boolean | null = null;

function boardMarkInOcr(text: string): boolean {
  const upper = text.toUpperCase();
  const compact = upper.replace(/[^A-Z]/g, "");
  if (/REALTOR|EALTOR|REALTO|SASK/.test(compact)) return true;
  if (/\bMLS\b/.test(upper)) return true;
  if (/REAL\s+ESTATE\s+BOARD/.test(upper)) return true;
  return false;
}

/**
 * White corner type such as SASK•MLS® is too small for the R-square template.
 * Keeping only pixels brighter than the photo, then reading that strip, catches it.
 * A failed read counts as marked.
 */
async function cornerTextHasBoardMark(buffer: Buffer): Promise<boolean> {
  if (tesseractReady === null) {
    tesseractReady = await new Promise<boolean>((resolve) => {
      execFile("tesseract", ["--version"], (error) => resolve(!error));
    });
  }
  if (!tesseractReady) return false;
  const meta = await sharp(buffer, { failOn: "none" }).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < 120 || height < 120) return true;
  const crops: Array<[number, number, number, number]> = [
    [0, 0, 0.3, 0.18],
    [0.7, 0, 0.3, 0.18],
    [0, 0.82, 0.3, 0.18],
    [0.7, 0.82, 0.3, 0.18],
  ];
  const file = join(tmpdir(), `talis-mark-${process.pid}.png`);
  try {
    for (const [fx, fy, fw, fh] of crops) {
      const left = Math.floor(width * fx);
      const top = Math.floor(height * fy);
      const cropWidth = Math.max(24, Math.min(Math.floor(width * fw), width - left));
      const cropHeight = Math.max(16, Math.min(Math.floor(height * fh), height - top));
      const { data, info } = await sharp(buffer, { failOn: "none" })
        .extract({ left, top, width: cropWidth, height: cropHeight })
        .resize({ width: 900 })
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const ink = Buffer.alloc(data.length, 255);
      for (let index = 0; index < data.length; index += 1) {
        if (data[index]! >= 220) ink[index] = 0;
      }
      const png = await sharp(ink, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer();
      writeFileSync(file, png);
      const text = await new Promise<string>((resolve) => {
        execFile("tesseract", [file, "stdout", "--psm", "6"], { encoding: "utf8" }, (error, stdout) => {
          resolve(error ? "" : String(stdout || ""));
        });
      });
      if (boardMarkInOcr(text)) return true;
    }
    return false;
  } catch {
    return true;
  } finally {
    rmSync(file, { force: true });
  }
}

async function canReadCornerText(): Promise<boolean> {
  if (tesseractReady === null) {
    tesseractReady = await new Promise<boolean>((resolve) => {
      execFile("tesseract", ["--version"], (error) => resolve(!error));
    });
  }
  return tesseractReady;
}

/** MLS files need the corner read. Without it a text mark such as SASK•MLS® would slip through. */
async function photoBufferIsClean(url: string, buffer: Buffer): Promise<boolean> {
  if (await bufferShowsCornerWatermark(buffer)) return false;
  if (isMlsCdnPhoto(url) && !(await canReadCornerText())) return false;
  return true;
}

export async function bufferShowsCornerWatermark(buffer: Buffer): Promise<boolean> {
  try {
    const meta = await sharp(buffer, { failOn: "none" }).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (width < 120 || height < 120) return true;
    const score = await realtorMarkScore(buffer);
    if (score >= MARK_PRESENT_SCORE) return true;
    if (score > MARK_UNSURE_SCORE) return true;
    return cornerTextHasBoardMark(buffer);
  } catch {
    return true;
  }
}

function extraMlsFrames(url: string): string[] {
  if (!isMlsCdnPhoto(url)) return [];
  const match = url.match(/^(.*)_1(\.[a-z0-9]+)(\?.*)?$/i);
  if (!match) return [];
  return [2, 3, 4].map((frame) => `${match[1]}_${frame}${match[2]}${match[3] || ""}`);
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  if (isRejectedListingPhotoUrl(url) && !isMlsCdnPhoto(url)) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const response = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; TalisprosEbookImages/1.0; +https://www.talispros.com)", accept: "image/*" },
    });
    if (!response.ok) return null;
    if (isBlockedListingUrl(response.url) && !isMlsCdnPhoto(response.url)) return null;
    const type = response.headers.get("content-type") || "";
    if (type && !type.startsWith("image/") && !type.startsWith("application/octet-stream")) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const image =
      (buffer[0] === 0xff && buffer[1] === 0xd8) ||
      (buffer[0] === 0x89 && buffer[1] === 0x50) ||
      buffer.subarray(0, 4).toString() === "RIFF" ||
      (buffer[0] === 0x47 && buffer[1] === 0x49);
    if (!image || buffer.length < 4_000 || buffer.length > 12_000_000) return null;
    return buffer;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Apply-only. Copies each accepted photo into talisbooks-assets so the book
 * does not hotlink a CDN. A file that fails a second watermark check is dropped.
 */
export async function copyAcceptedListingPhotos(
  fastCode: string,
  listings: SystemEbookListing[],
): Promise<SystemEbookListing[]> {
  const { getSupabaseAdmin } = await import("@/lib/supabaseAdmin");
  const { TALISBOOKS_IMAGE_STORAGE_BUCKET } = await import(
    "@/lib/talisbooks/image-engine/constants"
  );
  const supabase = getSupabaseAdmin();
  const code = fastCode.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "") || "code";
  const stored: SystemEbookListing[] = [];
  let index = 1;
  for (const listing of listings) {
    const photo = listing.photoUrl?.trim() || "";
    if (!photo) continue;
    const buffer = await fetchImageBuffer(photo);
    if (!buffer || !(await photoBufferIsClean(photo, buffer))) continue;
    const jpeg = await sharp(buffer, { failOn: "none" }).jpeg({ quality: 85 }).toBuffer();
    const path = `brokerage-site/${code}/listing-${index}.jpg`;
    const { error } = await supabase.storage.from(TALISBOOKS_IMAGE_STORAGE_BUCKET).upload(path, jpeg, {
      contentType: "image/jpeg",
      upsert: true,
      cacheControl: "31536000",
    });
    if (error) {
      console.error(`[system-ebook] ${code}: could not store listing ${index}`);
      continue;
    }
    const url = supabase.storage.from(TALISBOOKS_IMAGE_STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
    if (!url) continue;
    stored.push({ ...listing, photoUrl: url });
    index += 1;
  }
  return stored;
}

export async function dropWatermarkedListingPhotos(
  listings: SystemEbookListing[],
): Promise<{ kept: SystemEbookListing[]; rejectedWatermarkCount: number }> {
  const kept: SystemEbookListing[] = [];
  let rejectedWatermarkCount = 0;
  for (const listing of listings) {
    const photo = listing.photoUrl?.trim() || "";
    if (!photo || isPlaceholderBrandImage(photo) || (isRejectedListingPhotoUrl(photo) && !isMlsCdnPhoto(photo))) {
      continue;
    }
    let cleanUrl: string | null = null;
    let failedCheck = false;
    for (const candidate of [photo, ...extraMlsFrames(photo)]) {
      const buffer = await fetchImageBuffer(candidate);
      if (!buffer || !(await photoBufferIsClean(candidate, buffer))) {
        failedCheck = true;
        continue;
      }
      cleanUrl = candidate;
      break;
    }
    if (!cleanUrl) {
      if (failedCheck) rejectedWatermarkCount += 1;
      continue;
    }
    kept.push({ ...listing, photoUrl: cleanUrl, photoHost: listingPhotoHost(cleanUrl) });
  }
  return { kept, rejectedWatermarkCount };
}

const townGeoCache = new Map<string, [number, number] | null>();

async function townWithinOffice(
  town: string,
  province: string,
  officeLatitude: number,
  officeLongitude: number,
): Promise<boolean> {
  const place = town.trim();
  if (!place || /^(listing|sale|residential|commercial|home|property|mls|the|for)$/i.test(place)) {
    return true;
  }
  const key = `${place}|${province}`.toLowerCase();
  if (!townGeoCache.has(key)) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const query = `${place}, ${province}, Canada`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
        {
          signal: ctrl.signal,
          headers: { "user-agent": "TalisprosEbookImages/1.0 (listing radius; +https://www.talispros.com)", accept: "application/json" },
        },
      );
      const rows = response.ok ? ((await response.json()) as Array<{ lat?: string; lon?: string }>) : [];
      const lat = Number(rows[0]?.lat);
      const lon = Number(rows[0]?.lon);
      townGeoCache.set(key, Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null);
    } catch {
      townGeoCache.set(key, null);
    } finally {
      clearTimeout(timer);
    }
  }
  const coords = townGeoCache.get(key);
  if (!coords) return true;
  return distanceKm(officeLatitude, officeLongitude, coords[0], coords[1]) <= 80;
}

function crawlUrl(website: string): string {
  try {
    const host = new URL(website).hostname.replace(/^www\./, "");
    if (host === "grassrootsrealtygroup.ca") return "https://grassrootsrealtygroup.ca/";
  } catch {
    return website;
  }
  return website;
}

export async function enrichProfileFromWebsite(
  profile: SystemEbookProfile,
): Promise<SystemEbookProfile> {
  const page = await readBrokerageSite(crawlUrl(profile.website));
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
    officeToken.length > 3 && crawlUrl(profile.website).toLowerCase().includes(officeToken);
  if (crawledOfficePage) {
    const local = listings.filter((listing) => {
      const place = listing.town.toLowerCase();
      return place.includes(officeToken) || officeToken.includes(place);
    });
    if (local.length > 0) listings = local;
  }
  const nearOffice: SystemEbookListing[] = [];
  for (const listing of listings) {
    const place = `${listing.street} ${listing.town}`;
    if (!isWithinOfficeRadius(place, profile.latitude, profile.longitude)) continue;
    if (
      profile.latitude != null &&
      profile.longitude != null &&
      !(await townWithinOffice(listing.town, profile.province, profile.latitude, profile.longitude))
    ) {
      continue;
    }
    nearOffice.push(listing);
  }
  const extractedListingCount = nearOffice.length;
  const judged = await dropWatermarkedListingPhotos(nearOffice.slice(0, 24));
  const phone = formatCanadianPhone(profile.phone?.trim() || extractPhone(page.html) || "");
  const chosen = profile.listings?.length ? profile.listings : judged.kept;
  return {
    ...profile,
    logoUrl: profile.logoUrl?.trim() || logo?.url || null,
    foundedYear: profile.foundedYear ?? extractFoundedYear(page.html),
    phone: phone || null,
    extractedListingCount,
    rejectedWatermarkCount: judged.rejectedWatermarkCount,
    ownSitePhotoCount: chosen.filter((listing) => listing.photoHost !== "mls" && listing.photoUrl).length,
    mlsPhotoCount: chosen.filter((listing) => listing.photoHost === "mls").length,
    listings: chosen,
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
