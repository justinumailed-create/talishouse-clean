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

/**
 * Splits the shelf into left (highlighted/scheduled) and right (general library).
 *
 * Left capacity:
 * - 6 → 3×2 grid
 * - 5 (default) → 1 larger hero + 4 on lower shelves
 */
export function partitionBookshelf(
  books: TalisBooksLibraryBook[],
  options?: { featuredCapacity?: 5 | 6 },
): {
  featured: TalisBooksLibraryBook[];
  general: TalisBooksLibraryBook[];
  featuredLayout: TalisBooksFeaturedLayout;
} {
  const capacity = options?.featuredCapacity ?? 5;

  const prioritized = [...books].sort((a, b) => {
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

  const featured = prioritized.slice(0, Math.min(capacity, prioritized.length));
  const featuredIds = new Set(featured.map((book) => book.id));
  const general = books.filter((book) => !featuredIds.has(book.id));

  const featuredLayout: TalisBooksFeaturedLayout =
    featured.length >= TALISBOOKS_LIBRARY_FEATURED_CAPACITY_GRID ? "grid-3x2" : "hero-plus-4";

  return { featured, general, featuredLayout };
}

export function monthlyCapacityUsd(bookCount: number, priceUsd: number): number {
  return Math.round(bookCount * priceUsd * 100) / 100;
}
