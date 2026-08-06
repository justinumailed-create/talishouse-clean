/** Max card width — matches `w-[min(92vw,22rem)]` (22rem ≈ 352px). */
export const MAPSITE_LISTING_CARD_MAX_WIDTH_PX = 352;

/** Horizontal inset used by the left overlay stack. */
export const MAPSITE_OVERLAY_INSET_PX = 16;

/** Gap between the FAST card and the pin popup when side-by-side. */
export const MAPSITE_OVERLAY_GAP_PX = 16;

/** Tip triangle under the pin popup (~12px border). */
export const MAPSITE_POPUP_TIP_HEIGHT_PX = 12;

/** Keep the pin body clear of the tip. */
export const MAPSITE_PIN_TIP_CLEARANCE_PX = 40;

export const MAPSITE_MIN_CARD_HEIGHT_PX = 148;

/**
 * Below this width, stack the FAST card above the map/pin card
 * instead of placing them side-by-side.
 */
export const MAPSITE_COMPACT_BREAKPOINT_PX = 900;

export interface MapSiteOverlayLayoutInput {
  rootWidth: number;
  rootHeight: number;
  /** Top of the FAST listing card relative to the root. */
  listingTop: number;
  /** Right edge of the FAST listing card relative to the root. */
  listingRight: number;
  /** Bottom of the left overlay stack (search + card + payment) relative to the root. */
  overlayBottom: number;
  popupOpen: boolean;
}

export interface MapSiteOverlayLayout {
  compact: boolean;
  alignTop: number;
  cardHeight: number;
  /** CSS `left` for the pin popup (center via translateX -50%). */
  popupCenterX: number;
  /** Pixel offset from viewport center where the locked pin should sit. */
  pinOffset: { x: number; y: number };
}

function cardWidthFor(rootWidth: number): number {
  return Math.min(rootWidth * 0.92, MAPSITE_LISTING_CARD_MAX_WIDTH_PX);
}

/**
 * Computes Mapsite™ overlay positions so the FAST card and pin popup
 * do not overlap, and the map pin sits under the popup tip.
 */
export function computeMapSiteOverlayLayout(
  input: MapSiteOverlayLayoutInput
): MapSiteOverlayLayout {
  const {
    rootWidth,
    rootHeight,
    listingTop,
    listingRight,
    overlayBottom,
    popupOpen,
  } = input;

  const width = Math.max(0, rootWidth);
  const height = Math.max(0, rootHeight);
  const cardW = cardWidthFor(width);
  const inset = Math.min(MAPSITE_OVERLAY_INSET_PX, Math.max(8, width * 0.03));

  const sideBySideMinWidth =
    inset + cardW + MAPSITE_OVERLAY_GAP_PX + cardW + inset;
  const compact =
    width < MAPSITE_COMPACT_BREAKPOINT_PX || width < sideBySideMinWidth;

  if (compact) {
    if (!popupOpen) {
      return {
        compact: true,
        alignTop: Math.max(0, listingTop),
        cardHeight: MAPSITE_MIN_CARD_HEIGHT_PX,
        popupCenterX: width / 2,
        pinOffset: { x: 0, y: 0 },
      };
    }

    const alignTop = Math.max(8, overlayBottom + 8);
    const maxPinY = height - 28;
    const maxCardHeight = Math.max(
      MAPSITE_MIN_CARD_HEIGHT_PX,
      maxPinY -
        MAPSITE_PIN_TIP_CLEARANCE_PX -
        MAPSITE_POPUP_TIP_HEIGHT_PX -
        alignTop
    );
    const cardHeight = Math.min(300, maxCardHeight);
    const tipY = alignTop + cardHeight;
    const pinY = Math.min(
      maxPinY,
      tipY + MAPSITE_POPUP_TIP_HEIGHT_PX + 8
    );

    return {
      compact: true,
      alignTop: Math.round(alignTop),
      cardHeight: Math.round(cardHeight),
      popupCenterX: width / 2,
      pinOffset: {
        x: 0,
        y: Math.round(pinY - height / 2),
      },
    };
  }

  const alignTop = Math.max(0, listingTop);
  const tipY = height / 2 - MAPSITE_PIN_TIP_CLEARANCE_PX;
  const cardHeight = Math.max(MAPSITE_MIN_CARD_HEIGHT_PX, tipY - alignTop);

  const idealCenterX = width / 2;
  const minCenterX =
    listingRight + MAPSITE_OVERLAY_GAP_PX + cardW / 2;
  const maxCenterX = width - inset - cardW / 2;
  const popupCenterX = Math.min(
    Math.max(idealCenterX, minCenterX),
    Math.max(minCenterX, maxCenterX)
  );

  return {
    compact: false,
    alignTop,
    cardHeight,
    popupCenterX: Math.round(popupCenterX),
    pinOffset: {
      x: Math.round(popupCenterX - width / 2),
      y: 0,
    },
  };
}
