import { clampMapZoom, HOME_PIN_DEFAULT_MAP_ZOOM } from "@/lib/home-pin-coordinates";
import { getMapSiteListingHeroImage } from "@/lib/talispros/mapsite-listing-media";
import { getMapTilerApiKey } from "@/lib/talismaps/map-engine/styles/types";

export type AdminMapSiteThumbnailRow = {
  fast_code: string;
  status: string;
  property_title: string | null;
  property_address?: string | null;
  cover_image?: string | null;
  header_image_url?: string | null;
  gallery_images?: string[] | null;
  is_demonstration?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
  map_zoom?: number | null;
};

export type AdminMapSiteThumbnail = {
  fastCode: string;
  status: string;
  propertyTitle: string | null;
  propertyAddress: string | null;
  listingHeroUrl: string;
  mapPreviewUrl: string | null;
};

function isUsableMapTilerKey(apiKey: string): boolean {
  return Boolean(apiKey) && apiKey !== "YOUR_MAPTILER_API_KEY" && apiKey.length >= 8;
}

function asGallery(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
}

export function webMercatorTile(
  latitude: number,
  longitude: number,
  zoom: number,
): { x: number; y: number; zoom: number } {
  const n = 2 ** zoom;
  const x = Math.floor(((longitude + 180) / 360) * n);
  const latRad = (latitude * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  return { x, y, zoom };
}

/** Satellite still of the live Mapsite™ camera, for admin thumbnails. */
export function mapsiteSatellitePreviewUrl(options: {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  zoom?: number | null;
}): string | null {
  const latitude = options.latitude;
  const longitude = options.longitude;
  if (
    latitude == null ||
    longitude == null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  const apiKey = getMapTilerApiKey();
  if (!isUsableMapTilerKey(apiKey)) return null;

  const zoom = Math.min(16, clampMapZoom(options.zoom ?? HOME_PIN_DEFAULT_MAP_ZOOM));
  const tile = webMercatorTile(latitude, longitude, zoom);
  return `https://api.maptiler.com/tiles/satellite-v2/${tile.zoom}/${tile.x}/${tile.y}.jpg?key=${encodeURIComponent(apiKey)}`;
}

export function toAdminMapSiteThumbnail(
  row: AdminMapSiteThumbnailRow,
): AdminMapSiteThumbnail {
  const gallery = asGallery(row.gallery_images);
  const cover = row.cover_image?.trim() || row.header_image_url?.trim() || null;

  return {
    fastCode: row.fast_code,
    status: row.status,
    propertyTitle: row.property_title,
    propertyAddress: row.property_address?.trim() || null,
    listingHeroUrl: getMapSiteListingHeroImage({
      cover_image: cover,
      gallery_images: gallery,
      is_demonstration: Boolean(row.is_demonstration),
    }),
    mapPreviewUrl: mapsiteSatellitePreviewUrl({
      latitude: row.latitude,
      longitude: row.longitude,
      zoom: row.map_zoom,
    }),
  };
}
