import { describe, expect, it } from "vitest";
import {
  createDemoMapSiteCode,
  isDemoMapSiteCode,
  isProtectedPlatformDemoMapSite,
} from "../lib/talispros/demo-mapsite";
import { DEMO_MAPSITE_ID } from "../lib/talispros/mapsite-state";
import { isIssuedFastCode } from "../lib/talispros/fast-code-shape";

describe("demo mapsite codes", () => {
  it("accepts demo- prefixed public codes and rejects issued FAST Codes", () => {
    expect(isDemoMapSiteCode("demo-ab12cd34")).toBe(true);
    expect(isDemoMapSiteCode("DEMO-ab12cd34")).toBe(true);
    expect(isDemoMapSiteCode("demo-")).toBe(false);
    expect(isDemoMapSiteCode("demo")).toBe(false);
    expect(isDemoMapSiteCode("ar01")).toBe(false);
    expect(isIssuedFastCode(createDemoMapSiteCode())).toBe(false);
  });

  it("protects the platform demonstration Mapsite™ id", () => {
    expect(isProtectedPlatformDemoMapSite(DEMO_MAPSITE_ID)).toBe(true);
    expect(isProtectedPlatformDemoMapSite("other")).toBe(false);
  });
});
