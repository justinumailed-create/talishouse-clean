import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { TALISU_REGISTER } from "../lib/talisu/content";
import { TALISU_MKTS_HEADER_NAV } from "../lib/talisu/markets-pins";

describe("Claimed FAST Mapsite™ header Dashboard nav", () => {
  it("keeps Register in the shared nav config for non-claimed chrome", () => {
    expect(TALISU_MKTS_HEADER_NAV.some((i) => i.label === "Markets")).toBe(true);
    expect(TALISU_MKTS_HEADER_NAV.some((i) => i.label === "Register")).toBe(true);
    expect(TALISU_MKTS_HEADER_NAV.at(-1)?.label).toBe("Register");
    expect(TALISU_REGISTER.samcartUrl).toContain(
      "talispros.mysamcart.com/checkout/register",
    );
  });

  it("replaces Register with locked Dashboard on claimed Mapsites™ until payment", () => {
    const header = readFileSync(
      resolve("components/talisu/TalisUMktsHeader.tsx"),
      "utf8",
    );
    const app = readFileSync(
      resolve("components/talispros/mapsite/MapSiteApplication.tsx"),
      "utf8",
    );
    const partner = readFileSync(
      resolve("components/talispros/mapsite/MapSiteMarketPartnerCard.tsx"),
      "utf8",
    );

    expect(header).toContain('variant === "claimed-mapsite"');
    expect(header).toContain("dashboardUnlocked");
    expect(header).toContain("Dashboard");
    expect(header).toContain("LockIcon");
    expect(header).toContain("Dashboard is locked");
    expect(header).toMatch(/Register\s*<\/a>/);
    expect(header).toContain("registerHref");

    expect(app).toContain('variant="claimed-mapsite"');
    expect(app).toContain(
      "const dashboardUnlocked = activationPaid && !isDemoListing",
    );
    expect(app).toContain("TALISU_REGISTER.samcartUrl");
    expect(app).toContain("onOpenDashboard={openOwnerDashboard}");
    expect(app).toContain("focusPinAndOpen()");
    expect(app).toContain("MapSitePinDashboard");
    expect(app).toContain("showKnowledgeBaseManage={dashboardUnlocked}");

    expect(partner).toContain("isTalisUKbMapsiteManagerFastCode");
    expect(partner).toContain("TALISU_KB_MANAGE_PATH");
    expect(partner).toContain("Knowledge Base");
  });
});
