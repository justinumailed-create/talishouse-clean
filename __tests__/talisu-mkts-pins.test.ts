import { describe, expect, it } from "vitest";
import {
  TALISU_MKTS_DEMO_HREF,
  TALISU_MKTS_DO_MORE_PIN_SIZE,
  TALISU_MKTS_FIT_PADDING,
  TALISU_MKTS_FLAG_CA,
  TALISU_MKTS_MARKET_PIN_SIZE,
  TALISU_MKTS_PINS,
  TALISU_MKTS_START_FIT_PADDING,
  TALISU_MKTS_TREE_LOGO,
  TALISU_MKTS_VIEWPORT,
  talisuMktsDoMorePins,
  talisuMktsMapCoordinates,
  talisuMktsMarketPins,
  talisuMktsToEnginePins,
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
      "Talishouse™ Modular Spaces",
    ]);
    expect(doMore.find((p) => p.id === "modular-spaces")?.nextHref).toBe(
      "/catalogue"
    );
  });

  it("exposes 16 total pins (15 Canada markets + Modular Spaces)", () => {
    expect(TALISU_MKTS_PINS).toHaveLength(16);
  });

  it("uses authentic Atlist circular Canada-flag and a tight tree pin asset", () => {
    expect(TALISU_MKTS_FLAG_CA).toBe("/talisu/mkts/atlist-canada-flag-pin.png");
    expect(TALISU_MKTS_TREE_LOGO).toBe("/talisu/mkts/talispros-tree-logo.svg");
  });

  it("defaults to a full-Canada viewport and fitBounds padding for the sidebar", () => {
    expect(TALISU_MKTS_VIEWPORT.center.longitude).toBeLessThan(-90);
    expect(TALISU_MKTS_VIEWPORT.zoom).toBeLessThan(4.2);
    expect(TALISU_MKTS_FIT_PADDING.left).toBeGreaterThanOrEqual(300);
    const coords = talisuMktsMapCoordinates();
    expect(coords.length).toBe(16);
    const lngs = coords.map((c) => c.longitude);
    expect(Math.min(...lngs)).toBeLessThan(-130); // Yukon
    expect(Math.max(...lngs)).toBeGreaterThan(-60); // NL
  });

  it("maps engine pins without Marketing/Adpro; Do More size is 58", () => {
    const engine = talisuMktsToEnginePins();
    const ids = engine.map((p) => p.id);
    expect(ids).toHaveLength(16);
    expect(ids).toContain("modular-spaces");
    expect(ids).not.toContain("add-marketing-pins");
    expect(ids).not.toContain("add-adpro-sites");
    expect(TALISU_MKTS_MARKET_PIN_SIZE).toBe(41);
    expect(TALISU_MKTS_DO_MORE_PIN_SIZE).toBe(58);
    const modular = engine.find((p) => p.id === "modular-spaces");
    expect(modular?.metadata?.pinSize).toBe(58);
    const market = engine.find((p) => p.id === "ns");
    expect(market?.metadata?.pinSize).toBe(41);
    expect(TALISU_MKTS_START_FIT_PADDING.left).toBeLessThan(100);
  });
});
