import { describe, expect, it } from "vitest";
import {
  createDemoMapSiteCode,
  isDemoMapSiteCode,
  isProtectedPlatformDemoMapSite,
  demoMapSiteApplicationHref,
  demoMapSiteEbookHref,
  pathnameForRevalidate,
  publicDemoGenerateError,
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

  it("builds the demo eBook generate path after pin placement", () => {
    expect(
      demoMapSiteEbookHref({ mapsiteId: "map-1", code: "demo-ab12cd34" }),
    ).toBe("/talispros/demo-mapsite/ebook?mapsiteId=map-1&code=demo-ab12cd34");
  });

  it("includes the demo code on the Mapsite™ success href", () => {
    expect(demoMapSiteApplicationHref("map-1", "demo-ab12cd34")).toBe(
      "/talispros/mapsite?view=pin&mapsiteId=map-1&code=demo-ab12cd34",
    );
  });

  it("strips query strings before revalidatePath", () => {
    expect(
      pathnameForRevalidate("/talispros/mapsite?view=pin&mapsiteId=map-1"),
    ).toBe("/talispros/mapsite");
    expect(
      pathnameForRevalidate("https://www.talishouse.com/talisbooks/viewer/x"),
    ).toBe("/talisbooks/viewer/x");
  });

  it("does not surface Next.js production digest text to the user", () => {
    expect(
      publicDemoGenerateError(
        new Error(
          "An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details.",
        ),
      ),
    ).toBe("Could not generate the demonstration Talisbook™.");
    expect(publicDemoGenerateError(new Error("Demo Mapsite™ not found."))).toBe(
      "Demo Mapsite™ not found.",
    );
  });
});
