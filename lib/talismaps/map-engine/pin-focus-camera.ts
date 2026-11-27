/** One Google zoom step is 2×. Four steps zooms a regional overview in close on a pin. */
export const PIN_FOCUS_ZOOM_STEP = 4;
/** Floor so a wide auto-fit still opens a tight, readable satellite view. */
export const PIN_FOCUS_MIN_ZOOM = 15;
/** Satellite stays readable; do not step past this. */
export const PIN_FOCUS_MAX_ZOOM = 19;

const TILE = 256;

export function pinFocusZoom(currentZoom: number): number {
  if (!Number.isFinite(currentZoom)) return PIN_FOCUS_MIN_ZOOM;
  return Math.min(
    PIN_FOCUS_MAX_ZOOM,
    Math.max(PIN_FOCUS_MIN_ZOOM, currentZoom + PIN_FOCUS_ZOOM_STEP),
  );
}

function worldPoint(latitude: number, longitude: number): { x: number; y: number } {
  const siny = Math.min(Math.max(Math.sin((latitude * Math.PI) / 180), -0.9999), 0.9999);
  return {
    x: ((longitude + 180) / 360) * TILE,
    y: (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)) * TILE,
  };
}

function latLngFromWorld(x: number, y: number): { latitude: number; longitude: number } {
  const longitude = (x / TILE) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / TILE;
  const latitude = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { latitude, longitude };
}

/**
 * Camera center that places `point` at `offset` pixels from the middle of the map.
 * Positive y puts the point below center, which is where the card tip sits.
 * Same shift as the locked-pin camera: world point minus offset / 2^zoom.
 */
export function cameraCenterForScreenOffset(
  point: { latitude: number; longitude: number },
  zoom: number,
  offset: { x: number; y: number },
): { latitude: number; longitude: number } {
  if (!Number.isFinite(zoom) || (offset.x === 0 && offset.y === 0)) {
    return { latitude: point.latitude, longitude: point.longitude };
  }
  const scale = 2 ** zoom;
  const world = worldPoint(point.latitude, point.longitude);
  return latLngFromWorld(world.x - offset.x / scale, world.y - offset.y / scale);
}

/** Title and address line for an extra pin. A blank label stays a location, not “PIN 3”. */
export function additionalPinCardCopy(input: {
  label: string | null | undefined;
  latitude: number;
  longitude: number;
}): { title: string; detail: string; untitled: boolean } {
  const text = (input.label || "").replace(/\s+/g, " ").trim();
  if (!text) {
    const detail = `${input.latitude.toFixed(5)}, ${input.longitude.toFixed(5)}`;
    return { title: "Pinned location", detail, untitled: true };
  }
  const comma = text.indexOf(",");
  if (comma <= 0) return { title: text, detail: text, untitled: false };
  const title = text.slice(0, comma).trim();
  const detail = text.slice(comma + 1).trim();
  return { title: title || text, detail: detail || text, untitled: false };
}
