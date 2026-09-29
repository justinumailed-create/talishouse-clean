import { describe, expect, it } from "vitest";
import {
  TALISU_MKTS_DEMO_HREF,
  TALISU_MKTS_FIT_PADDING,
  TALISU_MKTS_FLAG_CA,
  TALISU_MKTS_PINS,
  TALISU_MKTS_TREE_LOGO,
  TALISU_MKTS_VIEWPORT,
  talisuMktsDoMorePins,
  talisuMktsMapCoordinates,
  talisuMktsMarketPins,
} from "@/lib/talisu/markets-pins";

describe("TalisU mkts Atlist pin export", () => {
  it("has 15 Canada market pins with flag-ready coords from live Atlist", () => {
    const markets = talisuMktsMarketPins();
    expect(markets).toHaveLength(15);
    const ns = markets.find((p) => p.id === "ns");
    expect(ns?.label).toBe("Nova Scotia");
    expect(ns?.latitude).toBeCloseTo(45.0778473, 5);
    expect(ns?.longitude).toBeCloseTo(-63.5466822, 5);
    expect(ns?.nextHref).toBe(TALISU_MKTS_DEMO_HREF);
    expect(ns?.nextLabel).toBe("Next Step...");
    expect(ns?.heroImageUrl).toContain("PIN-Map-1920L");
  });

  it("routes every market Next Step to the Demo path", () => {
    for (const pin of talisuMktsMarketPins()) {
      expect(pin.nextHref).toBe("/talisu/demo");
    }
  });

  it("includes Do More sidebar actions with Modular Spaces → catalogue", () => {
    const doMore = talisuMktsDoMorePins();
    expect(doMore.map((p) => p.label)).toEqual([
      "Add Marketing PINs",
      "Add Adpro Sites",
      "TalisU™ Modular Spaces",
    ]);
    expect(doMore.find((p) => p.id === "modular-spaces")?.nextHref).toBe(
      "/catalogue"
    );
  });

  it("exposes 18 total pins matching the Atlist map marker count", () => {
    expect(TALISU_MKTS_PINS).toHaveLength(18);
  });

  it("uses authentic Atlist circular Canada-flag and tree pin assets", () => {
    expect(TALISU_MKTS_FLAG_CA).toBe("/talisu/mkts/atlist-canada-flag-pin.png");
    expect(TALISU_MKTS_TREE_LOGO).toBe("/talisu/mkts/atlist-talisu-tree-pin.png");
  });

  it("defaults to a full-Canada viewport and fitBounds padding for the sidebar", () => {
    expect(TALISU_MKTS_VIEWPORT.center.longitude).toBeLessThan(-90);
    expect(TALISU_MKTS_VIEWPORT.zoom).toBeLessThan(4.2);
    expect(TALISU_MKTS_FIT_PADDING.left).toBeGreaterThanOrEqual(300);
    const coords = talisuMktsMapCoordinates();
    expect(coords.length).toBe(18);
    const lngs = coords.map((c) => c.longitude);
    expect(Math.min(...lngs)).toBeLessThan(-130); // Yukon
    expect(Math.max(...lngs)).toBeGreaterThan(-60); // NL
  });
});
