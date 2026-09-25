/**
 * Landscape Open Graph card shared by Mapsite™ and Talisbooks™ viewer links.
 * 1200×630 (~1.91:1). Full-bleed photo, red pin at the frame center when the
 * card represents a listing location, Talispros™ mark vertically centered
 * on the right.
 */

export const SHARE_OG_WIDTH = 1200;
export const SHARE_OG_HEIGHT = 630;

/** Chrome wordmark already used in the product header (`/logo.png`). */
export const SHARE_OG_LOGO_PATH = "/logo.png";

export const SHARE_OG_PIN_COLOR = "#E10600";
export const SHARE_OG_PIN_WIDTH = 86;
export const SHARE_OG_PIN_HEIGHT = 118;
/** Tip of the pin inside the SVG, in pixels. */
export const SHARE_OG_PIN_TIP_X = 43;
export const SHARE_OG_PIN_TIP_Y = 112;

export const SHARE_OG_LOGO_MAX_WIDTH = 168;
export const SHARE_OG_LOGO_MAX_HEIGHT = 168;
export const SHARE_OG_LOGO_MARGIN_RIGHT = 36;

const MERCATOR_HALF = 20037508.342789244;
const EQUATOR_MPP_Z0 = 156543.03392804097;

export function mapsiteShareOgPath(fastCode: string): string {
  const code = fastCode.trim().toLowerCase();
  return `/api/og/mapsite/${encodeURIComponent(code)}`;
}

export function talisbooksViewerShareOgPath(slug: string): string {
  return `/api/og/talisbooks/${encodeURIComponent(slug.trim())}`;
}

export function shareOgPinAnchor(): { x: number; y: number } {
  return { x: SHARE_OG_WIDTH / 2, y: SHARE_OG_HEIGHT / 2 };
}

/** Place the pin so its tip sits on the center of the frame. */
export function shareOgPinPlacement(): {
  left: number;
  top: number;
  width: number;
  height: number;
  tip: { x: number; y: number };
} {
  const tip = shareOgPinAnchor();
  return {
    left: Math.round(tip.x - SHARE_OG_PIN_TIP_X),
    top: Math.round(tip.y - SHARE_OG_PIN_TIP_Y),
    width: SHARE_OG_PIN_WIDTH,
    height: SHARE_OG_PIN_HEIGHT,
    tip,
  };
}

/** Slot for the brand mark, vertically centered on the right edge. */
export function shareOgLogoPlacement(): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const width = SHARE_OG_LOGO_MAX_WIDTH;
  const height = SHARE_OG_LOGO_MAX_HEIGHT;
  return {
    left: SHARE_OG_WIDTH - SHARE_OG_LOGO_MARGIN_RIGHT - width,
    top: Math.round((SHARE_OG_HEIGHT - height) / 2),
    width,
    height,
  };
}

export function shareOgPinSvg(
  color: string = SHARE_OG_PIN_COLOR,
  scale = 1,
): string {
  const safeColor = /^#[0-9A-Fa-f]{3,8}$/.test(color.trim())
    ? color.trim()
    : SHARE_OG_PIN_COLOR;
  const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const w = Math.max(8, Math.round(SHARE_OG_PIN_WIDTH * s));
  const h = Math.max(10, Math.round(SHARE_OG_PIN_HEIGHT * s));
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${SHARE_OG_PIN_WIDTH} ${SHARE_OG_PIN_HEIGHT}">
  <path fill="${safeColor}" stroke="#ffffff" stroke-width="4" stroke-linejoin="round" d="M43 112
    C43 112 14 66 14 42
    C14 22 27 10 43 10
    C59 10 72 22 72 42
    C72 66 43 112 43 112 Z"/>
  <circle cx="43" cy="42" r="11" fill="#ffffff"/>
</svg>`;
}

/** Place a pin so its tip sits on (tipX, tipY) in the OG frame. */
export function shareOgPinPlacementAt(
  tipX: number,
  tipY: number,
  scale = 1,
): {
  left: number;
  top: number;
  width: number;
  height: number;
  tip: { x: number; y: number };
} {
  const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const width = Math.max(8, Math.round(SHARE_OG_PIN_WIDTH * s));
  const height = Math.max(10, Math.round(SHARE_OG_PIN_HEIGHT * s));
  const tip = { x: tipX, y: tipY };
  return {
    left: Math.round(tip.x - SHARE_OG_PIN_TIP_X * s),
    top: Math.round(tip.y - SHARE_OG_PIN_TIP_Y * s),
    width,
    height,
    tip,
  };
}

export function clampOgMapZoom(zoom: number | null | undefined): number {
  if (zoom == null || !Number.isFinite(zoom)) return 16;
  return Math.min(17, Math.max(15, Math.round(zoom)));
}

export function lngLatToWebMercator(
  longitude: number,
  latitude: number,
): { x: number; y: number } {
  const clamped = Math.max(Math.min(latitude, 85.05112878), -85.05112878);
  const x = (longitude * MERCATOR_HALF) / 180;
  const y =
    Math.log(Math.tan(((90 + clamped) * Math.PI) / 360)) *
    (MERCATOR_HALF / Math.PI);
  return { x, y };
}

/**
 * Web-Mercator bbox whose center is the listing. The exported image is the
 * OG frame, so a pin drawn at the frame center sits on that lat/lng.
 */
export function shareOgImageryBbox(input: {
  latitude: number;
  longitude: number;
  zoom?: number | null;
}): {
  zoom: number;
  west: number;
  south: number;
  east: number;
  north: number;
} {
  const zoom = clampOgMapZoom(input.zoom);
  const center = lngLatToWebMercator(input.longitude, input.latitude);
  const metersPerPixel = EQUATOR_MPP_Z0 / 2 ** zoom;
  const halfW = (SHARE_OG_WIDTH / 2) * metersPerPixel;
  const halfH = (SHARE_OG_HEIGHT / 2) * metersPerPixel;
  return {
    zoom,
    west: center.x - halfW,
    south: center.y - halfH,
    east: center.x + halfW,
    north: center.y + halfH,
  };
}

export function esriWorldImageryUrl(input: {
  latitude: number;
  longitude: number;
  zoom?: number | null;
}): string {
  const box = shareOgImageryBbox(input);
  const bbox = [box.west, box.south, box.east, box.north].join(",");
  const params = new URLSearchParams({
    bbox,
    bboxSR: "3857",
    imageSR: "3857",
    size: `${SHARE_OG_WIDTH},${SHARE_OG_HEIGHT}`,
    format: "jpg",
    f: "image",
  });
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?${params.toString()}`;
}

