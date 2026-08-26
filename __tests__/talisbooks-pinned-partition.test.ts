import { describe, expect, it } from "vitest";
import { partitionBookshelf } from "../lib/talisbooks/library/partition";
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
});
