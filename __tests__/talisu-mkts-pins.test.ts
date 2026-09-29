import { describe, expect, it } from "vitest";
import {
  TALISU_MKTS_DEMO_HREF,
  TALISU_MKTS_PINS,
  talisuMktsDoMorePins,
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
});