/**
 * Wide-area OG imagery (ALLPINS Canada, multi-pin). Zoom is not clamped to
 * the single-listing 15–17 band.
 */
export function shareOgWideImageryBbox(input: {
  latitude: number;
  longitude: number;
  zoom: number;
}): {
  zoom: number;
  west: number;
  south: number;
  east: number;
  north: number;
} {
  const zoom = Math.min(12, Math.max(2, Math.round(input.zoom)));
  const center = lngLatToWebMercator(input.longitude, input.latitude);
  const metersPerPixel = EQUATOR_MPP_Z0 / 2 ** zoom;
  const halfW = (SHARE_OG_WIDTH / 2) * metersPerPixel;
  const halfH = (SHARE_OG_HEIGHT / 2) * metersPerPixel;
  return {
    zoom,
    west: center.x - halfW,
    south: center.y - halfH,
    east: center.x + halfW,
    north: center.y + halfH,
  };
}

export function esriWorldImageryUrlWide(input: {
  latitude: number;
  longitude: number;
  zoom: number;
}): string {
  const box = shareOgWideImageryBbox(input);
  const bbox = [box.west, box.south, box.east, box.north].join(",");
  const params = new URLSearchParams({
    bbox,
    bboxSR: "3857",
    imageSR: "3857",
    size: `${SHARE_OG_WIDTH},${SHARE_OG_HEIGHT}`,
    format: "jpg",
    f: "image",
  });
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?${params.toString()}`;
}

export type ShareOgProjectedPin = {
  color: string;
  left: number;
  top: number;
  width: number;
  height: number;
  scale: number;
};

/**
 * Project lat/lng pins into the OG frame using the same Mercator bbox as the
 * satellite export, so each tip sits on its geographic location.
 */
export function projectPinsOntoShareOg(input: {
  pins: Array<{ latitude: number; longitude: number; color: string }>;
  latitude: number;
  longitude: number;
  zoom: number;
  /** Relative pin size vs single-listing pin (ALLPINS uses ~0.4). */
  scale?: number;
}): {
  bbox: ReturnType<typeof shareOgWideImageryBbox>;
  overlays: ShareOgProjectedPin[];
} {
  const scale =
    input.scale != null && Number.isFinite(input.scale) && input.scale > 0
      ? input.scale
      : 0.4;
  const bbox = shareOgWideImageryBbox(input);
  const spanX = bbox.east - bbox.west;
  const spanY = bbox.north - bbox.south;
  const overlays: ShareOgProjectedPin[] = [];
  if (!(spanX > 0) || !(spanY > 0)) {
    return { bbox, overlays };
  }
  for (const pin of input.pins) {
    if (!Number.isFinite(pin.latitude) || !Number.isFinite(pin.longitude)) {
      continue;
    }
    const merc = lngLatToWebMercator(pin.longitude, pin.latitude);
    const tipX = ((merc.x - bbox.west) / spanX) * SHARE_OG_WIDTH;
    const tipY = ((bbox.north - merc.y) / spanY) * SHARE_OG_HEIGHT;
    if (
      tipX < -40 ||
      tipX > SHARE_OG_WIDTH + 40 ||
      tipY < -40 ||
      tipY > SHARE_OG_HEIGHT + 40
    ) {
      continue;
    }
    const place = shareOgPinPlacementAt(tipX, tipY, scale);
    overlays.push({
      color: pin.color,
      left: place.left,
      top: place.top,
      width: place.width,
      height: place.height,
      scale,
    });
  }
  return { bbox, overlays };
}

export type ShareOgPlan =
  | { kind: "satellite"; showPin: true }
  | { kind: "scenic"; imageUrl: string; showPin: boolean }
  | { kind: "fallback"; showPin: boolean };

/** Mapsite™ cards prefer a map centered on the listing, then a scenic photo. */
export function planMapsiteShareOg(input: {
  hasCoordinates: boolean;
  scenicImageUrl?: string | null;
}): ShareOgPlan {
  if (input.hasCoordinates) return { kind: "satellite", showPin: true };
  const scenic = input.scenicImageUrl?.trim() || "";
  if (scenic) return { kind: "scenic", imageUrl: scenic, showPin: true };
  return { kind: "fallback", showPin: true };
}

/** Viewer cards use the parting shot only. No pin — the photo is not a map. */
export function planViewerShareOg(input: {
  partingShotUrl?: string | null;
}): ShareOgPlan {
  const scenic = input.partingShotUrl?.trim() || "";
  if (scenic) return { kind: "scenic", imageUrl: scenic, showPin: false };
  return { kind: "fallback", showPin: false };
}
