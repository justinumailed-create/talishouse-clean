/**
 * Realtor.ca (and its CDN) is never a listing-photo source for system eBooks.
 * Paid client uploads are unchanged except credit-text stripping.
 */

const BLOCKED_LISTING_ROOT = "realtor.ca";

const MIN_BROKERAGE_IMAGE_EDGE_PX = 320;

const SKIP_IMAGE_TOKEN =
  /(^|[^\w])(logo|logos|icon|icons|favicon|sprite|badge|avatar|spinner|pixel|spacer|button|social|emoji|watermark|placeholder|blank)([^\w]|$)/i;

const CONTENT_LINK =
  /listing|propert|office|about|gallery|team|our-office|for-sale|a-vendre/i;

export type ListingImageAsset = {
  url: string;
  width: number;
  height: number;
};

export type BrokerageSiteImageRef = {
  url: string;
  width: number | null;
  height: number | null;
  alt: string;
  className: string;
  priority: number;
};

export function isBlockedListingHost(hostname: string | null | undefined): boolean {
  const host = (hostname || "")
    .trim()
    .toLowerCase()
    .replace(/\.$/, "")
    .replace(/^www\./, "");
  if (!host) return false;
  return host === BLOCKED_LISTING_ROOT || host.endsWith(`.${BLOCKED_LISTING_ROOT}`);
}

export function isBlockedListingUrl(url: string | null | undefined): boolean {
  const raw = url?.trim() || "";
  if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return false;
  if (raw.startsWith("/") && !raw.startsWith("//")) return false;
  try {
    const normalized = raw.startsWith("//")
      ? `https:${raw}`
      : /^https?:/i.test(raw)
        ? raw
        : `https://${raw}`;
    return isBlockedListingHost(new URL(normalized).hostname);
  } catch {
    return false;
  }
}

function normalizeSpace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Removes "published on REALTOR.ca…" and "Source: …realtor.ca…" phrases. */
export function stripRealtorCreditText(text: string | null | undefined): string {
  if (!text) return "";
  let next = text.replace(
    /(?:listings\s+as\s+)?published\s+on\s+realtor\s*(?:®|&reg;)?\s*\.?\s*ca(?:\s*,\s*[A-Za-z]+\s+\d{4})?\.?/gi,
    "",
  );
  next = next.replace(/\bsource\s*:\s*[^\n]*realtor\s*(?:®|&reg;)?\s*\.?\s*ca[^\n]*/gi, "");
  if (next === text) return text.trim();
  next = next
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/\(\s*\)/g, "")
    .trim();
  return next;
}

export function textReferencesBlockedListingSource(
  text: string | null | undefined,
): boolean {
  return /realtor\.ca/i.test(text || "");
}

export function descriptionReferencesBlockedListingSource(
  text: string | null | undefined,
): boolean {
  const raw = text ?? "";
  if (textReferencesBlockedListingSource(raw)) return true;
  return normalizeSpace(stripRealtorCreditText(raw)) !== normalizeSpace(raw);
}

export function bytesReferenceBlockedListingSource(bytes: Uint8Array): boolean {
  const limit = Math.min(bytes.length, 2_000_000);
  if (limit < 10) return false;
  const text = new TextDecoder("latin1").decode(bytes.subarray(0, limit));
  return textReferencesBlockedListingSource(text);
}

export function withoutBlockedListingUrls(urls: string[]): string[] {
  return urls.map((url) => url.trim()).filter((url) => url && !isBlockedListingUrl(url));
}

export function withoutBlockedListingImages<T extends { url: string }>(images: T[]): T[] {
  return images.filter((image) => image.url.trim() && !isBlockedListingUrl(image.url));
}

