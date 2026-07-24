import { describe, expect, it } from "vitest";
import {
  computeMapSiteOverlayLayout,
  MAPSITE_COMPACT_BREAKPOINT_PX,
  MAPSITE_LISTING_CARD_MAX_WIDTH_PX,
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
});
