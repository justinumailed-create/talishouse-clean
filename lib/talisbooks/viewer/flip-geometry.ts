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
 * Open (flip away from solo): hold the solo pose until the leaf is past 90°,
 * then expand — implemented with flipProgress in the stage so the next
 * spread cannot peek beside the cover.
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
    // Hold the solo pose while the cover is still curling. Expanding to 0
    // immediately lets the next spread peek beside the cover (the open-turn
    // counterpart to close-pose). The stage interpolates 0 after 90°.
    if (soloRight) {
      return -25;
    }
    if (soloLeft) {
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

export type SpreadFacePair<T> = {
  left: T | null;
  right: T | null;
};

export type FlippingSpreadFaces<T> = {
  leftPage: T | null;
  rightPage: T | null;
  flipFront: T | null;
  flipBack: T | null;
  /** Opening away from a solo cover — hide the empty leaf so the next spread cannot peek. */
  openPose: "front" | "back" | null;
};

/**
 * Stationary faces + flipping leaf contents for a spread turn.
 *
 * Incoming art belongs on the *back* of the 180° leaf. Putting it in the
 * empty cover slot (current.left ?? incoming.left) lets the T-Dome left page
 * paint beside the cover before the curl finishes.
 */
export function resolveFlippingSpreadFaces<T>({
  current,
  incoming,
  flipping,
  forward,
}: {
  current: SpreadFacePair<T>;
  incoming: SpreadFacePair<T> | null;
  flipping: boolean;
  forward: boolean;
}): FlippingSpreadFaces<T> {
  if (!flipping || !incoming) {
    return {
      leftPage: current.left,
      rightPage: current.right,
      flipFront: null,
      flipBack: null,
      openPose: null,
    };
  }

  const openingFromFront = forward && !current.left && Boolean(current.right);
  const openingFromBack = !forward && Boolean(current.left) && !current.right;

  return {
    leftPage: forward ? current.left : incoming.left,
    rightPage: forward ? incoming.right : current.right,
    flipFront: forward ? current.right : current.left,
    flipBack: forward ? incoming.left : incoming.right,
    openPose: openingFromFront ? "front" : openingFromBack ? "back" : null,
  };
}

/** Start/end rotateY for a double-sided spread leaf (degrees). */
export function spreadFlipRotateY(direction: 1 | -1): [number, number] {
  return direction > 0 ? [0, -180] : [0, 180];
}

/** Start/end rotateY for a single-page peel (degrees). */
export function singleFlipRotateY(direction: 1 | -1): [number, number] {
  return direction > 0 ? [0, -165] : [0, 165];
}
