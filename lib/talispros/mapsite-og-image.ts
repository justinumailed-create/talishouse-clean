import { RM22_ASSETS, RM22_PRODUCTS } from "@/lib/talisbooks/rm22-template";
import {
  getMapSiteEbookContext,
  loadEbookPageMedia,
} from "@/lib/talisbooks/mapsite-ebook-service";
import { pickPartingShotImageUrl } from "@/lib/talisbooks/parting-shot";
import { isStockDemoListingPath } from "@/lib/talispros/mapsite-listing-media";
import type { CreateMetadataImage } from "@/lib/seo";

/** Last-resort small mark — never the tall marketing poster used as og:image. */
export const MAPSITE_OG_BRAND_MARK = "/logo-mark.png";

const PUBLIC_OG_ORIGIN = "https://www.talispros.com";

const TEMPLATE_ASSET_PATHS = new Set<string>([
  RM22_ASSETS.front,
  RM22_ASSETS.agent,
  RM22_ASSETS.intro,
  RM22_ASSETS.caption,
  RM22_ASSETS.intrinsic,
  RM22_ASSETS.outro,
  ...RM22_PRODUCTS.map((product) => product.href),
]);

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

export function selectMapSiteOgImageUrl(input: {
  pages?: Parameters<typeof pickPartingShotImageUrl>[0];
  coverImageUrl?: string | null;
  fallbackImageUrls?: Array<string | null | undefined>;
}): string {
  const parting = pickPartingShotImageUrl(input.pages ?? []);
  if (isUsableMapSiteOgImage(parting)) return parting!;

  const pinPhoto = firstUsable(input.fallbackImageUrls ?? []);
  if (pinPhoto) return pinPhoto;

  const cover = input.coverImageUrl?.trim() || "";
  if (isUsableMapSiteOgImage(cover)) return cover;

  return MAPSITE_OG_BRAND_MARK;
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

export async function resolveMapSiteOgImage(
  fastCodeRaw: string,
  options?: {
    bookSlug?: string | null;
    fallbackImageUrls?: Array<string | null | undefined>;
  },
): Promise<string> {
  let pages: Parameters<typeof pickPartingShotImageUrl>[0] = [];
  let coverImageUrl: string | null = null;

  try {
    const context = await getMapSiteEbookContext(fastCodeRaw, {
      bookSlug: options?.bookSlug,
    });
    coverImageUrl = context?.primaryEbook?.coverImageUrl ?? null;
    if (context?.primaryEbook?.id) {
      pages = await loadEbookPageMedia(context.primaryEbook.id);
    }
  } catch (error) {
    console.warn(
      "[mapsite-og] Could not load linked Talisbook™ pages:",
      error instanceof Error ? error.message : error,
    );
  }

  return toAbsoluteHttpsOgUrl(
    selectMapSiteOgImageUrl({
      pages,
      coverImageUrl,
      fallbackImageUrls: options?.fallbackImageUrls,
    }),
  );
}
