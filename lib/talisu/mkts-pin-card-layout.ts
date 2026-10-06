/**
 * Placement for the /talisu/mkts pin info card.
 * Card tracks the clicked pin's screen position and never clips under the
 * map's top edge (the seam under the sticky blue TalisU™ navbar).
 */

/** Matches `w-[min(92vw,20rem)]` on the markets pin card. */
export const MKTS_PIN_CARD_MAX_WIDTH_PX = 320;

/** Tip triangle under/above the card (~12px border). */
export const MKTS_PIN_CARD_TIP_HEIGHT_PX = 12;

/** Gap between tip tip and the pin body. */
export const MKTS_PIN_CARD_GAP_PX = 10;

/** Keep the card fully below the map top / navbar seam. */
export const MKTS_PIN_CARD_MIN_TOP_PX = 8;

/** Horizontal / bottom inset from the map root. */
export const MKTS_PIN_CARD_EDGE_PAD_PX = 8;

/**
 * Conservative card body height (hero h-36 + copy + CTA) used before measure.
 * Actual layout remeasures after mount.
 */
export const MKTS_PIN_CARD_EST_HEIGHT_PX = 292;

/** Half of the largest mkts pin (Do More 58px) — tip aims at pin centre. */
export const MKTS_PIN_CARD_DEFAULT_PIN_RADIUS_PX = 29;

export type MktsPinCardPlacementMode = "above" | "below";

export type MktsPinCardPlacementInput = {
  /** Pin centre X relative to the map root. */
  pinX: number;
  /** Pin centre Y relative to the map root. */
  pinY: number;
  rootWidth: number;
  rootHeight: number;
  cardWidth?: number;
  /** Card body height only (excludes tip). */
  cardHeight?: number;
  tipHeight?: number;
  gap?: number;
  minTop?: number;
  edgePad?: number;
  /** Distance from pin centre to the edge the tip should clear. */
  pinRadius?: number;
};

export type MktsPinCardPlacement = {
  /** CSS `left` for the card wrapper (centre via translateX -50%). */
  left: number;
  /** CSS `top` for the card wrapper. */
  top: number;
  /** Tip points down at the pin (`above`) or up at the pin (`below`). */
  placement: MktsPinCardPlacementMode;
};

function clamp(n: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(n, min), max);
}

/**
 * Prefer the card above the pin (tip down). When that would clip under the
 * navbar / map top, flip the card below the pin (tip up) so it stays fully
 * visible. The pin's geographic / marker position is never shifted.
 */
export function computeMktsPinCardPlacement(
  input: MktsPinCardPlacementInput,
): MktsPinCardPlacement {
  const rootWidth = Math.max(0, input.rootWidth);
  const rootHeight = Math.max(0, input.rootHeight);
  const tipHeight = input.tipHeight ?? MKTS_PIN_CARD_TIP_HEIGHT_PX;
  const gap = input.gap ?? MKTS_PIN_CARD_GAP_PX;
  const minTop = input.minTop ?? MKTS_PIN_CARD_MIN_TOP_PX;
  const edgePad = input.edgePad ?? MKTS_PIN_CARD_EDGE_PAD_PX;
  const pinRadius =
    input.pinRadius ?? MKTS_PIN_CARD_DEFAULT_PIN_RADIUS_PX;
  const cardWidth = Math.min(
    input.cardWidth ?? MKTS_PIN_CARD_MAX_WIDTH_PX,
    Math.max(0, rootWidth * 0.92),
  );
  const cardHeight = input.cardHeight ?? MKTS_PIN_CARD_EST_HEIGHT_PX;

  const halfW = cardWidth / 2;
  const left = Math.round(
    clamp(input.pinX, edgePad + halfW, rootWidth - edgePad - halfW),
  );

  const aboveTop =
    input.pinY - pinRadius - gap - tipHeight - cardHeight;
  const belowTop = input.pinY + pinRadius + gap;

  if (aboveTop >= minTop) {
    return {
      left,
      top: Math.round(aboveTop),
      placement: "above",
    };
  }

  const belowBottom = belowTop + tipHeight + cardHeight;
  if (belowBottom <= rootHeight - edgePad) {
    return {
      left,
      top: Math.round(belowTop),
      placement: "below",
    };
  }

  // Not enough room above or below — keep clear of the navbar and clamp
  // within the map so the card stays fully visible.
  const clampedTop = clamp(
    minTop,
    minTop,
    Math.max(minTop, rootHeight - edgePad - tipHeight - cardHeight),
  );
  return {
    left,
    top: Math.round(clampedTop),
    placement: "above",
  };
}
