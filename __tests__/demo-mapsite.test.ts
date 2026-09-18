import { describe, expect, it } from "vitest";
import {
  createDemoMapSiteCode,
  isDemoMapSiteCode,
  isDemoMapSitePath,
  isProtectedPlatformDemoMapSite,
  shouldKeepPlatformDemoMapSite,
  demoMapSiteApplicationHref,
  demoMapSiteEbookHref,
  pathnameForRevalidate,
  publicDemoGenerateError,
  shouldLockDemoPageInsert,
} from "../lib/talispros/demo-mapsite";
import { DEMO_MAPSITE_ID } from "../lib/talispros/mapsite-state";
import { isIssuedFastCode } from "../lib/talispros/fast-code-shape";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MAPSITE_DEMO_EBOOK_PARTNER_WRITEUP,
  MAPSITE_GENERIC_PARTNER_WRITEUP,
  mapsiteMarketPartnerWriteup,
} from "../lib/talispros/mapsite-platform";
import {
  mapsiteMarketPartnerImageUrl,
  mapsiteMarketPartnerLabel,
} from "../lib/talispros/market-pages";
import { canLoadMapSiteEbookContext } from "../lib/talisbooks/mapsite-ebook-service";

describe("demo mapsite codes", () => {
  it("accepts demo- prefixed public codes and rejects issued FAST Codes", () => {
    expect(isDemoMapSiteCode("demo-ab12cd34")).toBe(true);
    expect(isDemoMapSiteCode("DEMO-ab12cd34")).toBe(true);
    expect(isDemoMapSiteCode("demo-")).toBe(false);
    expect(isDemoMapSiteCode("demo")).toBe(false);
    expect(isDemoMapSiteCode("ar01")).toBe(false);
    expect(isIssuedFastCode(createDemoMapSiteCode())).toBe(false);
  });

  it("locks Create New / insert-pages on demonstration Mapsites™ only", () => {
    expect(shouldLockDemoPageInsert("demo-ab12cd34")).toBe(true);
    expect(shouldLockDemoPageInsert("DEMO")).toBe(true);
    expect(shouldLockDemoPageInsert("rm22")).toBe(false);
    expect(shouldLockDemoPageInsert("ar01")).toBe(false);
    expect(shouldLockDemoPageInsert("")).toBe(false);
  });

  it("identifies the public demo Mapsite™ builder routes", () => {
    expect(isDemoMapSitePath("/talispros/demo-mapsite")).toBe(true);
    expect(isDemoMapSitePath("/talispros/demo-mapsite/ebook")).toBe(true);
    expect(isDemoMapSitePath("/talispros/demo-mapsite/ebook?mapsiteId=1")).toBe(
      true,
    );
    expect(isDemoMapSitePath("/talispros")).toBe(false);
    expect(isDemoMapSitePath("/talispros/mapsite")).toBe(false);
  });

  it("protects the platform demonstration Mapsite™ id", () => {
    expect(isProtectedPlatformDemoMapSite(DEMO_MAPSITE_ID)).toBe(true);
    expect(isProtectedPlatformDemoMapSite("other")).toBe(false);
    expect(
      shouldKeepPlatformDemoMapSite({
        mapsiteId: DEMO_MAPSITE_ID,
        fastCode: "demo-d697325b",
      }),
    ).toBe(true);
    expect(
      shouldKeepPlatformDemoMapSite({
        mapsiteId: DEMO_MAPSITE_ID,
        fastCode: "ar16",
      }),
    ).toBe(false);
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

  it("uses the 100-PIN insertion-fee writeup only on demo ebook Mapsites™", () => {
    expect(mapsiteMarketPartnerWriteup(false)).toBe(
      MAPSITE_GENERIC_PARTNER_WRITEUP,
    );
    expect(mapsiteMarketPartnerWriteup(true)).toBe(
      MAPSITE_DEMO_EBOOK_PARTNER_WRITEUP,
    );
    expect(MAPSITE_GENERIC_PARTNER_WRITEUP).toContain("10 categories");
    expect(MAPSITE_DEMO_EBOOK_PARTNER_WRITEUP).toContain(
      "up to 100 PINs generating up to 1,000 views, combined",
    );
    expect(MAPSITE_DEMO_EBOOK_PARTNER_WRITEUP).toContain(
      "NO REFERRAL FEES, EVER",
    );

    const cardSource = readFileSync(
      join(process.cwd(), "components/talispros/mapsite/MapSiteMarketPartnerCard.tsx"),
      "utf8",
    );
    const appSource = readFileSync(
      join(process.cwd(), "components/talispros/mapsite/MapSiteApplication.tsx"),
      "utf8",
    );
    expect(cardSource).toContain("mapsiteMarketPartnerWriteup(isDemoEbook)");
    expect(cardSource).toContain("mapsiteMarketPartnerImageUrl");
    expect(cardSource).toContain("mapsite.profile_image_url");
    expect(appSource).toContain(
      "isDemoEbook={isDemoMapSiteCode(mapsite.fast_code)}",
    );
    expect(mapsiteMarketPartnerImageUrl("https://cdn.example/agent.jpg")).toBe(
      "https://cdn.example/agent.jpg",
    );
    expect(mapsiteMarketPartnerImageUrl(null)).toBe(
      "/images/mapsites/lrg1-rahul.jpeg",
    );
    expect(mapsiteMarketPartnerImageUrl("  ")).toBe(
      "/images/mapsites/lrg1-rahul.jpeg",
    );
    expect(
      mapsiteMarketPartnerLabel(
        "https://cdn.example/agent.jpg",
        "Ralf Meyer",
      ),
    ).toBe("Market Partner: Ralf Meyer");
    expect(mapsiteMarketPartnerLabel(null, "Ralf Meyer")).toBe(
      "Market Partner: Rahul C.",
    );
    expect(cardSource).toContain("mapsiteMarketPartnerLabel");
    expect(cardSource).toContain("mapsite.agent_name");
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

  it("loads demo-* FAST shelves and keeps demonstration books off issued codes", () => {
    expect(canLoadMapSiteEbookContext("demo-d697325b")).toBe(true);
    expect(canLoadMapSiteEbookContext("DEMO-D697325B")).toBe(true);
    expect(canLoadMapSiteEbookContext("rm22")).toBe(true);
    expect(canLoadMapSiteEbookContext("demo")).toBe(false);
    expect(canLoadMapSiteEbookContext("")).toBe(false);

    const contextSource = readFileSync(
      join(process.cwd(), "lib/talisbooks/mapsite-ebook-service.ts"),
      "utf8",
    );
    expect(contextSource).toContain("if (!canLoadMapSiteEbookContext(fastCode)) return null;");
    expect(contextSource).not.toContain(
      "if (!fastCode || fastCode === \"demo\" || isDemoMapSiteCode(fastCode)) return null;",
    );

    const shellSource = readFileSync(
      join(process.cwd(), "components/talisbooks/library/TalisBooksLibraryShell.tsx"),
      "utf8",
    );
    expect(shellSource).toContain('useState<TalisBooksLibrarySort>("published_desc")');
    expect(shellSource).toContain(
      'featuredMode: scoped || createdCatalog ? "highlights" : "fill"',
    );
    expect(shellSource).toContain("packShelfRowsNewestAtRight");

    const generateSource = readFileSync(
      join(process.cwd(), "app/talispros/demo-mapsite/actions.ts"),
      "utf8",
    );
    expect(generateSource).toContain(
      "pathnameForRevalidate(`${ROUTES.TALISBOOKS}/fast/${mapsite.code}`)",
    );
  });
});
