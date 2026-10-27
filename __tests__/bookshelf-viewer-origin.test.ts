import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";
import {
  CATALOGUE_BOOKSHELF_PATH,
  isBookshelfViewerOrigin,
  viewerHrefWithOrigin,
  VIEWER_ORIGIN_BOOKSHELF,
} from "../lib/talisbooks/viewer/origin";

const read = (p: string) => readFileSync(resolve(p), "utf8");

describe("Bookshelf-opened viewer chrome", () => {
  it("tags viewer links only when an origin is provided", () => {
    expect(viewerHrefWithOrigin("/talisbooks/viewer/a", null)).toBe(
      "/talisbooks/viewer/a",
    );
    expect(
      viewerHrefWithOrigin("/talisbooks/viewer/a", VIEWER_ORIGIN_BOOKSHELF),
    ).toBe("/talisbooks/viewer/a?from=bookshelf");
    expect(
      viewerHrefWithOrigin("/talisbooks/viewer/a?x=1", VIEWER_ORIGIN_BOOKSHELF),
    ).toBe("/talisbooks/viewer/a?x=1&from=bookshelf");
  });

  it("recognises only the bookshelf origin", () => {
    expect(isBookshelfViewerOrigin("bookshelf")).toBe(true);
    expect(isBookshelfViewerOrigin(["bookshelf"])).toBe(true);
    expect(isBookshelfViewerOrigin("mapsite")).toBe(false);
    expect(isBookshelfViewerOrigin(undefined)).toBe(false);
    expect(isBookshelfViewerOrigin("")).toBe(false);
  });

  it("links back to the catalogue bookshelf, never SamCart", () => {
    expect(CATALOGUE_BOOKSHELF_PATH).toBe("/catalogue/bookshelf");
    expect(en.viewer.backToBookshelf).toBe("Back to Bookshelf");
    expect(de.viewer.backToBookshelf).toBe("Zurück zum Bücherregal");
  });

  it("only the isolated catalogue bookshelf provides the bookshelf origin", () => {
    expect(read("components/catalogue/IsolatedBookshelfView.tsx")).toContain(
      "<TalisBooksViewerOriginProvider value={VIEWER_ORIGIN_BOOKSHELF}>",
    );
    expect(read("components/talisbooks/library/TalisBooksLibraryShell.tsx")).not.toContain(
      "TalisBooksViewerOriginProvider",
    );
    expect(read("components/talisbooks/library/TalisBooksStandingBook.tsx")).toContain(
      "viewerHrefWithOrigin(",
    );
  });

  it("viewer hides Claim / Assign and shows Back to Bookshelf only when fromBookshelf", () => {
    const shell = read("components/talisbooks/viewer/TalisBooksViewerShell.tsx");
    expect(shell).toContain('!fromBookshelf && surfaceCta === "claim"');
    expect(shell).toContain('!fromBookshelf && talisBooksViewerCta(book) === "claim"');
    expect(shell).toContain("{fromBookshelf ? (");
    expect(shell).toContain("href={CATALOGUE_BOOKSHELF_PATH}");
    const page = read("app/talisbooks/viewer/[slug]/page.tsx");
    expect(page).toContain("isBookshelfViewerOrigin(query.from)");
    expect(page).toContain("fromBookshelf={fromBookshelf}");
  });
});
