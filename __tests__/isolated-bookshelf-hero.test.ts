import { describe, expect, it } from "vitest";
import { buildIsolatedAllPinsBookshelf } from "../components/catalogue/IsolatedBookshelfView";
import { partitionBookshelf } from "../lib/talisbooks/library";
import type { IsolatedBookshelfBook } from "../lib/talisbooks/isolated-bookshelf-service";

function isolatedBook(
  partial: Partial<IsolatedBookshelfBook> &
    Pick<IsolatedBookshelfBook, "id" | "slug" | "title">,
): IsolatedBookshelfBook {
  return {
    subtitle: "Aggregated live Mapsite™ pins",
    coverImageUrl:
      "https://example.com/allpins/isolated-shelf-replace/cover-front.jpg",
    publishStatus: "published",
    fastCode: "admin123",
    createdAt: "2026-09-25T07:05:16.205Z",
    viewerHref: `/talisbooks/viewer/${partial.slug}`,
    metadata: {
      isolatedBookshelf: true,
      seoDescription: "Talispros™ Real-World Asset Tokenization",
      metaDescription: "Talispros™ Real-World Asset Tokenization",
      bookshelfPlacement: { shelf: 2, row: 2, position: 1 },
    },
    ...partial,
  };
}

describe("isolated ALLPINS Tokenization hero", () => {
  it("promotes the ALLPINS isolated-shelf book to the left hero over a right-shelf placement", () => {
    const bookshelf = buildIsolatedAllPinsBookshelf([
      isolatedBook({
        id: "29da886b-60bd-4c92-bb6f-6e208d9d57c0",
        slug: "admin123-allpins-isolated-shelf-94fi",
        title: "ALLPINS — Isolated shelf",
      }),
    ]);

    const heroCandidate = bookshelf.books.find(
      (book) => book.id === "29da886b-60bd-4c92-bb6f-6e208d9d57c0",
    );
    expect(heroCandidate).toBeTruthy();
    expect(heroCandidate?.title).toBe("Real-World Asset Tokenization");
    expect(heroCandidate?.coverImageUrl).toContain("cover-front.jpg");
    expect(heroCandidate?.pinRank).toBe(0);
    expect(heroCandidate?.shelfPlacement).toBeNull();
    expect(heroCandidate?.metadata?.bookshelfPlacement).toBeUndefined();
    expect(bookshelf.books.some((book) => book.id === "allpins-isolated-tokenization")).toBe(
      false,
    );

    const { featured, featuredLayout } = partitionBookshelf(bookshelf.books, {
      featuredCapacity: 5,
      featuredMode: "newest",
    });
    expect(featuredLayout).toBe("hero-plus-4");
    expect(featured[0]?.id).toBe("29da886b-60bd-4c92-bb6f-6e208d9d57c0");
    expect(featured[0]?.title).toBe("Real-World Asset Tokenization");
  });

  it("keeps Cowboy's Guide off the isolated shelf", () => {
    const bookshelf = buildIsolatedAllPinsBookshelf([]);
    expect(
      bookshelf.books.some((book) =>
        `${book.title} ${book.slug}`.toLowerCase().includes("cowboy"),
      ),
    ).toBe(false);
    expect(bookshelf.books[bookshelf.books.length - 1]?.title).toBe(
      "Real-World Asset Tokenization",
    );
  });
});
