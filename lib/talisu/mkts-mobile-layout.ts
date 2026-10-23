/**
 * Phone layout helpers for the /talisu/mkts map (pure, unit-tested).
 *
 * - `fitMktsViewport`: Web-Mercator fit of the pins to the map container's
 *   real pixel size, with fractional zoom, so narrow screens are filled
 *   (Google's integer fitBounds with the desktop sidebar inset collapsed to a
 *   world view on phones).
 * - `spreadMktsPins`: nudges pins that would overlap at a given zoom apart in
 *   screen space so each stays tappable; at higher zooms the offsets vanish.
 */

export type LatLng = { latitude: number; longitude: number };

const TILE_PX = 256;
/** Phone pin diameters (desktop keeps 41 / 58). */
export const TALISU_MKTS_MOBILE_MARKET_PIN_SIZE = 32;
export const TALISU_MKTS_MOBILE_DO_MORE_PIN_SIZE = 46;
/** Below this width the Markets page uses the stacked phone layout (Tailwind lg). */
export const TALISU_MKTS_MOBILE_MAX_WIDTH_PX = 1023;

function project(point: LatLng): { x: number; y: number } {
  const sin = Math.sin((point.latitude * Math.PI) / 180);
  const clamped = Math.min(Math.max(sin, -0.9999), 0.9999);
  return {
    x: (point.longitude + 180) / 360,
    y: 0.5 - Math.log((1 + clamped) / (1 - clamped)) / (4 * Math.PI),
  };
}

function unproject(point: { x: number; y: number }): LatLng {
  const n = Math.PI - 2 * Math.PI * point.y;
  return {
    latitude: (180 / Math.PI) * Math.atan(Math.sinh(n)),
    longitude: point.x * 360 - 180,
  };
}

export function fitMktsViewport(
  coordinates: readonly LatLng[],
  width: number,
  height: number,
  padding = 28,
  maxZoom = 6,
): { center: LatLng; zoom: number } | null {
  if (coordinates.length === 0 || width <= 0 || height <= 0) return null;
  const pts = coordinates.map(project);
  const minX = Math.min(...pts.map((p) => p.x));
  const maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));
  const usableW = Math.max(1, width - padding * 2);
  const usableH = Math.max(1, height - padding * 2);
  const spanX = Math.max(maxX - minX, 1e-6);
  const spanY = Math.max(maxY - minY, 1e-6);
  let zoom = Math.log2(
    Math.min(usableW / (spanX * TILE_PX), usableH / (spanY * TILE_PX)),
  );
  // Never zoom out past one world filling the container (no grey bands).
  const minZoom = Math.log2(Math.max(width, height) / TILE_PX);
  zoom = Math.min(Math.max(zoom, minZoom), maxZoom);
  const world = TILE_PX * 2 ** zoom;
  const halfH = height / 2 / world;
  const cy = Math.min(Math.max((minY + maxY) / 2, halfH), 1 - halfH);
  return { center: unproject({ x: (minX + maxX) / 2, y: cy }), zoom };
}

export type SpreadPinInput = LatLng & { id: string; size: number };

export function spreadMktsPins(
  pins: readonly SpreadPinInput[],
  zoom: number,
  gap = 4,
  iterations = 120,
): Map<string, LatLng> {
  const world = TILE_PX * 2 ** zoom;
  const pts = pins.map((pin) => {
    const p = project(pin);
    return { id: pin.id, size: pin.size, x: p.x * world, y: p.y * world };
  });
  for (let iter = 0; iter < iterations; iter += 1) {
    let moved = false;
    for (let i = 0; i < pts.length; i += 1) {
      for (let j = i + 1; j < pts.length; j += 1) {
        const a = pts[i]!;
        const b = pts[j]!;
        const min = (a.size + b.size) / 2 + gap;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);
        if (dist >= min) continue;
        if (dist < 1e-6) {
          const angle = (i * 2.399 + j) % (2 * Math.PI);
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          dist = 1;
        }
        // Bigger pins (the Do More logo) move less than small flags.
        const push = (min - dist) / dist;
        const wa = b.size / (a.size + b.size);
        const wb = a.size / (a.size + b.size);
        a.x -= dx * push * wa;
        a.y -= dy * push * wa;
        b.x += dx * push * wb;
        b.y += dy * push * wb;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return new Map(
    pts.map((p) => [p.id, unproject({ x: p.x / world, y: p.y / world })]),
  );
}
