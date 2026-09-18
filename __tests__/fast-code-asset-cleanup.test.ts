import { describe, expect, it } from "vitest";
import { DEMO_MAPSITE_ID } from "../lib/talispros/mapsite-state";
import {
  shouldDeleteBookshelfMissingFastCode,
  shouldDeleteMapSiteMissingFastCode,
} from "../lib/talispros/fast-code-asset-cleanup";

describe("FAST code Mapsite™ and bookshelf cleanup", () => {
  const issued = ["rm22", "LRG1"];

  it("keeps Mapsites™ whose FAST code is still issued", () => {
    expect(
      shouldDeleteMapSiteMissingFastCode({
        mapsiteId: "map-rm22",
        fastCode: "RM22",
        issuedFastCodes: issued,
      }),
    ).toBe(false);
  });

  it("removes Mapsites™ when the FAST code is no longer in the system", () => {
    expect(
      shouldDeleteMapSiteMissingFastCode({
        mapsiteId: "map-tt03",
        fastCode: "tt03",
        issuedFastCodes: issued,
      }),
    ).toBe(true);
    expect(
      shouldDeleteMapSiteMissingFastCode({
        mapsiteId: "map-demo",
        fastCode: "demo-d697325b",
        issuedFastCodes: issued,
      }),
    ).toBe(true);
  });

  it("never removes the platform demonstration Mapsite™", () => {
    expect(
      shouldDeleteMapSiteMissingFastCode({
        mapsiteId: DEMO_MAPSITE_ID,
        fastCode: "demo-d697325b",
        issuedFastCodes: issued,
      }),
    ).toBe(false);
  });

  it("removes a seed-id listing whose FAST code is not issued, like AR16", () => {
    expect(
      shouldDeleteMapSiteMissingFastCode({
        mapsiteId: DEMO_MAPSITE_ID,
        fastCode: "ar16",
        issuedFastCodes: issued,
      }),
    ).toBe(true);
    expect(
      shouldDeleteMapSiteMissingFastCode({
        mapsiteId: "map-ar16",
        fastCode: "AR16",
        issuedFastCodes: issued,
      }),
    ).toBe(true);
  });

  it("removes bookshelves for missing FAST codes but keeps pinned books", () => {
    expect(
      shouldDeleteBookshelfMissingFastCode({
        fastCode: "rd02",
        issuedFastCodes: issued,
      }),
    ).toBe(true);
    expect(
      shouldDeleteBookshelfMissingFastCode({
        fastCode: "rd02",
        isPinned: true,
        issuedFastCodes: issued,
      }),
    ).toBe(false);
    expect(
      shouldDeleteBookshelfMissingFastCode({
        fastCode: "lrg1",
        issuedFastCodes: issued,
      }),
    ).toBe(false);
  });
});
