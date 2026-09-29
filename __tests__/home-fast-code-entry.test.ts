import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildClaimedMapSitePath,
  claimedMapSiteSegmentForAccountOrPlan,
  mapsiteBackFromScheduleHref,
} from "@/lib/talispros/mapsite-state";
import { TALISPROS_HOME_SYSTEM_DEMO_HREF } from "@/lib/talispros/start-content";

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

  it("wires /start Login gate (not homepage) to openClaimedMapSiteFromHomeFastCode", () => {
    const homePage = readFileSync(
      join(root, "components/talispros/TalisprosStartPage.tsx"),
      "utf8",
    );
    const gatePage = readFileSync(
      join(root, "components/talispros/TalisprosGatePage.tsx"),
      "utf8",
    );
    const gate = readFileSync(
      join(root, "components/talispros/TalisprosHomeGate.tsx"),
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
    const startRoute = readFileSync(join(root, "app/start/page.tsx"), "utf8");

    expect(homePage).toContain("TalisprosHomeMapPreview");
    expect(homePage).toContain("TalisprosStartSidebar");
    expect(homePage).not.toContain("TalisprosHomeGate");
    expect(startRoute).toContain("TalisprosGatePage");
    expect(gatePage).toContain("TalisprosHomeGate");
    expect(gatePage).not.toContain("TalisprosHomeShowcase");
    expect(gate).toContain("TalisprosHomeFastCodeEntry");
    expect(gate).toContain("Login To Your Account");
    expect(gate).toContain("System Demo");
    expect(gate).toContain("TALISPROS_HOME_SYSTEM_DEMO_HREF");
    expect(gate).toContain("aria-expanded={loginOpen}");
    expect(gate).toContain("setLoginOpen");
    expect(gate).toContain("<TalisprosHomeFastCodeEntry autoFocus embedded />");
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

  it("points System Demo at /talisu/mkts", () => {
    expect(TALISPROS_HOME_SYSTEM_DEMO_HREF).toBe("/talisu/mkts");
  });

  it("keeps /start as a clean centered gate without the showcase rail", () => {
    const gatePage = readFileSync(
      join(root, "components/talispros/TalisprosGatePage.tsx"),
      "utf8",
    );
    expect(gatePage).toContain("TalisprosHomeGate");
    expect(gatePage).toContain("TalisprosSamCartReturnBanner");
    expect(gatePage).not.toContain("TalisprosHomeShowcase");
    expect(gatePage).toContain("<main");
    expect(gatePage).toContain("min-h-dvh");
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
