import { RM22_ASSETS, RM22_DESIGN_COMPS, RM22_PRODUCTS } from "@/lib/talisbooks/rm22-template";
import {
  pickPartingShotImageUrl,
  type PartingShotPage,
} from "@/lib/talisbooks/parting-shot";
import { mapsiteShareOgPath } from "@/lib/share/og-card";
import {
  BOOKSHELF_OG_HEIGHT,
  BOOKSHELF_OG_WIDTH,
  bookshelfShareOgPath,
} from "@/lib/share/bookshelf-og-card";
import { TALISBOOKS_PRODUCT_NAME } from "@/lib/talisbooks/constants";
import { isStockDemoListingPath } from "@/lib/talispros/mapsite-listing-media";
import type { CreateMetadataImage } from "@/lib/seo";

/** Last-resort small mark — never the tall marketing poster used as og:image. */
export const MAPSITE_OG_BRAND_MARK = "/logo-mark.png";

const PUBLIC_OG_ORIGIN = "https://www.talispros.com";

const TEMPLATE_ASSET_PATHS = new Set<string>(
  [
    RM22_ASSETS.agent,
    RM22_DESIGN_COMPS.front,
    RM22_DESIGN_COMPS.intro,
    RM22_DESIGN_COMPS.caption,
    RM22_DESIGN_COMPS.intrinsic,
    RM22_DESIGN_COMPS.outro,
    ...RM22_PRODUCTS.map((product) => product.href),
  ].filter(Boolean),
);

export function publicOgOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    PUBLIC_OG_ORIGIN
  );
}

export function toAbsoluteHttpsOgUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return `${publicOgOrigin()}${MAPSITE_OG_BRAND_MARK}`;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  if (/^http:\/\//i.test(trimmed)) {
    return `https://${trimmed.slice("http://".length)}`;
  }
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${publicOgOrigin()}${path}`;
}

/** Tall Talispros™ poster / header logos — these become the "huge logo" WhatsApp card. */
export function isLargeBrandLogoUrl(url: string): boolean {
  const value = url.trim().toLowerCase();
  if (!value) return false;
  if (value.endsWith("/logo.png") || value.includes("/logo.png?")) return true;
  if (value.includes("/seo/talispros-og")) return true;
  if (value.includes("/api/og/talispros")) return true;
  if (value.includes("talispros-og.jpg")) return true;
  if (value.includes("header-fallback-logo")) return true;
  return false;
}

export function isTemplatePlaceholderOgUrl(url: string): boolean {
  const value = url.trim();
  if (!value) return false;
  if (TEMPLATE_ASSET_PATHS.has(value)) return true;
  const path = value.startsWith("http")
    ? (() => {
        try {
          return new URL(value).pathname;
        } catch {
          return value;
        }
      })()
    : value;
  return (
    path.includes("/talisbooks/templates/rm22/") ||
    path.includes("/talisbooks/templates/jarlberg/")
  );
}

export function isUsableMapSiteOgImage(url: string | null | undefined): boolean {
  const value = url?.trim() || "";
  if (!value) return false;
  if (isLargeBrandLogoUrl(value)) return false;
  if (isTemplatePlaceholderOgUrl(value)) return false;
  if (isStockDemoListingPath(value)) return false;
  return true;
}

function firstUsable(urls: Array<string | null | undefined>): string | null {
  for (const url of urls) {
    const value = url?.trim() || "";
    if (isUsableMapSiteOgImage(value)) return value;
  }
  return null;
}

/**
 * Scenic layer behind a Mapsite™ share card when satellite imagery is unavailable.
 * Parting shot first, then a listing photo. Front covers and brand posters are skipped.
 */
export function selectMapsiteScenicBackgroundUrl(input: {
  pages?: PartingShotPage[];
  fallbackImageUrls?: Array<string | null | undefined>;
}): string | null {
  const parting = pickPartingShotImageUrl(input.pages ?? []);
  if (isUsableMapSiteOgImage(parting)) return parting!;
  return firstUsable(input.fallbackImageUrls ?? []);
}

/** Talisbooks™ viewer cards use the parting shot only — not the front cover. */
export function selectViewerPartingShotUrl(
  pages: PartingShotPage[],
): string | null {
  const parting = pickPartingShotImageUrl(pages);
  if (isUsableMapSiteOgImage(parting)) return parting;
  return null;
}

export function mapsiteOgMetadataImage(
  url: string,
  alt: string,
): CreateMetadataImage {
  return {
    url: toAbsoluteHttpsOgUrl(url),
    width: 1200,
    height: 630,
    alt,
  };
}

/** Title and description WhatsApp / Open Graph use when SEO fields are empty. */
export function mapsiteRealtimeSeoCopy(input: {
  fastCode: string;
  propertyTitle?: string | null;
  propertyDescription?: string | null;
  propertyAddress?: string | null;
}): { title: string; description: string } {
  const code = input.fastCode.trim().toUpperCase();
  const property = input.propertyTitle?.trim() || "";
  const description = input.propertyDescription?.trim() || "";
  const address = input.propertyAddress?.trim() || "";
  const title = property
    ? `${property} | Mapsite™`
    : `${code || "Mapsite™"} | Mapsite™`;
  let desc = description;
  if (!desc && address && code) {
    desc = `${address} · FAST Code ${code}`;
  } else if (!desc && address) {
    desc = address;
  } else if (!desc && code) {
    desc = `Mapsite™ for FAST Code ${code}.`;
  } else if (!desc) {
    desc = "Mapsite™";
  }
  return { title, description: desc };
}

/**
 * ALLPINS listing share copy — mirrors the ALLPINS Mapsite™ property fields
 * (Canada multi-pin showcase), not synthetic marketing fluff.
 */
export function allpinsSeoCopy(): { title: string; description: string } {
  return {
    title: "ALLPINS — Every Mapsite™ | Mapsite™",
    description:
      "Canada showcase of Mapsite™ pins. Open a pin for the book and Mapsite™ demo.",
  };
}

/** Talisbooks™ viewer title / description from real book fields. */
export function viewerRealtimeSeoCopy(input: {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  address?: string | null;
  fastCode?: string | null;
}): { title: string; description: string } {
  const title = input.title.trim() || "Talisbooks™";
  const subtitle = input.subtitle?.trim() || "";
  const description = input.description?.trim() || "";
  const address = input.address?.trim() || "";
  const code = input.fastCode?.trim().toUpperCase() || "";

  let desc = description || subtitle;
  if (!desc && address && code) {
    desc = `${address} · Talisbook™ for FAST Code ${code}`;
  } else if (!desc && address) {
    desc = address;
  } else if (!desc && code) {
    desc = `Talisbook™ digital lookbook for FAST Code ${code}.`;
  } else if (!desc) {
    desc = "Read this Talisbook™ digital lookbook in the Talisbooks™ viewer.";
  }
  return { title, description: desc };
}


/** Portrait bookshelf share-card metadata (not landscape Mapsite™ / viewer). */
export function bookshelfOgMetadataImage(alt: string): CreateMetadataImage {
  return {
    url: toAbsoluteHttpsOgUrl(bookshelfShareOgPath()),
    width: BOOKSHELF_OG_WIDTH,
    height: BOOKSHELF_OG_HEIGHT,
    alt,
  };
}

/** Absolute URL of the composed portrait bookshelf share card. */
export function resolveBookshelfOgImage(): string {
  return toAbsoluteHttpsOgUrl(bookshelfShareOgPath());
}

/**
 * SEO copy for Mapsite™-connected Talisbooks™ shelves (FAST TEB™ + isolated
 * ALLPINS catalogue shelf). Distinct from ALLPINS Mapsite™ multi-pin listing copy.
 */
export function bookshelfSeoCopy(input: {
  fastCode?: string | null;
  place?: string | null;
  isolatedAllPins?: boolean;
}): { title: string; description: string } {
  if (input.isolatedAllPins) {
    return {
      title: `ALLPINS ${TALISBOOKS_PRODUCT_NAME} · Bookshelf`,
      description:
        "Mapsite™-connected Talisbooks™ bookshelf for FAST Code ALLPINS. Open a cover to read books on the isolated shelf.",
    };
  }
  const code = (input.fastCode || "").trim().toUpperCase();
  const place = input.place?.trim() || "";
  if (place) {
    return {
      title: `${TALISBOOKS_PRODUCT_NAME} · ${place}`,
      description: `Talisbooks™ bookshelf for ${place} (FAST Code ${code}). Open a cover to read books connected to this Mapsite™ only.`,
    };
  }
  if (code) {
    return {
      title: `${TALISBOOKS_PRODUCT_NAME} · ${code}`,
      description: `Talisbooks™ bookshelf for FAST Code ${code}. Open a cover to read books connected to this Mapsite™ only.`,
    };
  }
  return {
    title: TALISBOOKS_PRODUCT_NAME,
    description:
      "Explore Talisbooks™ — browse digital lookbooks on the standing-book bookshelf.",
  };
}

/** Absolute URL of the composed landscape Mapsite™ share card. */
export function resolveMapSiteOgImage(fastCodeRaw: string): string {
  return toAbsoluteHttpsOgUrl(mapsiteShareOgPath(fastCodeRaw));
}
