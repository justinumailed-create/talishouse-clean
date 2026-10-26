import { describe, expect, it } from "vitest";
import { TALISU_MKTS_PINS } from "@/lib/talisu/markets-pins";
import {
  formatKmDistance,
  formatMktsDistanceListLabel,
  formatMktsDistanceRow,
  haversineDistanceKmBetween,
  parseMktsGeocodePayload,
  rankMktsPinsByDistance,
} from "@/lib/talisu/mkts-place-search";

/** Lajord, SK approximate (postal S0G 2V0 area). */
const LAJORD = { latitude: 50.2167, longitude: -104.3333 };

describe("mkts place-search distance helpers", () => {
  it("formats one-decimal kilometres", () => {
    expect(formatKmDistance(275.86)).toBe("275.9 km");
    expect(formatKmDistance(0)).toBe("0.0 km");
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
      275.9,
      { kind: "market", label: "Saskatchewan" },
      { canada: "Canada", doMore: "Do More..." },
    );
    expect(row).toBe("275.9 km • Canada Saskatchewan");
  });

  it("ranks pins nearest-first from Lajord and includes Modular Spaces", () => {
    const ranked = rankMktsPinsByDistance(TALISU_MKTS_PINS, LAJORD);
    expect(ranked.length).toBe(TALISU_MKTS_PINS.length);
    expect(ranked[0]?.pin.id).toBe("sk");
    expect(ranked.map((r) => r.pin.id)).toContain("modular-spaces");
    expect(ranked[0]?.distanceKm).toBeLessThan(ranked.at(-1)!.distanceKm);
    // SK pin is near Saskatoon (~225–320 km from Lajord); stay in a sane band.
    expect(ranked[0]?.distanceKm).toBeGreaterThan(80);
    expect(ranked[0]?.distanceKm).toBeLessThan(400);
  });

  it("computes haversine kilometres between known points", () => {
    const sk = TALISU_MKTS_PINS.find((p) => p.id === "sk")!;
    const km = haversineDistanceKmBetween(LAJORD, {
      latitude: sk.latitude,
      longitude: sk.longitude,
    });
    expect(km).toBeGreaterThan(160);
    expect(km).toBeLessThan(355);
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
