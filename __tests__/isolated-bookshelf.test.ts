import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ISOLATED_BOOKSHELF_CREATE_PATH,
  ISOLATED_BOOKSHELF_DESTINATION,
  ISOLATED_BOOKSHELF_PATH,
  buildIsolatedBookshelfEbookChoiceHref,
  buildIsolatedBookshelfHref,
  buildIsolatedBookshelfSelfServeHref,
  excludeIsolatedBookshelfBooks,
  isIsolatedBookshelfBook,
  isIsolatedBookshelfDestination,
  withIsolatedBookshelfMetadata,
} from "../lib/talisbooks/isolated-bookshelf";
import { buildIsolatedBookshelfOnboardingContext } from "../lib/talispros/resolve-onboarding-from-request";
import {
  displayShelfBookTitle,
  isSyntheticFastCodeTalisbookTitle,
  resolvePersistedBookTitle,
} from "../lib/talisbooks/book-title";

describe("isolated catalogue bookshelf", () => {
  it("tags and detects isolated bookshelf books", () => {
    const metadata = withIsolatedBookshelfMetadata({ source: "self-service-teb" });
    expect(metadata.isolatedBookshelf).toBe(true);
    expect(metadata.globallyPublished).toBe(false);
    expect(isIsolatedBookshelfBook({ metadata })).toBe(true);
    expect(isIsolatedBookshelfBook({ metadata: {} })).toBe(false);
  });

  it("excludes isolated books from public/general lists", () => {
    const books = [
      { id: "1", metadata: { isolatedBookshelf: true } },
      { id: "2", metadata: { source: "public" } },
    ];
    expect(excludeIsolatedBookshelfBooks(books).map((b) => b.id)).toEqual(["2"]);
  });

  it("keeps isolated shelf off public /talisbooks and gates first reach via self-serve create", () => {
    expect(buildIsolatedBookshelfHref()).toBe(ISOLATED_BOOKSHELF_PATH);
    expect(buildIsolatedBookshelfSelfServeHref()).toBe(ISOLATED_BOOKSHELF_CREATE_PATH);
    expect(ISOLATED_BOOKSHELF_PATH).toBe("/catalogue/bookshelf");
    expect(ISOLATED_BOOKSHELF_CREATE_PATH).toBe("/catalogue/bookshelf/create");
    expect(ISOLATED_BOOKSHELF_PATH).not.toBe("/talisbooks");
    expect(isIsolatedBookshelfDestination(ISOLATED_BOOKSHELF_DESTINATION)).toBe(true);
    expect(isIsolatedBookshelfDestination("public")).toBe(false);
    expect(buildIsolatedBookshelfEbookChoiceHref({ fastCode: "rm22" })).toContain(
      "destination=isolated-bookshelf",
    );
  });

  it("builds onboarding context without a Mapsite™ for isolated create", () => {
    const context = buildIsolatedBookshelfOnboardingContext({
      fastCode: "ADMIN123",
      agentName: "Platform Admin",
      agentEmail: null,
    });
    expect(context.fastCode).toBe("admin123");
    expect(context.mapsiteId).toBeNull();
    expect(context.requestId).toBeNull();
    expect(context.owner.agentName).toBe("Platform Admin");
    expect(context.accountType).toBe("root");
  });

  it("isolated create page no longer blocks on a missing Mapsite™", () => {
    const page = readFileSync(
      resolve("app/catalogue/bookshelf/create/page.tsx"),
      "utf8",
    );
    expect(page).toContain("IsolatedBookshelfCreateClient");
    expect(page).toMatch(/mapsiteId=\{mapsiteId\}/);
    expect(page).toContain("ensureAllPinsMapSite");
    expect(page).not.toMatch(/No Mapsite™ linked/i);
    expect(page).not.toMatch(/self-serve ebook process needs a Mapsite/i);
    expect(page).toMatch(/Mapsite™ is optional/i);
  });

  it("generate client allows isolated session without mapsiteId", () => {
    const client = readFileSync(
      resolve("components/talispros/EbookGenerateClient.tsx"),
      "utf8",
    );
    expect(client).toContain("`isolated:${fastCode}`");
    expect(client).toContain("isolatedBookshelf");
  });

  it("pipeline routes isolated create through Mapsite-optional resolver", () => {
    const pipeline = readFileSync(
      resolve("lib/talispros/ebook-generation-pipeline.ts"),
      "utf8",
    );
    expect(pipeline).toContain("resolveOnboardingForIsolatedBookshelf");
    expect(pipeline).toContain("input.isolatedBookshelf");
  });
});

