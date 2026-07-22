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

export const MAPSITE_DEMO_LISTING_IMAGE =
  "/images/mapsites/lrg1-gallery/09.png";

export const MAPSITE_DEMO_GALLERY = [
  MAPSITE_DEMO_LISTING_IMAGE,
  "/images/mapsites/lrg1-gallery/02.png",
] as const;

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
  const fromGallery = mapsite.gallery_images?.[0]?.trim();
  if (fromGallery) return fromGallery;

  const fromCover = mapsite.cover_image?.trim();
  if (fromCover) return fromCover;

  if (mapsite.is_demonstration) {
    return MAPSITE_DEMO_LISTING_IMAGE;
  }

  return MAPSITE_DEMO_LISTING_IMAGE;
}

export function getMapSiteListingPhotoCount(
  mapsite: Pick<MapSitePlatformRecord, "gallery_images">
): number {
  const count = mapsite.gallery_images?.filter(Boolean).length ?? 0;
  return Math.max(1, count);
}
