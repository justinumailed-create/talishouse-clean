import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  MapStyleManager,
  resetMapStyleManager,
  DEFAULT_MAP_STYLE_ID,
  getTileVendorId,
  isMapStyleId,
} from "../lib/talismaps/map-engine/styles";
import {
  DEFAULT_MAP_PROVIDER_ID,
  isMapProviderId,
  normalizeLegacyProviderId,
  normalizeLegacyBasemapView,
  parseMapBasemapView,
} from "../lib/talismaps/map-engine";

describe("Talismaps™ MapLibre style manager", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetMapStyleManager();
    process.env.NEXT_PUBLIC_MAPTILER_API_KEY = "YOUR_MAPTILER_API_KEY";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetMapStyleManager();
  });

  it("defaults to satellite style and MapTiler vendor", () => {
    expect(DEFAULT_MAP_STYLE_ID).toBe("satellite");
    expect(getTileVendorId()).toBe("maptiler");
    expect(DEFAULT_MAP_PROVIDER_ID === "maplibre" || isMapProviderId(DEFAULT_MAP_PROVIDER_ID)).toBe(
      true
    );
  });

  it("resolves MapTiler satellite style URL for the satellite style id", () => {
    const manager = new MapStyleManager();
    const resolved = manager.resolve("satellite");
    expect(resolved.vendor).toBe("maptiler");
    expect(resolved.styleUrl).toContain("api.maptiler.com/maps/satellite/style.json");
    expect(resolved.styleUrl).toContain("key=YOUR_MAPTILER_API_KEY");
    expect(resolved.usingPlaceholderKey).toBe(true);
  });

  it("resolves all five managed styles via MapTiler", () => {
    const manager = new MapStyleManager();
    for (const styleId of ["satellite", "street", "terrain", "light", "dark"] as const) {
      expect(isMapStyleId(styleId)).toBe(true);
      const resolved = manager.resolve(styleId);
      expect(resolved.vendor).toBe("maptiler");
      expect(resolved.styleUrl).toContain("api.maptiler.com");
      expect(resolved.styleUrl).toContain("style.json");
    }
  });

  it("honors per-style URL overrides", () => {
    process.env.NEXT_PUBLIC_TALISMAPS_STYLE_DARK =
      "https://api.maptiler.com/maps/custom-dark/style.json?key=test";
    const manager = new MapStyleManager();
    expect(manager.resolve("dark").styleUrl).toBe(
      "https://api.maptiler.com/maps/custom-dark/style.json?key=test"
    );
  });

  it("normalizes legacy provider and basemap ids", () => {
    expect(normalizeLegacyProviderId("leaflet-osm")).toBe("maplibre");
    expect(normalizeLegacyProviderId("google-maps")).toBe("google-maps");
    expect(normalizeLegacyProviderId("google")).toBe("google-maps");
    expect(normalizeLegacyBasemapView("hybrid")).toBe("satellite");
    expect(parseMapBasemapView("street")).toBe("street");
    expect(parseMapBasemapView("unknown")).toBe("satellite");
  });
});
