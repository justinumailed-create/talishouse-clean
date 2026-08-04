import { describe, expect, it } from "vitest";
import {
  mergePmcPinDefaults,
  pmcPinsByRegionGroup,
  pmcPinsToMapEnginePins,
  PMC_DEFAULT_REGIONAL_PINS,
  visiblePmcPins,
} from "@/lib/talispros/pmc-regional-pins";

describe("pmc-regional-pins", () => {
  it("includes Canada provinces and USA", () => {
    const canada = pmcPinsByRegionGroup([...PMC_DEFAULT_REGIONAL_PINS], "canada");
    const usa = pmcPinsByRegionGroup([...PMC_DEFAULT_REGIONAL_PINS], "usa");
    // 15 provinces/territories + Canada Corporate Market
    expect(canada.length).toBe(16);
    expect(canada.some((pin) => pin.id === "ca-corporate")).toBe(true);
    // National USA pin + 10 regional Corporate Market pins
    expect(usa).toHaveLength(11);
    expect(usa.some((pin) => pin.id === "usa")).toBe(true);
  });

  it("maps visible pins to map-engine markers with flag logos", () => {
    const enginePins = pmcPinsToMapEnginePins([...PMC_DEFAULT_REGIONAL_PINS]);
    expect(enginePins).toHaveLength(visiblePmcPins([...PMC_DEFAULT_REGIONAL_PINS]).length);
    expect(enginePins.every((pin) => pin.metadata?.customLogoUrl)).toBe(true);
    expect(enginePins.every((pin) => pin.metadata?.whiteCenter === true)).toBe(
      true
    );
  });

  it("merges admin overrides onto defaults", () => {
    const merged = mergePmcPinDefaults([
      { id: "ns", label: "Nova Scotia East", latitude: 44.6, visible: false },
    ]);
    const ns = merged.find((pin) => pin.id === "ns");
    expect(ns?.label).toBe("Nova Scotia East");
    expect(ns?.latitude).toBe(44.6);
    expect(ns?.visible).toBe(false);
    expect(ns?.country).toBe("CA");
  });
});
