import { describe, expect, it } from "vitest";
import { TALISU_MKTS_PINS } from "@/lib/talisu/markets-pins";
import {
  formatMilesDistance,
  formatMktsDistanceListLabel,
  formatMktsDistanceRow,
  haversineDistanceMiles,
  parseMktsGeocodePayload,
  rankMktsPinsByDistance,
} from "@/lib/talisu/mkts-place-search";

/** Lajord, SK approximate (postal S0G 2V0 area). */
const LAJORD = { latitude: 50.2167, longitude: -104.3333 };

describe("mkts place-search distance helpers", () => {
  it("formats Atlist-style one-decimal miles", () => {
    expect(formatMilesDistance(171.41)).toBe("171.4 Miles");
    expect(formatMilesDistance(0)).toBe("0.0 Miles");
  });

  it("builds Canada / Do More list labels like Atlist", () => {
    const opts = { canada: "Canada", doMore: "Do More..." };
    expect(
      formatMktsDistanceListLabel(
        { kind: "market", label: "Saskatchewan" },
        opts,
      ),
    ).toBe("Canada Saskatchewan");
    expect(
      formatMktsDistanceListLabel(
        { kind: "do-more", label: "Talishouse™ Modular Spaces" },
        opts,
      ),
    ).toBe("Do More... Talishouse™ Modular Spaces");
  });

  it("formats a full distance row", () => {
    const row = formatMktsDistanceRow(
      171.4,
      { kind: "market", label: "Saskatchewan" },
      { canada: "Canada", doMore: "Do More..." },
    );
    expect(row).toBe("171.4 Miles • Canada Saskatchewan");
  });

  it("ranks pins nearest-first from Lajord and includes Modular Spaces", () => {
    const ranked = rankMktsPinsByDistance(TALISU_MKTS_PINS, LAJORD);
    expect(ranked.length).toBe(TALISU_MKTS_PINS.length);
    expect(ranked[0]?.pin.id).toBe("sk");
    expect(ranked.map((r) => r.pin.id)).toContain("modular-spaces");
    expect(ranked[0]?.distanceMiles).toBeLessThan(ranked.at(-1)!.distanceMiles);
    // SK pin is near Saskatoon (~140–200 mi from Lajord); stay in a sane band.
    expect(ranked[0]?.distanceMiles).toBeGreaterThan(50);
    expect(ranked[0]?.distanceMiles).toBeLessThan(250);
  });

  it("computes haversine miles between known points", () => {
    const sk = TALISU_MKTS_PINS.find((p) => p.id === "sk")!;
    const miles = haversineDistanceMiles(LAJORD, {
      latitude: sk.latitude,
      longitude: sk.longitude,
    });
    expect(miles).toBeGreaterThan(100);
    expect(miles).toBeLessThan(220);
  });

  it("parses geocode API payloads", () => {
    expect(
      parseMktsGeocodePayload(
        {
          found: true,
          latitude: "50.2",
          longitude: "-104.3",
          address: "Lajord, SK",
        },
        "fallback",
      ),
    ).toEqual({
      latitude: 50.2,
      longitude: -104.3,
      label: "Lajord, SK",
    });
    expect(parseMktsGeocodePayload({ found: false }, "x")).toBeNull();
    expect(
      parseMktsGeocodePayload(
        { found: true, latitude: "999", longitude: "0" },
        "x",
      ),
    ).toBeNull();
  });
});
