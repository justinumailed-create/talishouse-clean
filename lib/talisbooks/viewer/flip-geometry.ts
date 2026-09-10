/**
 * Spread-flip geometry for the magazine/hardcover viewer.
 *
 * The leaf is a single double-sided plane that rotates 0→±180° around the
 * gutter. A 90° two-leaf swap was leaving a black backface / empty panel at
 * the midpoint; this keeps one plane in the scene for the whole turn.
 */

export type MagazineSoloShiftInput = {
  soloRight: boolean;
  soloLeft: boolean;
  flipping: boolean;
  /** Destination spread is a solo front cover (right leaf only). */
  incomingSoloRight?: boolean;
  /** Destination spread is a solo back cover (left leaf only). */
  incomingSoloLeft?: boolean;
  direction?: 1 | -1;
  /**
   * Last-spread wrap to the front cover. Keep the current solo pose so we
   * fade in place instead of sliding 50% of the book width (back → front).
   */
  wrappingToCover?: boolean;
};

/**
 * Horizontal shift so a solo cover/back leaf sits in the stage center.
 *
 * Rest: center the remaining leaf.
 * Open (flip away from solo): expand to 0 with the curl.
 * Close (flip toward solo): slide to the solo rest pose with the curl —
 * never as a second motion after the leaf has already landed.
 * Wrap: keep the current solo pose (no expand-to-0, no back→front slide).
 */
export function magazineSoloShiftPercent({
  soloRight,
  soloLeft,
  flipping,
  incomingSoloRight = false,
  incomingSoloLeft = false,
  direction = 1,
  wrappingToCover = false,
}: MagazineSoloShiftInput): number {
  if (wrappingToCover) {
    if (soloLeft) {
      return 25;
    }
    if (soloRight) {
      return -25;
    }
    return 0;
  }

  if (flipping) {
    if (direction < 0 && incomingSoloRight) {
      return -25;
    }
    if (direction > 0 && incomingSoloLeft) {
      return 25;
    }
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
