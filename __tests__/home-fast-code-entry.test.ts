import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import {
  buildClaimedMapSitePath,
  claimedMapSiteSegmentForAccountOrPlan,
  mapsiteBackFromScheduleHref,
} from "@/lib/talispros/mapsite-state";
import { TALISPROS_HOME_SYSTEM_DEMO_HREF } from "@/lib/talispros/start-content";
import {
  HOME_OWNERSHIP_BG_SRC,
  HOME_OWNERSHIP_SECTIONS,
} from "@/lib/talispros/ownership-models";
import { TALISU_MKTS_HEADER_BLUE } from "@/lib/talisu/markets-pins";

const root = process.cwd();

describe("homepage FAST Code → claimed Mapsite", () => {
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

  it("wires homepage Login gate (not /start) to openClaimedMapSiteFromHomeFastCode", () => {
    const formerHome = readFileSync(
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
    const homeRoute = readFileSync(join(root, "app/page.tsx"), "utf8");
    const startRoute = readFileSync(join(root, "app/start/page.tsx"), "utf8");

    expect(formerHome).toContain("TalisprosHomeMapPreview");
    expect(formerHome).toContain("TalisprosStartSidebar");
    expect(formerHome).not.toContain("TalisprosHomeGate");
    expect(homeRoute).toContain("TalisprosGatePage");
    expect(startRoute).toContain("TalisprosStartPage");
    expect(gatePage).toContain("TalisprosHomeGate");
    expect(gatePage).toContain("TalisprosHomeShowcase");
    expect(gatePage).toContain("TalisUMktsHeader");
    expect(gate).toContain("TalisprosHomeFastCodeEntry");
    // Copy lives in the i18n dictionary (English default; German in de.ts).
    expect(gate).toContain("t.home.openAccount");
    expect(en.home.openAccount).toBe("Open your Account*");
    expect(gate).toContain("t.home.systemDemo");
    expect(en.home.systemDemo).toBe("System Demo");
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

  it("uses ownership models over photo on homepage right rail (not Markets map)", () => {
    const gatePage = readFileSync(
      join(root, "components/talispros/TalisprosGatePage.tsx"),
      "utf8",
    );
    const showcase = readFileSync(
      join(root, "components/talispros/TalisprosHomeShowcase.tsx"),
      "utf8",
    );

    expect(gatePage).toContain("TalisprosHomeGate");
    expect(gatePage).toContain("TalisprosSamCartReturnBanner");
    expect(gatePage).toContain("TalisprosHomeShowcase");
    expect(gatePage).toContain("TalisUMktsHeader");
    expect(gatePage).toContain("lg:grid-cols-");
    expect(gatePage).toContain("min-h-dvh");
    expect(showcase).toContain("HOME_OWNERSHIP_SECTIONS");
    expect(showcase).toContain("HomeMountainMotion");
    const motion = readFileSync(
      join(root, "components/talispros/HomeMountainMotion.tsx"),
      "utf8",
    );
    expect(motion).toContain("HOME_OWNERSHIP_BG_SRC");
    expect(showcase).not.toContain("TalisprosStartMktsMap");
    expect(showcase).not.toContain("/assets/home-demo/01-talismaps-mkts.jpg");
    expect(HOME_OWNERSHIP_BG_SRC).toBe("/assets/home-ownership-bg.jpg");
    expect(HOME_OWNERSHIP_SECTIONS).toHaveLength(4);
    expect(HOME_OWNERSHIP_SECTIONS.map((s) => s.title)).toEqual([
      "Conventional",
      "SPLITS",
      "Fractionalization",
      "Tokenization",
    ]);
    expect(HOME_OWNERSHIP_SECTIONS[0].body).toContain(
      "title changes hands upon that last penny having been paid.",
    );
    expect(HOME_OWNERSHIP_SECTIONS[1].body).toContain("instalments");
    expect(HOME_OWNERSHIP_SECTIONS[1].result).toContain("'Lease-To-Own'");
    expect(HOME_OWNERSHIP_SECTIONS[2].body).toContain("over-arching");
    expect(HOME_OWNERSHIP_SECTIONS[3].body).toContain("interest—whole or fractional");
    expect(TALISU_MKTS_HEADER_BLUE).toBe("#046BD9");
  });

  it("shows Logout on paid owner claimed Mapsite chrome", () => {
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
    expect(logout).toContain("LogOut");
    expect(logout).toContain("bg-red-600");
    expect(partner).toContain("absolute top-2 right-2");
    expect(application).toContain("isOwner={isOwner}");
    expect(application).toContain("accountTypeSegment={accountTypeSegment}");
    expect(page).toContain("isOwner={isOwner}");
    expect(page).toContain("accountTypeSegment={accountType}");
    expect(page).toContain("const isOwner = await isOwnMapSite(fastCode)");
  });
});
