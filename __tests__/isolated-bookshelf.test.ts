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
    expect(page).toMatch(/mapsiteId=\{mapsite\?\.id \?\? null\}/);
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
