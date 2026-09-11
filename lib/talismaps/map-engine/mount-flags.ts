import type { MapMountOptions } from "./types";

/** Pan/zoom/scroll-wheel are enabled unless the caller locked the map. */
export function allowMapGestures(
  interactive: MapMountOptions["interactive"],
): boolean {
  return interactive !== false;
}

/**
 * Auto fit-to-pins on mount would override a caller-supplied zoom
 * (Mapsite™ build-time `mapZoom`). Skip it when the viewport is preserved
 * or the map is non-interactive.
 */
export function shouldAutoFitPinsOnMount(
  options: Pick<MapMountOptions, "preserveViewport" | "interactive">,
): boolean {
  return options.preserveViewport !== true && allowMapGestures(options.interactive);
}
