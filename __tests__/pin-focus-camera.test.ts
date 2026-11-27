import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  additionalPinCardCopy,
  cameraCenterForScreenOffset,
  PIN_FOCUS_MAX_ZOOM,
  PIN_FOCUS_MIN_ZOOM,
  PIN_FOCUS_ZOOM_STEP,
  pinFocusZoom,
} from "../lib/talismaps/map-engine/pin-focus-camera";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("pin focus camera", () => {
  it("steps four zoom levels, stays at least 15, and stops at the satellite cap", () => {
    expect(PIN_FOCUS_ZOOM_STEP).toBe(4);
    expect(PIN_FOCUS_MIN_ZOOM).toBe(15);
    expect(PIN_FOCUS_MAX_ZOOM).toBe(19);
    // Old step of 2: 12 -> 14, 13 -> 15, 15 -> 17, 18 -> 19.
    // New step of 4 plus a floor of 15: tighter on the clicked pin.
    expect(pinFocusZoom(9)).toBe(15);  // was 11 (wide auto-fit)
    expect(pinFocusZoom(11)).toBe(15); // was 13
    expect(pinFocusZoom(12)).toBe(16); // was 14
    expect(pinFocusZoom(13)).toBe(17); // was 15
    expect(pinFocusZoom(15)).toBe(19); // was 17
    expect(pinFocusZoom(18)).toBe(19);
    expect(pinFocusZoom(19)).toBe(19);
  });

  it("moves the camera north when the pin must sit below center", () => {
    const pin = { latitude: 45.66, longitude: -60.7 };
    const center = cameraCenterForScreenOffset(pin, 14, { x: 0, y: 220 });
    expect(center.latitude).toBeGreaterThan(pin.latitude);
    expect(Math.abs(center.longitude - pin.longitude)).toBeLessThan(0.01);
    expect(cameraCenterForScreenOffset(pin, 14, { x: 0, y: 0 })).toEqual(pin);
  });

  it("uses the extra pin's own address, and does not invent PIN 3", () => {
    expect(
      additionalPinCardCopy({
        label: "342 Eskasoni Rd., Northside East Bay, NS",
        latitude: 46.02,
        longitude: -60.37,
      }),
    ).toEqual({
      title: "342 Eskasoni Rd.",
      detail: "Northside East Bay, NS",
      untitled: false,
    });
    expect(
      additionalPinCardCopy({ label: "  ", latitude: 45.66173, longitude: -60.70351 }).title,
    ).toBe("Pinned location");
  });

  it("opens the clicked pin and pans a multi-pin map to the card tip", () => {
    const app = read("components/talispros/mapsite/MapSiteApplication.tsx");
    expect(app).toContain("setSelectedPinId(pinId)");
    expect(app).toContain("partnerPins.some((pin) => pin.id === pinId)");
    expect(app).toContain("cameraCenterForScreenOffset");
    expect(app).toContain("pinFocusZoom");
    expect(app).toContain("setSelectedPinId(mapsite.id)");
    const provider = read("lib/talismaps/map-engine/providers/google-maps-provider.ts");
    expect(provider).toContain("map.panTo");
    expect(provider).toContain("if (lockedCenter)");
  });
});
