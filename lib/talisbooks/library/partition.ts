import type { TalisBooksLibraryBook } from "./types";
import type { TalisBooksFeaturedLayout } from "./constants";
import { TALISBOOKS_LIBRARY_FEATURED_CAPACITY_GRID } from "./constants";

const FEATURED_STATUS_PRIORITY: Record<string, number> = {
  scheduled: 0,
  in_review: 1,
  published: 2,
  draft: 3,
  archived: 4,
  withdrawn: 5,
};

function isHighlightCandidate(book: TalisBooksLibraryBook): boolean {
  return book.publishStatus === "scheduled" || book.publishStatus === "in_review";
}

function pinSortKey(book: TalisBooksLibraryBook): number {
  if (typeof book.pinRank === "number" && Number.isFinite(book.pinRank)) {
    return book.pinRank;
  }
  return book.isPinned ? 100 : Number.POSITIVE_INFINITY;
}

function publishedTimestamp(book: TalisBooksLibraryBook): number {
  if (!book.publishedAt) return 0;
  const value = Date.parse(book.publishedAt);
  return Number.isFinite(value) ? value : 0;
}

function createdTimestamp(book: TalisBooksLibraryBook): number {
  if (book.createdAt) {
    const created = Date.parse(book.createdAt);
    if (Number.isFinite(created)) return created;
  }
  return publishedTimestamp(book);
}

export type TalisBooksFeaturedMode = "fill" | "highlights" | "newest";

/**
 * Splits the shelf into left (highlighted/scheduled) and right (general library).
 *
 * Left capacity:
 * - 6 → 3×2 grid
 * - 5 (default) → 1 larger hero + 4 on lower shelves
 *
 * `fill` (default): take up to capacity from the prioritized list.
 * `highlights`: left niche is pins / scheduled / in_review only; published
 * catalog books stay on the right, newest first.
 * `newest`: the latest created ebook is always the left hero pin; other
 * `isPinned` books (e.g. Cowboy's Guide) sit below it; remaining books
 * stand on the right from the left and shift right as newer pins arrive.
 *
 * Pinned books always sort first (public /talisbooks featured slot).
 */
export function partitionBookshelf(
  books: TalisBooksLibraryBook[],
  options?: { featuredCapacity?: 5 | 6; featuredMode?: TalisBooksFeaturedMode },
): {
  featured: TalisBooksLibraryBook[];
  general: TalisBooksLibraryBook[];
  featuredLayout: TalisBooksFeaturedLayout;
} {
  const capacity = options?.featuredCapacity ?? 5;
  const featuredMode = options?.featuredMode ?? "fill";

  if (featuredMode === "newest") {
    const byCreated = [...books].sort((a, b) => {
      const createdDelta = createdTimestamp(b) - createdTimestamp(a);
      if (createdDelta !== 0) return createdDelta;
      return a.title.localeCompare(b.title);
    });
    const newest = byCreated[0];
    const featured: TalisBooksLibraryBook[] = newest
      ? [{ ...newest, isPinned: true }]
      : [];
    // Keep other pinned books under the hero (e.g. Cowboy's Guide on Common Shelf).
    const remainingPinned = byCreated
      .filter((book) => book.id !== newest?.id && Boolean(book.isPinned))
      .sort((a, b) => {
        const rankDelta = pinSortKey(a) - pinSortKey(b);
        if (rankDelta !== 0) return rankDelta;
        return a.title.localeCompare(b.title);
      });
    for (const book of remainingPinned) {
      if (featured.length >= capacity) break;
      featured.push(book);
    }
    const featuredIds = new Set(featured.map((book) => book.id));
    const general = byCreated.filter((book) => !featuredIds.has(book.id));
    const featuredLayout: TalisBooksFeaturedLayout =
      featured.length >= TALISBOOKS_LIBRARY_FEATURED_CAPACITY_GRID
        ? "grid-3x2"
        : "hero-plus-4";
    return { featured, general, featuredLayout };
  }

  const prioritized = [...books].sort((a, b) => {
    const aRank = pinSortKey(a);
    const bRank = pinSortKey(b);
    if (aRank !== bRank) {
      return aRank - bRank;
    }
    const aBoost = isHighlightCandidate(a) ? 0 : 1;
    const bBoost = isHighlightCandidate(b) ? 0 : 1;
    if (aBoost !== bBoost) {
      return aBoost - bBoost;
    }
    const statusDelta =
      (FEATURED_STATUS_PRIORITY[a.publishStatus] ?? 99) -
      (FEATURED_STATUS_PRIORITY[b.publishStatus] ?? 99);
    if (statusDelta !== 0) {
      return statusDelta;
    }
    return b.views - a.views;
  });

  const featuredPool =
    featuredMode === "highlights"
      ? prioritized.filter(
          (book) => book.isPinned || isHighlightCandidate(book),
        )
      : prioritized;
  const featured = featuredPool.slice(0, Math.min(capacity, featuredPool.length));
  const featuredIds = new Set(featured.map((book) => book.id));
  const general = books
    .filter((book) => !featuredIds.has(book.id))
    .sort((a, b) => publishedTimestamp(b) - publishedTimestamp(a));

  const featuredLayout: TalisBooksFeaturedLayout =
    featured.length >= TALISBOOKS_LIBRARY_FEATURED_CAPACITY_GRID ? "grid-3x2" : "hero-plus-4";

  return { featured, general, featuredLayout };
}

export function monthlyCapacityUsd(bookCount: number, priceUsd: number): number {
  return Math.round(bookCount * priceUsd * 100) / 100;
}
