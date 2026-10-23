import { describe, expect, it } from "vitest";
import { TALISU_MKTS_PINS } from "@/lib/talisu/markets-pins";
import {
  fitMktsViewport,
  spreadMktsPins,
  TALISU_MKTS_MOBILE_DO_MORE_PIN_SIZE,
  TALISU_MKTS_MOBILE_MARKET_PIN_SIZE,
} from "@/lib/talisu/mkts-mobile-layout";

const shown = TALISU_MKTS_PINS.filter((pin) => pin.showOnMap);
const px = (lat: number, lng: number, zoom: number) => {
  const world = 256 * 2 ** zoom;
  const s = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * world,
    y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * world,
  };
};

describe("mkts phone layout", () => {
  it("fits the Canadian pins to a 390×490 phone map well above world zoom", () => {
    const fit = fitMktsViewport(shown, 390, 490)!;
    expect(fit.zoom).toBeGreaterThan(2.2);
    expect(fit.center.longitude).toBeGreaterThan(-110);
    expect(fit.center.longitude).toBeLessThan(-80);
    // Every pin lands inside the container.
    const c = px(fit.center.latitude, fit.center.longitude, fit.zoom);
    for (const pin of shown) {
      const p = px(pin.latitude, pin.longitude, fit.zoom);
      expect(Math.abs(p.x - c.x)).toBeLessThanOrEqual(195);
      expect(Math.abs(p.y - c.y)).toBeLessThanOrEqual(245);
    }
  });

  it("spreads pins so none overlap at the phone fit zoom", () => {
    const fit = fitMktsViewport(shown, 390, 490)!;
    const input = shown.map((pin) => ({
      id: pin.id,
      latitude: pin.latitude,
      longitude: pin.longitude,
      size:
        pin.kind === "do-more"
          ? TALISU_MKTS_MOBILE_DO_MORE_PIN_SIZE
          : TALISU_MKTS_MOBILE_MARKET_PIN_SIZE,
    }));
    const out = spreadMktsPins(input, fit.zoom);
    const pts = input.map((pin) => {
      const p = out.get(pin.id)!;
      return { ...px(p.latitude, p.longitude, fit.zoom), size: pin.size };
    });
    for (let i = 0; i < pts.length; i += 1) {
      for (let j = i + 1; j < pts.length; j += 1) {
        const d = Math.hypot(pts[i]!.x - pts[j]!.x, pts[i]!.y - pts[j]!.y);
        expect(d).toBeGreaterThanOrEqual(
          (pts[i]!.size + pts[j]!.size) / 2 - 0.5,
        );
      }
    }
  });

  it("leaves pins in place when zoomed in far enough", () => {
    const input = shown.map((pin) => ({ ...pin, size: 32 }));
    const out = spreadMktsPins(input, 9);
    for (const pin of shown) {
      expect(out.get(pin.id)!.latitude).toBeCloseTo(pin.latitude, 6);
    }
  });
});
