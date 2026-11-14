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

/** Extra downward pin shift when the blue TalisU™ navbar is present (claimed Mapsites). */
export const MAPSITE_CLAIMED_NAV_PIN_NUDGE_Y_PX = 72;

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
 * Computes Mapsite overlay positions so the FAST card and pin popup
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

/** Open flag height that keeps the photo, title, and resource buttons. */
export const MAPSITE_POPUP_OPEN_HEIGHT_PX = 420;

/** Gap between the map's top edge and the open flag. */
export const MAPSITE_POPUP_SAFE_TOP_PX = 12;

/** Two zoom buttons plus the gap between them. */
export const MAPSITE_ZOOM_BUTTON_STACK_PX = 96;

/**
 * Room above the bottom of the map so zoom stays clear of Aisha.
 * Her bubble sits above the call pill, so this is taller than the pill alone.
 */
export const MAPSITE_ZOOM_AISHA_CLEARANCE_PX = 200;

/** Width of the zoom rail measured from the right edge of the map. */
export const MAPSITE_ZOOM_RAIL_PX = 64;

export interface ChromeBarRect {
  top: number;
  bottom: number;
  height: number;
}

/**
 * How far sticky header or nav bars extend into the map.
 * Bars that sit fully above the map contribute nothing.
 */
export function stickyChromeOverlap(rootTop: number, bars: readonly ChromeBarRect[]): number {
  let overlap = 0;
  for (const bar of bars) {
    if (bar.height < 8) continue;
    if (bar.top <= rootTop + 1 && bar.bottom > rootTop + 1) {
      overlap = Math.max(overlap, bar.bottom - rootTop);
    }
  }
  return Math.max(0, Math.round(overlap));
}

export interface OpenMapSiteCardPlacement {
  alignTop: number;
  cardHeight: number;
  popupCenterX: number;
  pinOffset: { x: number; y: number };
}

function popupCenterXFor(
  width: number,
  listingRight: number,
  compact: boolean,
): number {
  if (compact) return Math.round(width / 2);
  const cardW = cardWidthFor(width);
  const inset = Math.min(MAPSITE_OVERLAY_INSET_PX, Math.max(8, width * 0.03));
  const ideal = width / 2;
  const minCenter = listingRight + MAPSITE_OVERLAY_GAP_PX + cardW / 2;
  const maxCenter = width - inset - cardW / 2;
  return Math.round(Math.min(Math.max(ideal, minCenter), Math.max(minCenter, maxCenter)));
}

/**
 * Places the open flag fully inside the visible map, below any sticky
 * chrome that overlaps it, and pans the pin to the tip.
 * On a short map the flag shrinks from the bottom so the photo stays in view.
 * When a compact stack leaves no room underneath, the flag sits at the safe top.
 */
export function placeOpenMapSiteCard(input: {
  rootWidth: number;
  rootHeight: number;
  chromeOverlap: number;
  overlayBottom: number;
  listingRight: number;
  compact: boolean;
}): OpenMapSiteCardPlacement {
  const width = Math.max(0, input.rootWidth);
  const height = Math.max(0, input.rootHeight);
  const safeTop = MAPSITE_POPUP_SAFE_TOP_PX + Math.max(0, input.chromeOverlap);
  const maxPinY = Math.max(safeTop + 80, height - 28);
  const overhead = MAPSITE_POPUP_TIP_HEIGHT_PX + MAPSITE_PIN_TIP_CLEARANCE_PX;

  let alignTop = safeTop;
  if (input.compact) {
    const stackedTop = Math.max(safeTop, input.overlayBottom + 8);
    const stackedRoom = maxPinY - overhead - stackedTop;
    alignTop = stackedRoom >= 200 ? stackedTop : safeTop;
  }

  const room = Math.max(0, maxPinY - overhead - alignTop);
  const cardHeight = Math.round(Math.min(MAPSITE_POPUP_OPEN_HEIGHT_PX, Math.max(room, 0)));
  const pinY = Math.min(maxPinY, alignTop + cardHeight + overhead);
  const popupCenterX = popupCenterXFor(width, input.listingRight, input.compact);

  return {
    alignTop: Math.round(alignTop),
    cardHeight: Math.max(0, cardHeight),
    popupCenterX,
    pinOffset: {
      x: input.compact ? 0 : Math.round(popupCenterX - width / 2),
      y: Math.round(pinY - height / 2),
    },
  };
}

/**
 * Zoom sits at the top right on a wide map, clear of the left card.
 * On a phone it drops below the left card, and it never sits on Aisha.
 * If the open flag reaches the right rail, the buttons move under the flag.
 */
export function mapSiteZoomControlTop(input: {
  rootWidth: number;
  rootHeight: number;
  compact: boolean;
  overlayBottom: number;
  popupOpen: boolean;
  popupTop: number;
  popupHeight: number;
  popupRight: number;
}): number {
  const maxTop = Math.max(
    12,
    input.rootHeight - MAPSITE_ZOOM_AISHA_CLEARANCE_PX - MAPSITE_ZOOM_BUTTON_STACK_PX,
  );
  const clamp = (top: number) => Math.round(Math.min(Math.max(12, top), maxTop));

  if (input.compact) {
    // The left column is full height on a phone. Sit under the open flag,
    // which leaves a gap above Aisha, instead of following that tall column.
    const below = input.popupOpen
      ? input.popupTop + input.popupHeight + 4
      : input.overlayBottom + 12;
    return clamp(below);
  }

  const railLeft = input.rootWidth - MAPSITE_ZOOM_RAIL_PX;
  if (input.popupOpen && input.popupRight > railLeft - 8) {
    return clamp(input.popupTop + input.popupHeight + 12);
  }
  return 12;
}
