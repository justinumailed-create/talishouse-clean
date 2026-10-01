import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isDemonstrationListing } from "../lib/talispros/demo-mapsite";
import { ROUTES } from "../lib/routes";

describe("Claim Your Market on demo Mapsites™ only", () => {
  it("treats demo-* as demonstration and issued codes as live", () => {
    expect(
      isDemonstrationListing({
        isDemonstration: true,
        fastCode: "demo-abc123",
      }),
    ).toBe(true);
    expect(
      isDemonstrationListing({
        isDemonstration: true,
        fastCode: "rm22",
      }),
    ).toBe(false);
    expect(
      isDemonstrationListing({
        isDemonstration: false,
        fastCode: "dc02",
      }),
    ).toBe(false);
  });

  it("wires in-place Claim Your Market™ (no /start redirect) on demo Mapsite right control", () => {
    expect(ROUTES.HOME).toBe("/");
    const partner = readFileSync(
      resolve("components/talispros/mapsite/MapSiteMarketPartnerCard.tsx"),
      "utf8",
    );
    expect(partner).not.toContain("DemoClaimMarketButton");
    expect(partner).not.toContain('href="/start"');
    expect(partner).not.toContain("Claim Your Market");

    const claimButton = readFileSync(
      resolve("components/talispros/mapsite/DemoClaimMarketButton.tsx"),
      "utf8",
    );
    expect(claimButton).toContain("claimDemoMapSiteAction");
    expect(claimButton).toContain("DemoFastCodePreview");
    expect(claimButton).toContain("Claim Your Market™");
    expect(claimButton).toContain("TALISPROS_START_SEGMENTS");
    expect(claimButton).toContain("audience");
    expect(claimButton).toContain("What best describes you?");

    const claimAction = readFileSync(
      resolve("app/talispros/demo-mapsite/claim-actions.ts"),
      "utf8",
    );
    expect(claimAction).toContain("claimDemoMapSite");
    expect(claimAction).toContain("setMapSiteOwnerSession");

    const claimService = readFileSync(
      resolve("lib/talispros/claim-demo-mapsite.ts"),
      "utf8",
    );
    expect(claimService).toContain("generateFastCode");
    expect(claimService).toContain("is_demonstration: false");
    expect(claimService).toContain("buildClaimedMapSitePath");

    const app = readFileSync(
      resolve("components/talispros/mapsite/MapSiteApplication.tsx"),
      "utf8",
    );
    expect(app).toContain("DemoClaimMarketButton");
    expect(app).toContain("isDemoListing");
    expect(app).toContain("right-3");
    expect(app).toContain("bottom-3");
    expect(app).toContain("TalisUMktsHeader");
    expect(app).toContain('variant="claimed-mapsite"');
    expect(app).toContain("TalisUMktsHeader");
    expect(app).toContain("lockCenter");
    expect(app).toContain("MAPSITE_CLAIMED_NAV_PIN_NUDGE_Y_PX");

    const builder = readFileSync(
      resolve("components/talispros/demo-mapsite/DemoMapSiteBuilderClient.tsx"),
      "utf8",
    );
    expect(builder).not.toContain("Claim Your Market");
    expect(builder).not.toContain('href="/start"');
    expect(builder).not.toContain("Realtor / FSBO claim");
    expect(builder).toContain("DEMO_MAPSITE_PDF_HREF");

    const ebook = readFileSync(
      resolve("components/talispros/demo-mapsite/DemoEbookGenerateClient.tsx"),
      "utf8",
    );
    expect(ebook).not.toContain("Claim Your Market");
  });
});
