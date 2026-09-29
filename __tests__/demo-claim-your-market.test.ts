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
        fastCode: "dc01",
      }),
    ).toBe(false);
  });

  it("wires Claim Your Market → / on demo claimed partner card and demo-mapsite surfaces", () => {
    expect(ROUTES.HOME).toBe("/");
    const partner = readFileSync(
      resolve("components/talispros/mapsite/MapSiteMarketPartnerCard.tsx"),
      "utf8",
    );
    expect(partner).toContain("Claim Your Market");
    expect(partner).toContain("href={ROUTES.HOME}");
    expect(partner).toContain("isDemo");

    const app = readFileSync(
      resolve("components/talispros/mapsite/MapSiteApplication.tsx"),
      "utf8",
    );
    expect(app).toContain("isDemo={isDemoListing}");

    const builder = readFileSync(
      resolve("components/talispros/demo-mapsite/DemoMapSiteBuilderClient.tsx"),
      "utf8",
    );
    expect(builder).toContain("Claim Your Market");
    expect(builder).toContain("href={ROUTES.HOME}");
    expect(builder).toContain("DEMO_MAPSITE_PDF_HREF");

    const ebook = readFileSync(
      resolve("components/talispros/demo-mapsite/DemoEbookGenerateClient.tsx"),
      "utf8",
    );
    expect(ebook).toContain("Claim Your Market");
    expect(ebook).toContain("href={ROUTES.HOME}");
  });
});
