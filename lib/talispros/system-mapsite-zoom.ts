import { zoomForMapRadiusKm } from "@/lib/talispros/start-content";

/** Visible span around a system-built pin when no editor zoom was saved. */
export const SYSTEM_MAPSITE_SPAN_KM = 80;
/** Distance from the pin to the nearest edge of that span. */
export const SYSTEM_MAPSITE_RADIUS_KM = SYSTEM_MAPSITE_SPAN_KM / 2;
/** Shorter map side used before the container has been measured. */
export const SYSTEM_MAPSITE_FALLBACK_PX = 900;

/**
 * Integer zoom so about 80 km (40 km from the pin to the nearest edge)
 * stays on screen. `minViewportPx` is the shorter side of the map.
 */
export function systemMapsiteOpeningZoom(
  latitude: number,
  minViewportPx = SYSTEM_MAPSITE_FALLBACK_PX,
): number {
  return zoomForMapRadiusKm(latitude, SYSTEM_MAPSITE_RADIUS_KM, minViewportPx);
}
