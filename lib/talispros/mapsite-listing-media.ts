import type { MapSitePlatformRecord } from "@/lib/talispros/mapsite-platform";

/** Listing card + pin popup share one hero image and crop focal point. */
export const MAPSITE_LISTING_IMAGE_CLASS =
  "object-cover object-[center_42%]";

/** Shared card width for the left tile and pin popup. */
export const MAPSITE_LISTING_CARD_WIDTH_CLASS = "w-[min(92vw,22rem)]";

/** Shared hero image height so sidebar and pin popup align visually. */
export const MAPSITE_LISTING_HERO_HEIGHT_CLASS = "h-44";

/** Fallback top offset: search row + gap below aside padding (matches sidebar layout). */
export const MAPSITE_LISTING_TILE_TOP_FALLBACK_PX = 64;

/**
 * Demo / unclaimed Mapsite™ gallery — Glasshouse™ product imagery.
 */
export const MAPSITE_DEMO_GALLERY = [
  "/images/glasshouse/hero.png",
  "/images/glasshouse/models/200.png",
  "/images/glasshouse/models/160.png",
  "/images/glasshouse/glasshouse.png",
] as const;

export const MAPSITE_DEMO_LISTING_IMAGE = MAPSITE_DEMO_GALLERY[0];

/** Prior demo stock — still replace these with the current Glasshouse™ set. */
const SUPERSEDED_DEMO_LISTING_IMAGES = new Set([
  "/images/talishouse/recreational/400.png",
  "/images/talishouse/recreational/800.png",
  "/images/talishouse/residential/models/1600.png",
  "/images/talishouse/residential/hero.jpg",
]);

export function isStockDemoListingPath(path: string | null | undefined): boolean {
  if (!path?.trim()) return true;
  const trimmed = path.trim();
  if (trimmed.includes("/images/glasshouse/")) return true;
  if (trimmed.includes("/images/mapsites/lrg1-gallery/")) return true;
  return SUPERSEDED_DEMO_LISTING_IMAGES.has(trimmed);
}

function uniqueNonStockUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const value of urls) {
    const url = value.trim();
    if (!url || isStockDemoListingPath(url) || seen.has(url)) continue;
    seen.add(url);
    unique.push(url);
  }
  return unique;
}

/**
 * Pin popup / listing card hero: 2nd upload, or PDF page 2.
 * Falls back to the first interior when only one image exists.
 */
export function listingHeroImageUrl(urls: string[]): string | null {
  const unique = uniqueNonStockUrls(urls);
  return unique[1] ?? unique[0] ?? null;
}

/**
 * Interior Talisbook™ page photographs for the Mapsite™ listing card.
 * Covers, Glasshouse™ brochure pages, and demo stock are skipped.
 */
export function listingImageUrlsFromEbookPages(
  pages: Array<{
    pageRole?: string | null;
    layout?: string | null;
    systemKey?: string | null;
    spreadImageUrl?: string | null;
    heroImageUrl?: string | null;
  }>,
): string[] {
  const urls: string[] = [];
  for (const page of pages) {
    const role = page.pageRole?.trim() || "";
    const layout = page.layout?.trim() || "";
    if (role === "cover" || layout === "cover") continue;
    if (layout === "global_content" || page.systemKey === "glasshouse_brochure") {
      continue;
    }
    const spread = page.spreadImageUrl?.trim() || "";
    const hero = page.heroImageUrl?.trim() || "";
    urls.push(spread || hero);
  }
  return uniqueNonStockUrls(urls);
}

/**
 * True when demo media is still the old coastal scenic set, Glasshouse™
 * stock, or empty. Claimed uploads and custom covers are left alone.
 */
export function shouldReplaceDemoListingMedia(
  coverImage: string | null | undefined,
  galleryImages: string[] | null | undefined
): boolean {
  const gallery = (galleryImages ?? []).filter(Boolean);
  if (gallery.length === 0) return isStockDemoListingPath(coverImage);
  return gallery.every((url) => isStockDemoListingPath(url));
}

/**
 * When the Mapsite™ still shows stock demo photos, use interior Talisbook™
 * pages as the listing hero / gallery.
 */
export function withEbookListingMedia<
  T extends {
    cover_image: string | null;
    gallery_images: string[];
  },
>(mapsite: T, ebookListingUrls: string[]): T {
  const hero = listingHeroImageUrl(ebookListingUrls);
  if (!hero) return mapsite;
  if (!shouldReplaceDemoListingMedia(mapsite.cover_image, mapsite.gallery_images)) {
    return mapsite;
  }
  return {
    ...mapsite,
    cover_image: hero,
    gallery_images: [hero],
  };
}

/**
 * Primary listing photograph shown in the left card and the pin popup.
 * Sidebar and popup must resolve the same URL so the listing reads as one object.
 */
export function getMapSiteListingHeroImage(
  mapsite: Pick<
    MapSitePlatformRecord,
    "cover_image" | "gallery_images" | "is_demonstration"
  >
): string {
  if (shouldReplaceDemoListingMedia(mapsite.cover_image, mapsite.gallery_images)) {
    return MAPSITE_DEMO_LISTING_IMAGE;
  }

  const fromGallery = listingHeroImageUrl(mapsite.gallery_images ?? []);
  if (fromGallery) return fromGallery;

  const fromCover = mapsite.cover_image?.trim();
  if (fromCover) return fromCover;

  return MAPSITE_DEMO_LISTING_IMAGE;
}

/**
 * Ordered gallery URLs for the fullscreen photo viewer.
 * Always returns at least the hero image.
 */
export function getMapSiteListingGalleryImages(
  mapsite: Pick<
    MapSitePlatformRecord,
    "gallery_images" | "cover_image" | "is_demonstration"
  >
): string[] {
  if (shouldReplaceDemoListingMedia(mapsite.cover_image, mapsite.gallery_images)) {
    return [...MAPSITE_DEMO_GALLERY];
  }

  const fromGallery = (mapsite.gallery_images ?? [])
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url));

  if (fromGallery.length > 0) return fromGallery;

  const fromCover = mapsite.cover_image?.trim();
  if (fromCover) return [fromCover];

  return [...MAPSITE_DEMO_GALLERY];
}

export function getMapSiteListingPhotoCount(
  mapsite: Pick<
    MapSitePlatformRecord,
    "gallery_images" | "cover_image" | "is_demonstration"
  >
): number {
  return getMapSiteListingGalleryImages(mapsite).length;
}
