import {
  MAPSITE_COMPACT_BREAKPOINT_PX,
  MAPSITE_LISTING_CARD_MAX_WIDTH_PX,
  MAPSITE_OVERLAY_GAP_PX,
  MAPSITE_OVERLAY_INSET_PX,
} from "@/lib/talispros/mapsite-overlay-layout";
import { cameraCenterForScreenOffset } from "@/lib/talismaps/map-engine/pin-focus-camera";
import {
  SYSTEM_MAPSITE_FALLBACK_PX,
  systemMapsiteOpeningZoom,
} from "@/lib/talispros/system-mapsite-zoom";

/** Legacy geographic pad used when expanding raw pin corners. */
export const MAPSITE_PIN_BUFFER_KM = 32;
const KM_PER_DEGREE_LAT = 111.0;

/** Comfortable inset from the map edge, zoom controls, and chrome. */
export const MAPSITE_FIT_EDGE_PAD_PX = 56;
/** Extra space between the left FAST-code card and the nearest pin. */
export const MAPSITE_FIT_CARD_GAP_PX = 24;
/** Do not zoom a tight pin group in past a neighborhood view. */
export const MAPSITE_FIT_MAX_ZOOM = 14;
export const MAPSITE_FIT_MIN_ZOOM = 4;
/** Shorter map side must exceed this before a measured fit is applied. */
export const MAPSITE_FIT_MIN_SIZE_PX = 200;

const TILE = 256;

export type MapsiteFitPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type MapsiteOpeningMode = "multi" | "single" | "empty";

export type MapsiteOpeningViewport = {
  center: { latitude: number; longitude: number };
  zoom: number;
  mode: MapsiteOpeningMode;
};

/**
 * Bounding corners of `points` padded by `km` on every side (used with
 * fitToCoordinates so all PINs show with a ~32 km buffer around them).
 */
export function bufferedPinBounds(
  points: ReadonlyArray<{ latitude: number; longitude: number }>,
  km = MAPSITE_PIN_BUFFER_KM,
): Array<{ latitude: number; longitude: number }> {
  const valid = points.filter(
    (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude),
  );
  if (valid.length === 0) return [];
  const lats = valid.map((p) => p.latitude);
  const lngs = valid.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const midLat = (minLat + maxLat) / 2;
  const dLat = km / KM_PER_DEGREE_LAT;
  const dLng =
    km / (KM_PER_DEGREE_LAT * Math.max(0.05, Math.cos((midLat * Math.PI) / 180)));
  return [
    { latitude: Math.max(-85, minLat - dLat), longitude: Math.min(...lngs) - dLng },
    { latitude: Math.min(85, maxLat + dLat), longitude: Math.max(...lngs) + dLng },
  ];
}

/** Pixel padding that keeps pins clear of the left card (desktop) or top stack (compact). */
export function mapsiteInitialFitPadding(input: {
  mapWidth: number;
  mapHeight: number;
  compact?: boolean;
  listingRight?: number;
}): MapsiteFitPadding {
  const width = Math.max(0, input.mapWidth);
  const height = Math.max(0, input.mapHeight);
  const compact =
    input.compact ??
    (width > 0 && width < MAPSITE_COMPACT_BREAKPOINT_PX);
  const edge = MAPSITE_FIT_EDGE_PAD_PX;
  if (compact) {
    const top = Math.min(
      Math.max(edge, Math.round(height * 0.36)),
      Math.max(edge, height - edge * 2),
    );
    return { top, right: edge, bottom: edge, left: Math.min(edge, 32) };
  }
  const listingRight =
    input.listingRight != null && input.listingRight > 0
      ? input.listingRight
      : MAPSITE_OVERLAY_INSET_PX + MAPSITE_LISTING_CARD_MAX_WIDTH_PX;
  return {
    top: edge,
    right: edge,
    bottom: edge,
    left: listingRight + MAPSITE_OVERLAY_GAP_PX + MAPSITE_FIT_CARD_GAP_PX,
  };
}

export function shouldApplyMapsiteOpeningFit(input: {
  isReady: boolean;
  mapWidth: number;
  mapHeight: number;
  pinEditorIdle: boolean;
  openPinOnLoad: boolean;
  userMovedMap: boolean;
  selectedPinId?: string | null;
}): boolean {
  if (!input.isReady || !input.pinEditorIdle) return false;
  if (input.openPinOnLoad || input.userMovedMap) return false;
  if (input.selectedPinId) return false;
  return (
    input.mapWidth > MAPSITE_FIT_MIN_SIZE_PX &&
    input.mapHeight > MAPSITE_FIT_MIN_SIZE_PX
  );
}

