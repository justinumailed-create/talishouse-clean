/** Auto page-turn interval bounds (ms between flips). */
export const TALISBOOKS_VIEWER_SPEED_MIN_MS = 2000;
export const TALISBOOKS_VIEWER_SPEED_MAX_MS = 12000;
export const TALISBOOKS_VIEWER_SPEED_DEFAULT_MS = 4500;

export const TALISBOOKS_VIEWER_SPEED_PRESETS = [
  { id: "slow", label: "Slow", intervalMs: 8000 },
  { id: "normal", label: "Normal", intervalMs: 4500 },
  { id: "fast", label: "Fast", intervalMs: 2800 },
] as const;

export type TalisBooksViewerSpeedPresetId =
  (typeof TALISBOOKS_VIEWER_SPEED_PRESETS)[number]["id"];

/** Page-turn animation duration in ms (Apple Books–like leaf flip). */
export const TALISBOOKS_VIEWER_TURN_DURATION_MS = 1100;

/** Hold before a press becomes a grab for manual page turn. */
export const TALISBOOKS_VIEWER_LONG_PRESS_MS = 220;

/** Pointer movement that starts a drag before long-press completes. */
export const TALISBOOKS_VIEWER_DRAG_THRESHOLD_PX = 10;

/** Progress (0–1) required to commit a manual drag flip. */
export const TALISBOOKS_VIEWER_FLIP_COMMIT_PROGRESS = 0.36;

/** Viewer layout: open book spread vs one page at a time. */
export type TalisBooksViewerViewMode = "spread" | "single";

/** Single-page: start dragging sooner (more finger-like). */
export const TALISBOOKS_VIEWER_SINGLE_DRAG_THRESHOLD_PX = 4;

/** Single-page: lighter progress commit; velocity can finish the turn. */
export const TALISBOOKS_VIEWER_SINGLE_FLIP_COMMIT_PROGRESS = 0.22;

/** Single-page: horizontal velocity (px/ms) that commits even with low progress. */
export const TALISBOOKS_VIEWER_SINGLE_FLIP_COMMIT_VELOCITY = 0.45;

/** Single-page turn duration — slightly snappier than spread. */
export const TALISBOOKS_VIEWER_SINGLE_TURN_DURATION_MS = 820;