function scrubListingText(value: string): string {
  const stripped = stripRealtorCreditText(value);
  return stripped
    .replace(/https?:\/\/(?:[\w.-]+\.)*realtor\.ca[^\s)"']*/gi, "")
    .replace(/(?:[\w.-]+\.)?realtor\.ca/gi, "")
    .replace(/cdn\.realtor/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** System ebook metadata written after this must not mention realtor.ca. */
export function sanitizeSystemEbookMetadata(
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  return sanitizeSystemEbookValue(metadata) as Record<string, unknown>;
}

export function sanitizeSystemEbookValue(value: unknown): unknown {
  if (typeof value === "string") {
    if (isBlockedListingUrl(value)) return "";
    return scrubListingText(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeSystemEbookValue(item))
      .filter((item) => item !== "" && item != null);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value)) {
      const next = sanitizeSystemEbookValue(inner);
      if (next === "") continue;
      out[key] = next;
    }
    return out;
  }
  return value;
}

export function systemEbookPayloadMentionsBlockedSource(value: unknown): boolean {
  return /realtor\.ca|cdn\.realtor/i.test(JSON.stringify(value));
}

/**
 * Choose listing images for a system eBook.
 * Brokerage-site photos win. When none are usable, keep the book's current
 * images (caller must not write a replacement). Never invent another gallery.
 */
export function resolveSystemEbookListingImages(input: {
  incoming: ListingImageAsset[];
  brokerage: ListingImageAsset[];
  existing: ListingImageAsset[];
  replaceRealtorSources: boolean;
}): {
  images: ListingImageAsset[];
  action: "incoming" | "brokerage" | "unchanged" | "none";
} {
  const incoming = withoutBlockedListingImages(input.incoming);
  const brokerage = withoutBlockedListingImages(input.brokerage);
  if (!input.replaceRealtorSources) {
    return { images: incoming, action: "incoming" };
  }
  if (brokerage.length > 0) {
    return { images: brokerage, action: "brokerage" };
  }
  if (input.existing.length > 0) {
    return { images: input.existing, action: "unchanged" };
  }
  return { images: [], action: "none" };
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

export function isSameBrokerageHost(imageUrl: string, pageUrl: string): boolean {
  const imageHost = hostnameOf(imageUrl);
  const pageHost = hostnameOf(pageUrl);
  if (!imageHost || !pageHost) return false;
  return (
    imageHost === pageHost ||
    imageHost.endsWith(`.${pageHost}`) ||
    pageHost.endsWith(`.${imageHost}`)
  );
}

export function resolveBrokerageWebsiteUrl(
  brokerUrl?: string | null,
  website?: string | null,
): string | null {
  for (const candidate of [brokerUrl, website]) {
    const value = candidate?.trim() || "";
    if (!/^https?:\/\//i.test(value)) continue;
    if (isBlockedListingUrl(value)) continue;
    return value;
  }
  return null;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function readAttr(tag: string, name: string): string {
  const match = tag.match(
    new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, "i"),
  );
  return decodeHtml(match?.[2] ?? match?.[3] ?? match?.[4] ?? "").trim();
}

function resolveAgainst(value: string, base: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return null;
  try {
    return new URL(trimmed, base).toString();
  } catch {
    return null;
  }
}

function largestSrcsetUrl(srcset: string, base: string): string | null {
  let bestUrl: string | null = null;
  let bestWidth = -1;
  for (const part of srcset.split(",")) {
    const bits = part.trim().split(/\s+/);
    const raw = bits[0];
    if (!raw) continue;
    const widthToken = bits[1]?.toLowerCase() || "";
    const width = widthToken.endsWith("w") ? Number(widthToken.slice(0, -1)) : 0;
    const url = resolveAgainst(raw, base);
    if (!url) continue;
    if (!bestUrl || width >= bestWidth) {
      bestUrl = url;
      bestWidth = width;
    }
  }
  return bestUrl;
}

function parsePixel(value: string): number | null {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isSkippableBrokerageImage(input: {
  url: string;
  alt?: string | null;
  className?: string | null;
  id?: string | null;
  width?: number | null;
  height?: number | null;
}): boolean {
  if (!input.url || isBlockedListingUrl(input.url)) return true;
  let path = input.url;
  try {
    path = new URL(input.url).pathname;
  } catch {
    return true;
  }
  if (/\.(?:svg|gif|ico)(?:$|\?)/i.test(path)) return true;
  const label = [path, input.alt, input.className, input.id].filter(Boolean).join(" ");
  if (SKIP_IMAGE_TOKEN.test(label)) return true;
  const width = input.width ?? 0;
  const height = input.height ?? 0;
  if (
    (width > 0 && width < MIN_BROKERAGE_IMAGE_EDGE_PX) ||
    (height > 0 && height < MIN_BROKERAGE_IMAGE_EDGE_PX)
  ) {
    return true;
  }
  return false;
}

function pushRef(
  refs: BrokerageSiteImageRef[],
  seen: Set<string>,
  ref: BrokerageSiteImageRef | null,
) {
  if (!ref) return;
  if (seen.has(ref.url)) return;
  if (
    isSkippableBrokerageImage({
      url: ref.url,
      alt: ref.alt,
      className: ref.className,
      width: ref.width,
      height: ref.height,
    })
  ) {
    return;
  }
  seen.add(ref.url);
  refs.push(ref);
}

export function extractBrokerageSiteImageRefs(
  html: string,
  pageUrl: string,
): BrokerageSiteImageRef[] {
  const refs: BrokerageSiteImageRef[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const prop = (readAttr(tag, "property") || readAttr(tag, "name")).toLowerCase();
    if (
      prop !== "og:image" &&
      prop !== "og:image:url" &&
      prop !== "twitter:image" &&
      prop !== "twitter:image:src"
    ) {
      continue;
    }
    const url = resolveAgainst(readAttr(tag, "content"), pageUrl);
    if (!url) continue;
    pushRef(refs, seen, {
      url,
      width: null,
      height: null,
      alt: prop,
      className: "",
      priority: prop.startsWith("og:") ? 0 : 1,
    });
  }

  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\bimage_src\b/i.test(readAttr(tag, "rel"))) continue;
    const url = resolveAgainst(readAttr(tag, "href"), pageUrl);
    if (!url) continue;
    pushRef(refs, seen, {
      url,
      width: null,
      height: null,
      alt: "image_src",
      className: "",
      priority: 1,
    });
  }

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    const alt = readAttr(tag, "alt");
    const className = readAttr(tag, "class");
    const id = readAttr(tag, "id");
    const width = parsePixel(readAttr(tag, "width"));
    const height = parsePixel(readAttr(tag, "height"));
    const srcset = readAttr(tag, "srcset") || readAttr(tag, "data-srcset");
    const rawSrc =
      largestSrcsetUrl(srcset, pageUrl) ||
      resolveAgainst(readAttr(tag, "src") || readAttr(tag, "data-src") || readAttr(tag, "data-lazy-src"), pageUrl);
    if (!rawSrc || !isSameBrokerageHost(rawSrc, pageUrl)) continue;
    const label = `${rawSrc} ${alt} ${className} ${id}`;
    const priority = /hero|banner/i.test(label)
      ? 2
      : /listing|property|office|photo|gallery/i.test(label)
        ? 3
        : 4;
    pushRef(refs, seen, {
      url: rawSrc,
      width,
      height,
      alt,
      className,
      priority,
    });
  }

  return refs.sort((a, b) => a.priority - b.priority);
}

export function extractSameSiteContentLinks(html: string, pageUrl: string): string[] {
  const links: string[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(
    /href\s*=\s*("([^"]+)"|'([^']+)'|([^\s"'=<>]+))/gi,
  )) {
    const href = decodeHtml(match[2] || match[3] || match[4] || "");
    if (!CONTENT_LINK.test(href)) continue;
    const absolute = resolveAgainst(href, pageUrl);
    if (!absolute || isBlockedListingUrl(absolute) || !isSameBrokerageHost(absolute, pageUrl)) {
      continue;
    }
    if (seen.has(absolute)) continue;
    seen.add(absolute);
    links.push(absolute);
    if (links.length >= 3) break;
  }
  return links;
}

export const BROKERAGE_SITE_IMAGE_MIN_EDGE_PX = MIN_BROKERAGE_IMAGE_EDGE_PX;

export const NO_BROKERAGE_LISTING_IMAGES_MESSAGE =
  "No listing photos were found on the brokerage website.";
