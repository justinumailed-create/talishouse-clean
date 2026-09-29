import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildClaimedMapSitePath,
  claimedMapSiteSegmentForAccountOrPlan,
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

  it("routes Root / $1 Root activations to the brokers claimed path", () => {
    expect(claimedMapSiteSegmentForAccountOrPlan("ROOT_ACCOUNT_1")).toBe(
      "brokers",
    );
    expect(claimedMapSiteSegmentForAccountOrPlan("ROOT_ACCOUNT")).toBe(
      "brokers",
    );
    expect(claimedMapSiteSegmentForAccountOrPlan("root")).toBe("brokers");
    expect(claimedMapSiteSegmentForAccountOrPlan("fsbo")).toBe("fsbos");
    expect(
      buildClaimedMapSitePath({ fastCode: "rm22", accountType: "brokers" }),
    ).toBe("/talispros/mapsite/brokers/rm22");
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
    expect(entry).toContain("window.location.assign");
    expect(entry).not.toContain("router.push");
    expect(actions).toContain("openClaimedMapSiteFromHomeFastCode");
    expect(actions).toContain("resolveClaimedMapSiteAccountTypeSegment");
    expect(actions).toContain("setMapSiteOwnerSession");
    expect(actions).toContain("establishPaidMapSiteBrowserSession");
    expect(actions).toContain("hasCompletedMapSiteActivationPayment");
    expect(actions).toContain("logoutMapSiteOwnerSession");
    expect(actions).toContain("clearMapSiteBrowserSession");
    expect(actions).toContain('return { success: true, href: "/" }');
  });

  it("shows Logout on paid owner claimed Mapsite™ chrome", () => {
    const partner = readFileSync(
      join(root, "components/talispros/mapsite/MapSiteMarketPartnerCard.tsx"),
      "utf8",
    );
    const logout = readFileSync(
      join(root, "components/talispros/mapsite/MapSiteOwnerLogoutButton.tsx"),
      "utf8",
    );
    const application = readFileSync(
      join(root, "components/talispros/mapsite/MapSiteApplication.tsx"),
      "utf8",
    );
    const page = readFileSync(
      join(root, "app/talispros/mapsite/[accountType]/[fastCode]/page.tsx"),
      "utf8",
    );

    expect(partner).toContain("MapSiteOwnerLogoutButton");
    expect(partner).toContain("isOwner");
    expect(partner).not.toContain("paid && isOwner");
    expect(partner.match(/\{isOwner \?/g)).toHaveLength(2);
    expect(logout).toContain("logoutMapSiteOwnerSession");
    expect(logout).toContain("Logout");
    expect(application).toContain("isOwner={isOwner}");
    expect(application).toContain("accountTypeSegment={accountTypeSegment}");
    expect(page).toContain("isOwner={isOwner}");
    expect(page).toContain("accountTypeSegment={accountType}");
    expect(page).toContain("const isOwner = await isOwnMapSite(fastCode)");
  });
});
