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
 * Demo / unclaimed Mapsite™ gallery — Talishouse™ product lineup
 * (400, 800, residential 1600+, residential hero).
 */
export const MAPSITE_DEMO_GALLERY = [
  "/images/talishouse/recreational/400.png",
  "/images/talishouse/recreational/800.png",
  "/images/talishouse/residential/models/1600.png",
  "/images/talishouse/residential/hero.jpg",
] as const;

export const MAPSITE_DEMO_LISTING_IMAGE = MAPSITE_DEMO_GALLERY[0];

function isLegacyScenicDemoPath(path: string | null | undefined): boolean {
  if (!path?.trim()) return true;
  return path.includes("/images/mapsites/lrg1-gallery/");
}

/**
 * True when demo media is still the old coastal scenic set (or empty).
 * Claimed uploads and custom covers are left alone.
 */
export function shouldReplaceDemoListingMedia(
  coverImage: string | null | undefined,
  galleryImages: string[] | null | undefined
): boolean {
  const gallery = (galleryImages ?? []).filter(Boolean);
  if (gallery.length === 0) return isLegacyScenicDemoPath(coverImage);
  return gallery.every((url) => isLegacyScenicDemoPath(url));
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
  if (
    mapsite.is_demonstration &&
    shouldReplaceDemoListingMedia(mapsite.cover_image, mapsite.gallery_images)
  ) {
    return MAPSITE_DEMO_LISTING_IMAGE;
  }

  const fromGallery = mapsite.gallery_images?.[0]?.trim();
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
  if (
    mapsite.is_demonstration &&
    shouldReplaceDemoListingMedia(mapsite.cover_image, mapsite.gallery_images)
  ) {
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
