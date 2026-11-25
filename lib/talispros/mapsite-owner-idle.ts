/**
 * Mapsite owner/editor idle timeout. Public visitors are not signed in
 * and are not affected. Admin-panel idle stays on its own 1-minute timer.
 */

/** No input for this long → the owner session ends. */
export const MAPSITE_OWNER_IDLE_TIMEOUT_MS = 15 * 60 * 1000;

/** Show the continue / end warning this long before logout. */
export const MAPSITE_OWNER_IDLE_WARNING_MS = 2 * 60 * 1000;

/** Events that count as activity (same set as admin idle). */
export const MAPSITE_OWNER_ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
] as const;

export function mapsiteOwnerIdleMsRemaining(
  lastActiveMs: number,
  nowMs: number,
): number {
  return Math.max(0, lastActiveMs + MAPSITE_OWNER_IDLE_TIMEOUT_MS - nowMs);
}

export function mapsiteOwnerShouldWarn(
  lastActiveMs: number,
  nowMs: number,
): boolean {
  const remaining = mapsiteOwnerIdleMsRemaining(lastActiveMs, nowMs);
  return remaining > 0 && remaining <= MAPSITE_OWNER_IDLE_WARNING_MS;
}

export function mapsiteOwnerIsIdle(lastActiveMs: number, nowMs: number): boolean {
  return mapsiteOwnerIdleMsRemaining(lastActiveMs, nowMs) <= 0;
}
