import {
  TALISBOOKS_VIEWER_SPEED_DEFAULT_MS,
  TALISBOOKS_VIEWER_SPEED_MAX_MS,
  TALISBOOKS_VIEWER_SPEED_MIN_MS,
  TALISBOOKS_VIEWER_SPEED_PRESETS,
  type TalisBooksViewerSpeedPresetId,
} from "./constants";

export function clampViewerIntervalMs(intervalMs: number): number {
  if (!Number.isFinite(intervalMs)) {
    return TALISBOOKS_VIEWER_SPEED_DEFAULT_MS;
  }
  return Math.min(
    TALISBOOKS_VIEWER_SPEED_MAX_MS,
    Math.max(TALISBOOKS_VIEWER_SPEED_MIN_MS, Math.round(intervalMs)),
  );
}

export function resolveViewerIntervalMs(
  presetId?: TalisBooksViewerSpeedPresetId | string | null,
  customMs?: number | null,
): number {
  if (typeof customMs === "number") {
    return clampViewerIntervalMs(customMs);
  }

  const preset = TALISBOOKS_VIEWER_SPEED_PRESETS.find((entry) => entry.id === presetId);
  return preset?.intervalMs ?? TALISBOOKS_VIEWER_SPEED_DEFAULT_MS;
}

/**
 * Pure helper: should the auto-turn timer fire?
 * Timer runs only when autoplay is on and hover has not paused it.
 */
export function shouldAutoAdvance(options: {
  autoPlaying: boolean;
  pausedByHover: boolean;
  pageCount: number;
}): boolean {
  return options.autoPlaying && !options.pausedByHover && options.pageCount > 1;
}

export function nextPageIndex(currentIndex: number, pageCount: number): number {
  if (pageCount <= 0) {
    return 0;
  }
  return (currentIndex + 1) % pageCount;
}

export function previousPageIndex(currentIndex: number, pageCount: number): number {
  if (pageCount <= 0) {
    return 0;
  }
  return (currentIndex - 1 + pageCount) % pageCount;
}

/** Maps interval to a 0–100 speed slider value (faster = higher). */
export function intervalMsToSpeedPercent(intervalMs: number): number {
  const clamped = clampViewerIntervalMs(intervalMs);
  const range = TALISBOOKS_VIEWER_SPEED_MAX_MS - TALISBOOKS_VIEWER_SPEED_MIN_MS;
  const inverted = TALISBOOKS_VIEWER_SPEED_MAX_MS - clamped;
  return Math.round((inverted / range) * 100);
}

export function speedPercentToIntervalMs(percent: number): number {
  const safe = Math.min(100, Math.max(0, percent));
  const range = TALISBOOKS_VIEWER_SPEED_MAX_MS - TALISBOOKS_VIEWER_SPEED_MIN_MS;
  return clampViewerIntervalMs(TALISBOOKS_VIEWER_SPEED_MAX_MS - (safe / 100) * range);
}
