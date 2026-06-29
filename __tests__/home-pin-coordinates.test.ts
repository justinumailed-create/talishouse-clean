import { describe, it, expect } from "vitest";
import {
  parseCoordinatePaste,
  isValidLatitude,
  isValidLongitude,
  hasValidCoordinates,
  formatCoordinate,
} from "../lib/home-pin-coordinates";

describe("home-pin-coordinates", () => {
  it("parses comma-separated coordinate pairs", () => {
    expect(parseCoordinatePaste("46.088287, -59.882749")).toEqual({
      latitude: "46.088287",
      longitude: "-59.882749",
    });
  });

  it("parses space-separated coordinate pairs", () => {
    expect(parseCoordinatePaste("46.088287 -59.882749")).toEqual({
      latitude: "46.088287",
      longitude: "-59.882749",
    });
  });

  it("rejects invalid coordinate pairs", () => {
    expect(parseCoordinatePaste("not coordinates")).toBeNull();
    expect(parseCoordinatePaste("91, 0")).toBeNull();
  });

  it("validates latitude and longitude ranges", () => {
    expect(isValidLatitude("46.088287")).toBe(true);
    expect(isValidLatitude("90")).toBe(true);
    expect(isValidLatitude("90.1")).toBe(false);
    expect(isValidLongitude("-59.882749")).toBe(true);
    expect(isValidLongitude("180")).toBe(true);
    expect(isValidLongitude("181")).toBe(false);
  });

  it("checks combined coordinate validity", () => {
    expect(hasValidCoordinates("46.088287", "-59.882749")).toBe(true);
    expect(hasValidCoordinates("", "-59.882749")).toBe(false);
  });

  it("formats numeric coordinates", () => {
    expect(formatCoordinate("46.088287")).toBe("46.088287");
    expect(formatCoordinate("46.000")).toBe("46");
  });
});
