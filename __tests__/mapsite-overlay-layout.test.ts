import { describe, expect, it } from "vitest";
import {
  computeMapSiteOverlayLayout,
  MAPSITE_CLAIMED_NAV_PIN_NUDGE_Y_PX,
  MAPSITE_COMPACT_BREAKPOINT_PX,
  MAPSITE_LISTING_CARD_MAX_WIDTH_PX,
  MAPSITE_POPUP_OPEN_HEIGHT_PX,
  MAPSITE_POPUP_SAFE_TOP_PX,
  mapSiteZoomControlTop,
  placeOpenMapSiteCard,
  stickyChromeOverlap,
} from "@/lib/talispros/mapsite-overlay-layout";

describe("computeMapSiteOverlayLayout", () => {
  it("keeps the pin popup clear of the left FAST card on wide screens", () => {
    const listingRight = 16 + MAPSITE_LISTING_CARD_MAX_WIDTH_PX;
    const layout = computeMapSiteOverlayLayout({
      rootWidth: 1280,
      rootHeight: 800,
      listingTop: 64,
      listingRight,
      overlayBottom: 420,
      popupOpen: true,
    });

    expect(layout.compact).toBe(false);
    expect(layout.popupCenterX).toBeGreaterThanOrEqual(
      listingRight + 16 + MAPSITE_LISTING_CARD_MAX_WIDTH_PX / 2
    );
    expect(layout.pinOffset.x).toBe(layout.popupCenterX - 640);
    expect(layout.pinOffset.y).toBe(0);
  });

  it("stacks into compact mode below the breakpoint", () => {
    const layout = computeMapSiteOverlayLayout({
      rootWidth: MAPSITE_COMPACT_BREAKPOINT_PX - 1,
      rootHeight: 700,
      listingTop: 64,
      listingRight: 300,
      overlayBottom: 220,
      popupOpen: true,
    });

    expect(layout.compact).toBe(true);
    expect(layout.popupCenterX).toBe((MAPSITE_COMPACT_BREAKPOINT_PX - 1) / 2);
    expect(layout.pinOffset.y).toBeGreaterThan(0);
    expect(layout.alignTop).toBe(228);
  });

  it("centers the pin when the popup is closed in compact mode", () => {
    const layout = computeMapSiteOverlayLayout({
      rootWidth: 390,
      rootHeight: 800,
      listingTop: 64,
      listingRight: 360,
      overlayBottom: 180,
      popupOpen: false,
    });

    expect(layout.compact).toBe(true);
    expect(layout.pinOffset).toEqual({ x: 0, y: 0 });
  });

  it("exports a downward pin nudge so claimed cards clear the blue TalisU™ navbar", () => {
    expect(MAPSITE_CLAIMED_NAV_PIN_NUDGE_Y_PX).toBeGreaterThan(0);
  });
});

describe("placeOpenMapSiteCard", () => {
  it("keeps the open flag below sticky chrome on a desktop map", () => {
    const placed = placeOpenMapSiteCard({
      rootWidth: 1280,
      rootHeight: 691,
      chromeOverlap: 0,
      overlayBottom: 420,
      listingRight: 16 + MAPSITE_LISTING_CARD_MAX_WIDTH_PX,
      compact: false,
    });

    expect(placed.alignTop).toBe(MAPSITE_POPUP_SAFE_TOP_PX);
    expect(placed.cardHeight).toBe(MAPSITE_POPUP_OPEN_HEIGHT_PX);
    expect(placed.alignTop + placed.cardHeight).toBeLessThan(691);
    const pinY = 691 / 2 + placed.pinOffset.y;
    expect(pinY).toBeGreaterThanOrEqual(placed.alignTop + placed.cardHeight);
    expect(placed.popupCenterX).toBeGreaterThan(
      16 + MAPSITE_LISTING_CARD_MAX_WIDTH_PX,
    );
  });

  it("starts the flag below chrome that overlaps the map", () => {
    const overlap = stickyChromeOverlap(100, [
      { top: 0, bottom: 68, height: 68 },
      { top: 80, bottom: 140, height: 60 },
    ]);
    expect(overlap).toBe(40);
    const placed = placeOpenMapSiteCard({
      rootWidth: 1440,
      rootHeight: 760,
      chromeOverlap: overlap,
      overlayBottom: 400,
      listingRight: 368,
      compact: false,
    });
    expect(placed.alignTop).toBe(MAPSITE_POPUP_SAFE_TOP_PX + overlap);
  });

  it("stacks the phone flag under the left card and still below the nav", () => {
    const placed = placeOpenMapSiteCard({
      rootWidth: 390,
      rootHeight: 740,
      chromeOverlap: 0,
      overlayBottom: 180,
      listingRight: 360,
      compact: true,
    });
    expect(placed.alignTop).toBeGreaterThanOrEqual(188);
    expect(placed.alignTop + placed.cardHeight).toBeLessThanOrEqual(740);
    expect(placed.pinOffset.x).toBe(0);
  });
});

describe("mapSiteZoomControlTop", () => {
  it("keeps desktop zoom at the top right, clear of Aisha", () => {
    expect(
      mapSiteZoomControlTop({
        rootWidth: 1280,
        rootHeight: 691,
        compact: false,
        overlayBottom: 420,
        popupOpen: true,
        popupTop: 12,
        popupHeight: 420,
        popupRight: 816,
      }),
    ).toBe(12);
  });

  it("drops phone zoom below the left card and above Aisha", () => {
    const top = mapSiteZoomControlTop({
      rootWidth: 390,
      rootHeight: 740,
      compact: true,
      overlayBottom: 220,
      popupOpen: true,
      popupTop: 228,
      popupHeight: 300,
      popupRight: 195,
    });
    expect(top).toBeGreaterThanOrEqual(232);
    expect(top).toBeLessThan(740 - 176);
  });
});
