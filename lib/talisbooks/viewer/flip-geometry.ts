/**
 * Spread-flip geometry for the magazine/hardcover viewer.
 *
 * The leaf is a single double-sided plane that rotates 0→±180° around the
 * gutter. A 90° two-leaf swap was leaving a black backface / empty panel at
 * the midpoint; this keeps one plane in the scene for the whole turn.
 */

/** Shift a solo cover (right) or back (left) so that leaf sits in the stage center. */
export function magazineSoloShiftPercent({
  soloRight,
  soloLeft,
  flipping,
}: {
  soloRight: boolean;
  soloLeft: boolean;
  flipping: boolean;
}): number {
  if (flipping) {
    return 0;
  }
  if (soloRight) {
    return -25;
  }
  if (soloLeft) {
    return 25;
  }
  return 0;
}

/** Start/end rotateY for a double-sided spread leaf (degrees). */
export function spreadFlipRotateY(direction: 1 | -1): [number, number] {
  return direction > 0 ? [0, -180] : [0, 180];
}

/** Start/end rotateY for a single-page peel (degrees). */
export function singleFlipRotateY(direction: 1 | -1): [number, number] {
  return direction > 0 ? [0, -165] : [0, 165];
}
