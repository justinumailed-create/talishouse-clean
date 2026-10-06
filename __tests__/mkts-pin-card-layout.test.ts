import { describe, expect, it } from "vitest";
import {
  computeMktsPinCardPlacement,
  MKTS_PIN_CARD_EST_HEIGHT_PX,
  MKTS_PIN_CARD_MAX_WIDTH_PX,
  MKTS_PIN_CARD_MIN_TOP_PX,
  MKTS_PIN_CARD_TIP_HEIGHT_PX,
} from "@/lib/talisu/mkts-pin-card-layout";

describe("computeMktsPinCardPlacement", () => {
  it("anchors the card above a mid-viewport pin", () => {
    const layout = computeMktsPinCardPlacement({
      pinX: 640,
      pinY: 450,
      rootWidth: 1280,
      rootHeight: 800,
      cardHeight: MKTS_PIN_CARD_EST_HEIGHT_PX,
    });

    expect(layout.placement).toBe("above");
    expect(layout.left).toBe(640);
    expect(layout.top).toBeGreaterThanOrEqual(MKTS_PIN_CARD_MIN_TOP_PX);
    // Tip sits above the pin centre (minus radius + gap).
    expect(layout.top + MKTS_PIN_CARD_EST_HEIGHT_PX + MKTS_PIN_CARD_TIP_HEIGHT_PX).toBeLessThan(
      450,
    );
  });

  it("flips the card below when the pin is near the top (navbar seam)", () => {
    const layout = computeMktsPinCardPlacement({
      pinX: 640,
      pinY: 80,
      rootWidth: 1280,
      rootHeight: 800,
      cardHeight: MKTS_PIN_CARD_EST_HEIGHT_PX,
    });

    expect(layout.placement).toBe("below");
    expect(layout.top).toBeGreaterThan(80);
    expect(layout.top).toBeGreaterThanOrEqual(MKTS_PIN_CARD_MIN_TOP_PX);
  });

  it("keeps the card fully below the map top even when space is tight", () => {
    const layout = computeMktsPinCardPlacement({
      pinX: 200,
      pinY: 40,
      rootWidth: 400,
      rootHeight: 360,
      cardHeight: MKTS_PIN_CARD_EST_HEIGHT_PX,
    });

    expect(layout.top).toBeGreaterThanOrEqual(MKTS_PIN_CARD_MIN_TOP_PX);
  });

  it("clamps horizontal centre so a wide card stays on-screen", () => {
    const layout = computeMktsPinCardPlacement({
      pinX: 10,
      pinY: 400,
      rootWidth: 500,
      rootHeight: 800,
      cardWidth: MKTS_PIN_CARD_MAX_WIDTH_PX,
    });

    const half = Math.min(MKTS_PIN_CARD_MAX_WIDTH_PX, 500 * 0.92) / 2;
    expect(layout.left).toBeGreaterThanOrEqual(8 + half - 0.5);
    expect(layout.left).toBeLessThan(250);
  });
});
