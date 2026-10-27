import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildIsolatedAllPinsBookshelf } from "../components/catalogue/IsolatedBookshelfView";
import { partitionBookshelf } from "../lib/talisbooks/library";
import {
  FAQ_ESSAY_BOOKS,
  createFaqEssayViewerBook,
  faqEssayLibraryBooks,
  isFaqEssayBookSlug,
} from "../lib/talisbooks/library/faq-essay-books";
import { TALISBOOKS_LIBRARY_SPINE_PALETTES } from "../lib/talisbooks/library/constants";

const publicPath = (url: string) => resolve("public", url.replace(/^\//, ""));

describe("TalisU™ FAQ essay Talisbooks™", () => {
  it("fills left hero slots 2–5 under Tokenization with the four FAQ books", () => {
    for (const locale of ["en", "de"] as const) {
      const bookshelf = buildIsolatedAllPinsBookshelf([], locale);
      const { featured, featuredLayout } = partitionBookshelf(bookshelf.books, {
        featuredCapacity: 5,
        featuredMode: "newest",
      });
      expect(featuredLayout).toBe("hero-plus-4");
      expect(featured[0]?.title).toBe("Real-World Asset Tokenization");
      expect(featured.slice(1).map((book) => book.slug)).toEqual(
        FAQ_ESSAY_BOOKS.map((book) => book.slug),
      );
      expect(featured.slice(1).map((book) => book.title)).toEqual(
        FAQ_ESSAY_BOOKS.map((book) => book[locale].title),
      );
      for (const book of featured.slice(1)) {
        expect(book.decorative).toBeFalsy();
        expect(book.coverImageUrl).toContain(`/${locale}/cover-thumb.jpg`);
      }
      // Locked right shelf: 4 rows × 10 dummy covers.
      expect(
        bookshelf.books.filter((book) => book.id.startsWith("decorative-shelf-")),
      ).toHaveLength(40);
      expect(bookshelf.books.some((book) => book.id.startsWith("left-hero-dummy"))).toBe(
        false,
      );
    }
  });

  it("builds front cover, landscape spreads and back cover per locale with real assets", () => {
    for (const def of FAQ_ESSAY_BOOKS) {
      expect(isFaqEssayBookSlug(def.slug)).toBe(true);
      for (const locale of ["en", "de"] as const) {
        const book = createFaqEssayViewerBook(def.slug, locale)!;
        expect(book.title).toBe(def[locale].title);
        expect(book.pages).toHaveLength(2 + def[locale].spreads * 2);
        expect(book.pages[0]?.layout).toBe("cover");
        expect(book.pages.at(-1)?.heroImageUrl).toBe(book.backCoverImageUrl);
        expect(book.frontCoverImageUrl).toContain(`/${locale}/front.jpg`);
        const urls = new Set<string>([
          book.frontCoverImageUrl!,
          book.backCoverImageUrl!,
          ...book.pages.map((page) => page.heroImageUrl!).filter(Boolean),
        ]);
        for (const url of urls) expect(existsSync(publicPath(url))).toBe(true);
        expect(
          existsSync(publicPath(`/talisbooks/faq/${def.slug}/${locale}/spread-${String(def[locale].spreads + 1).padStart(2, "0")}.jpg`)),
        ).toBe(false);
      }
    }
  });

  it("falls back to English for unknown locales and ignores other slugs", () => {
    const [first] = faqEssayLibraryBooks("fr", TALISBOOKS_LIBRARY_SPINE_PALETTES);
    expect(first?.title).toBe(FAQ_ESSAY_BOOKS[0]!.en.title);
    expect(createFaqEssayViewerBook("talispros-ebook-sample", "en")).toBeNull();
  });
});
