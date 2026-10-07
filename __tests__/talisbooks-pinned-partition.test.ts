import { describe, expect, it } from "vitest";
import { packShelfRowsNewestAtRight, partitionBookshelf } from "../lib/talisbooks/library";
import type { TalisBooksLibraryBook } from "../lib/talisbooks/library/types";

function book(
  partial: Partial<TalisBooksLibraryBook> & Pick<TalisBooksLibraryBook, "id" | "title">,
): TalisBooksLibraryBook {
  return {
    slug: partial.slug ?? partial.id,
    subtitle: "",
    coverImageUrl: null,
    coverTemplateId: null,
    coverGradient: "linear-gradient(#000,#111)",
    publishStatus: "published",
    publishedAt: "2026-01-01T00:00:00.000Z",
    views: 0,
    clicks: 0,
    pageCount: 12,
    accountId: null,
    accountType: "root",
    mapsiteId: null,
    fastCode: null,
    parentBookId: null,
    isPinned: false,
    ...partial,
  };
}

describe("partitionBookshelf pinned ordering", () => {
  it("places the pinned book first in featured", () => {
    const { featured } = partitionBookshelf([
      book({ id: "a", title: "Alpha", views: 900 }),
      book({ id: "b", title: "Pinned", isPinned: true, views: 1 }),
      book({ id: "c", title: "Charlie", views: 500 }),
    ]);
    expect(featured[0]?.id).toBe("b");
  });

  it("keeps ranked pinned books below the newest hero", () => {
    const { featured, general } = partitionBookshelf(
      [
        book({
          id: "tokenization",
          title: "Real-World Asset Tokenization",
          createdAt: "2099-12-31T23:59:59.000Z",
          isPinned: true,
          pinRank: 0,
        }),
        book({
          id: "sample-cover",
          title: "Harbour Lookbook",
          createdAt: "2026-09-01T00:00:00.000Z",
          isPinned: true,
          pinRank: 1,
        }),
        book({
          id: "decorative",
          title: "Decorative Cover",
          createdAt: "2019-01-01T00:00:00.000Z",
        }),
      ],
      { featuredMode: "newest" },
    );

    expect(featured.map((item) => item.id)).toEqual([
      "tokenization",
      "sample-cover",
    ]);
    expect(general.map((item) => item.id)).toEqual(["decorative"]);
  });

  it("fills the Common Shelf left hero-5: Tokenization plus four dummies", () => {
    const { featured, general, featuredLayout } = partitionBookshelf(
      [
        book({
          id: "tokenization",
          title: "Real-World Asset Tokenization",
          createdAt: "2099-12-31T23:59:59.000Z",
          isPinned: true,
          pinRank: 0,
        }),
        book({
          id: "left-hero-dummy-1",
          title: "Harbour Lookbook",
          createdAt: "2020-01-01T00:00:00.000Z",
          isPinned: true,
          pinRank: 1,
        }),
        book({
          id: "left-hero-dummy-2",
          title: "Prairie Estates",
          createdAt: "2020-01-01T00:00:00.000Z",
          isPinned: true,
          pinRank: 2,
        }),
        book({
          id: "left-hero-dummy-3",
          title: "Lakefront Digest",
          createdAt: "2020-01-01T00:00:00.000Z",
          isPinned: true,
          pinRank: 3,
        }),
        book({
          id: "left-hero-dummy-4",
          title: "Canyon Collection",
          createdAt: "2020-01-01T00:00:00.000Z",
          isPinned: true,
          pinRank: 4,
        }),
        book({
          id: "right-1",
          title: "Summit Residences",
          createdAt: "2019-01-01T00:00:00.000Z",
        }),
        book({
          id: "right-2",
          title: "Garden Court",
          createdAt: "2019-06-01T00:00:00.000Z",
        }),
      ],
      { featuredCapacity: 5, featuredMode: "newest" },
    );

    expect(featuredLayout).toBe("hero-plus-4");
    expect(featured.map((item) => item.id)).toEqual([
      "tokenization",
      "left-hero-dummy-1",
      "left-hero-dummy-2",
      "left-hero-dummy-3",
      "left-hero-dummy-4",
    ]);
    expect(general.map((item) => item.id)).toEqual(["right-2", "right-1"]);
    expect(packShelfRowsNewestAtRight(general.map((item) => item.id), 10)).toEqual([
      ["right-2", "right-1"],
    ]);
  });

  it("puts FAST-code published books on the right shelf newest first", () => {
    const { featured, general } = partitionBookshelf(
      [
        book({
          id: "older",
          title: "Older",
          fastCode: "demo-ab12cd34",
          publishedAt: "2026-01-01T00:00:00.000Z",
        }),
        book({
          id: "newest",
          title: "Newest",
          fastCode: "demo-ab12cd34",
          publishedAt: "2026-09-18T00:00:00.000Z",
        }),
        book({
          id: "scheduled",
          title: "Coming soon",
          fastCode: "demo-ab12cd34",
          publishStatus: "scheduled",
          publishedAt: "2026-10-01T00:00:00.000Z",
        }),
      ],
      { featuredMode: "highlights" },
    );

    expect(featured.map((item) => item.id)).toEqual(["scheduled"]);
    expect(general.map((item) => item.id)).toEqual(["newest", "older"]);
    expect(packShelfRowsNewestAtRight(general.map((item) => item.id), 4)).toEqual([
      ["newest", "older"],
    ]);
  });

  it("pins the latest created ebook on the left and shifts older books right", () => {
    const { featured, general } = partitionBookshelf(
      [
        book({
          id: "older",
          title: "Older",
          createdAt: "2026-01-01T00:00:00.000Z",
          publishedAt: "2026-01-01T00:00:00.000Z",
        }),
        book({
          id: "latest",
          title: "Latest",
          createdAt: "2026-09-23T00:00:00.000Z",
          publishedAt: "2026-09-23T00:00:00.000Z",
        }),
        book({
          id: "middle",
          title: "Middle",
          createdAt: "2026-06-01T00:00:00.000Z",
          publishedAt: "2026-06-01T00:00:00.000Z",
        }),
      ],
      { featuredMode: "newest" },
    );

    expect(featured.map((item) => item.id)).toEqual(["latest"]);
    expect(featured[0]?.isPinned).toBe(true);
    expect(general.map((item) => item.id)).toEqual(["middle", "older"]);
    expect(packShelfRowsNewestAtRight(general.map((item) => item.id), 5)).toEqual([
      ["middle", "older"],
    ]);
  });
});