describe("isolated bookshelf ALLPINS / viewer back link", () => {
  it("ebook generate client forwards isolated upload scope (fastCode + flag)", () => {
    const client = readFileSync(
      resolve("components/talispros/EbookGenerateClient.tsx"),
      "utf8",
    );
    expect(client).toContain("fastCode: options.fastCode");
    expect(client).toContain("isolatedBookshelf: options.isolatedBookshelf");
    expect(client).toMatch(
      /isolatedBookshelf && !requestId && fastCode/,
    );
  });

  it("ALLPINS mapsite module and claimed page branch exist", () => {
    const mod = readFileSync(
      resolve("lib/talispros/allpins-mapsite.ts"),
      "utf8",
    );
    expect(mod).toContain("ensureAllPinsMapSite");
    expect(mod).toContain("listAllPinsAggregatedPins");
    const page = readFileSync(
      resolve("app/talispros/mapsite/[accountType]/[fastCode]/page.tsx"),
      "utf8",
    );
    expect(page).toContain("isAllPinsFastCode");
    expect(page).toContain("MapSiteAllPinsApplication");
  });


  it("catalogue bookshelf view is publicly shareable with portrait bookshelf OG", () => {
    const page = readFileSync(
      resolve("app/catalogue/bookshelf/page.tsx"),
      "utf8",
    );
    expect(page).toContain("bookshelfOgMetadataImage");
    expect(page).toContain("bookshelfSeoCopy");
    expect(page).toContain("canCreate={Boolean(account)}");
    expect(page).not.toContain("requireAdminPage");
    expect(page).toContain("getAdminSessionAccount");
    // Create path stays admin-gated.
    const create = readFileSync(
      resolve("app/catalogue/bookshelf/create/page.tsx"),
      "utf8",
    );
    expect(create).toContain("requireAdminPage");
  });

  it("viewer Back to Mapsite™ for isolated books uses ALLPINS, not admin FAST Code", () => {
    const location = readFileSync(
      resolve("lib/talisbooks/viewer/location.ts"),
      "utf8",
    );
    const shell = readFileSync(
      resolve("components/talisbooks/viewer/TalisBooksViewerShell.tsx"),
      "utf8",
    );
    const loadBook = readFileSync(
      resolve("lib/talisbooks/viewer/load-book.ts"),
      "utf8",
    );
    expect(location).toContain("ALLPINS_FAST_CODE");
    expect(location).toContain("isolatedBookshelf");
    expect(location).toContain("viewerBackToMapsiteHref");
    expect(loadBook).toContain("isolatedBookshelf: isIsolatedBookshelfBook");
    expect(shell).toContain("viewerBackToMapsiteHref(book)");
    // Isolated shelf uses the normal Mapsite™-connected Talisbooks™ shell,
    // linked to ALLPINS (not admin123 / product-catalogue chrome).
    const shelf = readFileSync(
      resolve("components/catalogue/IsolatedBookshelfView.tsx"),
      "utf8",
    );
    expect(shelf).toContain("allPinsClaimedHref");
    expect(shelf).toContain("TalisBooksLibraryShell");
    expect(shelf).toContain("ALLPINS_FAST_CODE");
    expect(shelf).toContain("scopedToFastCode: true");
    expect(shelf).toContain("headerExtra");
    expect(shelf).toContain("isolated-bookshelf-create");
    expect(shelf).toContain("canCreate");
    expect(shelf).toContain("displayShelfBookTitle");
    expect(shelf).not.toContain("absolute right-4 top-4");
    expect(shelf).not.toContain("Isolated Bookshelf");
    expect(shelf).not.toContain("Admin-only shelf");
    expect(shelf).not.toContain("mapsiteBackFromScheduleHref");
  });


  it("keeps Date and Name sort pills in a non-overlapping flex row", () => {
    const libraryShell = readFileSync(
      resolve("components/talisbooks/library/TalisBooksLibraryShell.tsx"),
      "utf8",
    );
    const globals = readFileSync(resolve("app/globals.css"), "utf8");
    expect(libraryShell).toContain("talisbooks-library__sort-pills");
    expect(libraryShell).toContain("published_desc");
    expect(libraryShell).toContain("title_asc");
    expect(libraryShell).toContain("size={11}");
    expect(globals).toContain(".talisbooks-library__sort-pills");
    expect(globals).toContain("flex-direction: row");
    expect(globals).toContain("gap: 0.5rem");
    expect(globals).toContain("flex: 0 0 auto");
    expect(globals).toMatch(
      /\.talisbooks-library__sort-pill:not\(\.is-active\)\s*\{[^}]*opacity:\s*1/s,
    );
  });

  it("ALLPINS aggregation is Canada-scoped with per-site pin style fields", () => {
    const constants = readFileSync(
      resolve("lib/talispros/allpins-mapsite-constants.ts"),
      "utf8",
    );
    const mod = readFileSync(
      resolve("lib/talispros/allpins-mapsite.ts"),
      "utf8",
    );
    const app = readFileSync(
      resolve("components/talispros/mapsite/MapSiteAllPinsApplication.tsx"),
      "utf8",
    );
    const card = readFileSync(
      resolve("components/talispros/mapsite/MapSiteAllPinsPinCard.tsx"),
      "utf8",
    );
    expect(constants).toContain("CANADA_BOUNDS");
    expect(constants).toContain("isAllPinsInCanadaScope");
    expect(mod).toContain("isAllPinsInCanadaScope");
    expect(mod).toContain("getMapSiteTalisMapPinStyle");
    expect(mod).toContain("pinColor");
    expect(app).toContain("resolveMapSitePinStyle");
    expect(app).not.toContain('icon: "dot"');
    expect(app).toContain("MapSiteAllPinsPinCard");
    expect(card).toContain("allpins-pin-card");
    expect(card).toContain("Open Mapsite™");
  });

  it("ALLPINS left rail uses Talispros™ ALL-PINs title with mobile collapse", () => {
    const app = readFileSync(
      resolve("components/talispros/mapsite/MapSiteAllPinsApplication.tsx"),
      "utf8",
    );
    const showcase = readFileSync(
      resolve("components/talispros/mapsite/MapSiteAllPinsShowcase.tsx"),
      "utf8",
    );
    expect(app).not.toContain("Canadian Mapsite™ pins");
    expect(app).not.toContain("absolute right-3 top-3");
    expect(showcase).toContain("Talispros™ ALL-PINs");
    expect(showcase).toContain("allpins-left-rail");
    expect(showcase).toContain("allpins-rail-collapse");
    expect(showcase).toContain("allpins-rail-expand");
    expect(showcase).toContain("Published URL");
    expect(showcase).toContain("Isolated shelf");
    expect(showcase).toContain("allPinsPublishedHref");
    expect(showcase).toContain("ISOLATED_BOOKSHELF_PATH");
    expect(showcase).toContain("md:hidden");
    expect(showcase).toContain("hidden md:flex");
  });
});

