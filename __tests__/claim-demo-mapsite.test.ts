import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildClaimedMapSitePath } from "../lib/talispros/mapsite-state";
import { claimedMapSiteSegmentForAccountOrPlan } from "../lib/talispros/mapsite-state";
import { isIssuedFastCode } from "../lib/talispros/fast-code-shape";

describe("claim demo Mapsite™ → live claimed URL", () => {
  it("builds brokers claimed path for root-style demo claims", () => {
    const segment = claimedMapSiteSegmentForAccountOrPlan("root");
    expect(segment).toBe("brokers");
    expect(
      buildClaimedMapSitePath({ fastCode: "ar01", accountType: segment }),
    ).toBe("/talispros/mapsite/brokers/ar01");
    expect(isIssuedFastCode("ar01")).toBe(true);
    expect(isIssuedFastCode("demo-abc12")).toBe(false);
  });

  it("keeps platform DEMO seed protected and converts demo-* in place", () => {
    const service = readFileSync(
      resolve("lib/talispros/claim-demo-mapsite.ts"),
      "utf8",
    );
    expect(service).toContain("isProtectedPlatformDemoMapSite");
    expect(service).toContain("DEMO_MAPSITE_FAST_CODE");
    expect(service).toContain("generateFastCode");
    expect(service).toContain('from("fast_codes").upsert');
  });
});
