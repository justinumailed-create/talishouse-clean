import { describe, expect, it } from "vitest";
import {
  buildNearbyListings,
  estimateDrivingTimeMinutes,
  formatDistanceKm,
  haversineDistanceKm,
} from "../lib/mapsite/visitor-location";
import type { TalisMapsPin } from "../lib/talismaps";

const samplePin = (id: string, latitude: number, longitude: number): TalisMapsPin => ({
  id,
  name: `Property ${id}`,
  description: "",
  categoryId: null,
  categorySlug: null,
  categoryName: null,
  categoryColor: "#6B7280",
  latitude,
  longitude,
  address: "",
  city: "",
  province: "",
  postalCode: "",
  country: "",
  website: "",
  phone: "",
  email: "",
  featured: false,
  sortOrder: 0,
});

describe("visitor-location", () => {
  it("computes haversine distance between two coordinates", () => {
    const distance = haversineDistanceKm(
      { latitude: 43.6532, longitude: -79.3832 },
      { latitude: 43.6426, longitude: -79.3871 }
    );

    expect(distance).toBeGreaterThan(1);
    expect(distance).toBeLessThan(2);
  });

  it("ranks nearby listings by distance from the visitor", () => {
    const visitor = { latitude: 43.6532, longitude: -79.3832 };
    const listings = buildNearbyListings(
      [
        samplePin("far", 43.7, -79.5),
        samplePin("near", 43.655, -79.385),
      ],
      visitor
    );

    expect(listings).toHaveLength(2);
    expect(listings[0]?.pin.id).toBe("near");
    expect(listings[0]?.distanceFromVisitor).toBeLessThan(
      listings[1]!.distanceFromVisitor
    );
    expect(listings[0]?.estimatedDrivingTime).toBeGreaterThan(0);
  });

  it("formats short distances and driving time estimates", () => {
    expect(formatDistanceKm(0.42)).toBe("420 m");
    expect(formatDistanceKm(2.4)).toBe("2.4 km");
    expect(estimateDrivingTimeMinutes(4.5)).toBeGreaterThan(0);
  });
});
