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
});