describe("synthetic FAST-code Talisbook titles", () => {
  it("detects auto-generated (CODE) Talisbook titles", () => {
    expect(isSyntheticFastCodeTalisbookTitle("ALLPINS Talisbook™")).toBe(true);
    expect(isSyntheticFastCodeTalisbookTitle("allpins Talisbook")).toBe(true);
    expect(isSyntheticFastCodeTalisbookTitle("(allpins) Talisbook")).toBe(true);
    expect(isSyntheticFastCodeTalisbookTitle("RM22 Talisbook™")).toBe(true);
    expect(isSyntheticFastCodeTalisbookTitle("Waterfront Estate")).toBe(false);
    expect(isSyntheticFastCodeTalisbookTitle("")).toBe(false);
  });

  it("hides synthetic titles on the shelf and never invents them on persist", () => {
    expect(displayShelfBookTitle("ALLPINS Talisbook™")).toBe("");
    expect(displayShelfBookTitle("Lake House Lookbook")).toBe("Lake House Lookbook");
    expect(resolvePersistedBookTitle("")).toBe("");
    expect(resolvePersistedBookTitle("  My Title  ")).toBe("My Title");
  });

  it("create/generate paths no longer default to CODE Talisbook™", () => {
    const pipeline = readFileSync(
      resolve("lib/talispros/ebook-generation-pipeline.ts"),
      "utf8",
    );
    const autoDraft = readFileSync(
      resolve("lib/talisbooks/auto-draft-ebook.ts"),
      "utf8",
    );
    const client = readFileSync(
      resolve("components/talispros/EbookGenerateClient.tsx"),
      "utf8",
    );
    const shell = readFileSync(
      resolve("components/talisbooks/library/TalisBooksLibraryShell.tsx"),
      "utf8",
    );
    expect(pipeline).toContain("resolvePersistedBookTitle");
    expect(autoDraft).toContain("resolvePersistedBookTitle");
    expect(client).toContain("resolvePersistedBookTitle");
    expect(pipeline).not.toContain("Talisbook™`");
    expect(autoDraft).not.toContain("Talisbook™`");
    expect(client).not.toContain("Talisbook™`");
    expect(shell).toContain("headerExtra");
  });
});
