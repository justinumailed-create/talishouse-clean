/**
 * Facts, logos, and listing cards from a brokerage's own website.
 * Realtor.ca hosts, board watermarks, and Glasshouse art are dropped.
 */

import sharp from "sharp";
import {
  extractSameSiteContentLinks,
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
    .trim();
  if (!town || town.length < 2 || town.length > 40) return null;
  if (/^(?:for|sale|bed|bath|sq)$/i.test(town)) return null;
  return town;
}

export function extractListingCandidates(html: string, pageUrl: string): SystemEbookListing[] {
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
    const beds = window.match(/\b(\d+)\s+bed(?:room)?s?\b/i);
    const baths = window.match(/\b(\d+)\s+bath(?:room)?s?\b/i);
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
  if (!page) return profile;
  const logo = extractBrokerageLogo(page.html, page.finalUrl);
  let listings = extractListingCandidates(page.html, page.finalUrl);
  if (listings.length === 0) {
    for (const link of extractSameSiteContentLinks(page.html, page.finalUrl).slice(0, 2)) {
      const extra = await readBrokerageSite(link);
      if (!extra) continue;
      listings = extractListingCandidates(
        `${page.html}\n${extra.html}`,
        extra.finalUrl,
      );
      if (listings.length > 0) break;
    }
  }
  const photosChecked = await dropWatermarkedListingPhotos(listings);
  return {
    ...profile,
    logoUrl: profile.logoUrl?.trim() || logo?.url || null,
    foundedYear: profile.foundedYear ?? extractFoundedYear(page.html),
    phone: profile.phone?.trim() || extractPhone(page.html),
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