function validPins(
  points: ReadonlyArray<{ latitude: number; longitude: number }>,
): Array<{ latitude: number; longitude: number }> {
  return points.filter(
    (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude),
  );
}

function mercatorX(longitude: number): number {
  return ((longitude + 180) / 360) * TILE;
}

function mercatorY(latitude: number): number {
  const siny = Math.min(
    Math.max(Math.sin((latitude * Math.PI) / 180), -0.9999),
    0.9999,
  );
  return (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)) * TILE;
}

function latLngFromWorld(
  x: number,
  y: number,
): { latitude: number; longitude: number } {
  const longitude = (x / TILE) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / TILE;
  const latitude = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { latitude, longitude };
}

/** Project a lat/lng to map-container pixels for the given camera. */
export function projectMapsitePinToScreen(
  point: { latitude: number; longitude: number },
  center: { latitude: number; longitude: number },
  zoom: number,
  mapWidth: number,
  mapHeight: number,
): { x: number; y: number } {
  const scale = 2 ** zoom;
  const world = { x: mercatorX(point.longitude), y: mercatorY(point.latitude) };
  const origin = { x: mercatorX(center.longitude), y: mercatorY(center.latitude) };
  return {
    x: mapWidth / 2 + (world.x - origin.x) * scale,
    y: mapHeight / 2 + (world.y - origin.y) * scale,
  };
}

function viewportForBounds(
  points: ReadonlyArray<{ latitude: number; longitude: number }>,
  mapWidth: number,
  mapHeight: number,
  padding: MapsiteFitPadding,
): { center: { latitude: number; longitude: number }; zoom: number } {
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const availW = Math.max(1, mapWidth - padding.left - padding.right);
  const availH = Math.max(1, mapHeight - padding.top - padding.bottom);
  const fracW = Math.max(1e-9, Math.abs(mercatorX(maxLng) - mercatorX(minLng)) / TILE);
  const fracH = Math.max(1e-9, Math.abs(mercatorY(minLat) - mercatorY(maxLat)) / TILE);
  const zoomW = Math.log2(availW / (fracW * TILE));
  const zoomH = Math.log2(availH / (fracH * TILE));
  const raw = Math.min(zoomW, zoomH);
  const zoom = Number.isFinite(raw)
    ? Math.min(
        MAPSITE_FIT_MAX_ZOOM,
        Math.max(MAPSITE_FIT_MIN_ZOOM, Math.floor(raw)),
      )
    : MAPSITE_FIT_MIN_ZOOM;
  const geoCenter = latLngFromWorld(
    (mercatorX(minLng) + mercatorX(maxLng)) / 2,
    (mercatorY(minLat) + mercatorY(maxLat)) / 2,
  );
  const offset = {
    x: padding.left + availW / 2 - mapWidth / 2,
    y: padding.top + availH / 2 - mapHeight / 2,
  };
  return {
    center: cameraCenterForScreenOffset(geoCenter, zoom, offset),
    zoom,
  };
}

/**
 * Opening camera for a Mapsite: fit every pin on a multi-pin map, use the
 * 80 km opening (or a saved editor zoom) for a single pin, and fall back to
 * the Mapsite coordinate when no pins are present.
 */
export function viewportForMapsitePins(input: {
  pins: ReadonlyArray<{ latitude: number; longitude: number }>;
  fallbackCenter: { latitude: number; longitude: number };
  mapWidth?: number;
  mapHeight?: number;
  padding?: MapsiteFitPadding;
  singlePinZoom?: number;
  emptyZoom?: number;
}): MapsiteOpeningViewport {
  const pins = validPins(input.pins);
  const width =
    input.mapWidth && input.mapWidth > 0
      ? input.mapWidth
      : SYSTEM_MAPSITE_FALLBACK_PX;
  const height =
    input.mapHeight && input.mapHeight > 0
      ? input.mapHeight
      : SYSTEM_MAPSITE_FALLBACK_PX;
  const minSide = Math.min(width, height);
  const fallbackZoom =
    input.emptyZoom ?? systemMapsiteOpeningZoom(input.fallbackCenter.latitude, minSide);
  if (pins.length === 0) {
    return {
      center: { ...input.fallbackCenter },
      zoom: fallbackZoom,
      mode: "empty",
    };
  }
  if (pins.length === 1) {
    const pin = pins[0]!;
    return {
      center: { latitude: pin.latitude, longitude: pin.longitude },
      zoom:
        input.singlePinZoom ??
        systemMapsiteOpeningZoom(pin.latitude, minSide),
      mode: "single",
    };
  }
  const padding =
    input.padding ?? mapsiteInitialFitPadding({ mapWidth: width, mapHeight: height });
  const fitted = viewportForBounds(pins, width, height, padding);
  return { ...fitted, mode: "multi" };
}
