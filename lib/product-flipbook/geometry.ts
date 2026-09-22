/**
 * Top-bound catalogue turns.
 *
 * One sheet rotates around its top edge (rotateX). This is a vertical flip
 * off a top hinge — not a centerfold / gutter rotateY spread.
 */

export const TOP_BOUND_TRANSFORM_ORIGIN = "top center";
export const TOP_BOUND_ROTATE_AXIS = "x" as const;

export function clampFlipProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(1, Math.max(0, progress));
}

/**
 * 0 = sheet flat on the stack, facing the reader.
 * 1 = sheet flipped over the top hinge (rotateX -180°).
 */
export function topBoundRotateX(progress: number): number {
  const turns = clampFlipProgress(progress);
  if (turns === 0) return 0;
  return -180 * turns;
}

/**
 * Start and end angles for a single-page turn.
 * Next lifts the current sheet over the hinge.
 * Previous swings the prior sheet back down from above the hinge.
 */
export function topBoundSheetAngle(
  direction: "next" | "prev",
  phase: "rest" | "turned",
): number {
  const progress =
    direction === "next"
      ? phase === "turned"
        ? 1
        : 0
      : phase === "turned"
        ? 0
        : 1;
  return topBoundRotateX(progress);
}
