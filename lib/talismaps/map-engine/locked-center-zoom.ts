/** Ignore float noise from the map so a locked camera does not fight itself. */
const ZOOM_EPSILON = 0.05;

/**
 * Zoom to send while the pin stays locked under the card.
 * Null means the map is already on that step.
 */
export function zoomToApplyWhileCenterLocked(
  currentZoom: number,
  nextZoom: number,
): number | null {
  if (!Number.isFinite(currentZoom) || !Number.isFinite(nextZoom)) return null;
  if (Math.abs(currentZoom - nextZoom) < ZOOM_EPSILON) return null;
  return nextZoom;
}
