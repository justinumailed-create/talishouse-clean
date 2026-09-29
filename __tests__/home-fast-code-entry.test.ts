import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildClaimedMapSitePath,
  mapsiteBackFromScheduleHref,
} from "@/lib/talispros/mapsite-state";

const root = process.cwd();

describe("homepage FAST Code → claimed Mapsite™", () => {
  it("matches existing claimed listings navigation", () => {
    expect(buildClaimedMapSitePath({ fastCode: "LG01", accountType: "listings" })).toBe(
      "/talispros/mapsite/listings/lg01",
    );
    expect(mapsiteBackFromScheduleHref("LG01")).toBe(
      "/talispros/mapsite/listings/lg01",
    );
  });

  it("wires the homepage entry to openClaimedMapSiteFromHomeFastCode", () => {
    const startPage = readFileSync(
      join(root, "components/talispros/TalisprosStartPage.tsx"),
      "utf8",
    );
    const entry = readFileSync(
      join(root, "components/talispros/TalisprosHomeFastCodeEntry.tsx"),
      "utf8",
    );
    const actions = readFileSync(
      join(root, "app/talispros/mapsites/actions.ts"),
      "utf8",
    );

    expect(startPage).toContain("TalisprosHomeFastCodeEntry");
    expect(entry).toContain("openClaimedMapSiteFromHomeFastCode");
    expect(entry).toContain("setFastCode");
    expect(actions).toContain("openClaimedMapSiteFromHomeFastCode");
    expect(actions).toContain('accountType: "listings"');
    expect(actions).toContain("setMapSiteOwnerSession");
    expect(actions).toContain("establishPaidMapSiteBrowserSession");
    expect(actions).toContain("hasCompletedMapSiteActivationPayment");
  });
});
