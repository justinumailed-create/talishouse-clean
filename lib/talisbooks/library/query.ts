import type { TalisBooksLibraryBook, TalisBooksLibraryQuery } from "./types";
import type { TalisBooksLibraryStatusFilter, TalisBooksLibrarySort } from "./types";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function matchesLibrarySearch(book: TalisBooksLibraryBook, search: string): boolean {
  const query = normalize(search);
  if (!query) {
    return true;
  }

  const haystack = [
    book.title,
    book.subtitle,
    book.slug,
    book.fastCode ?? "",
    book.publishStatus,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function matchesLibraryStatus(
  book: TalisBooksLibraryBook,
  status: TalisBooksLibraryStatusFilter = "all",
): boolean {
  if (status === "all") {
    return true;
  }
  return book.publishStatus === status;
}

export function filterLibraryBooks(
  books: TalisBooksLibraryBook[],
  query: Pick<TalisBooksLibraryQuery, "search" | "status">,
): TalisBooksLibraryBook[] {
  return books.filter(
    (book) =>
      matchesLibrarySearch(book, query.search ?? "") &&
      matchesLibraryStatus(book, query.status ?? "all"),
  );
}

function publishedTimestamp(book: TalisBooksLibraryBook): number {
  if (!book.publishedAt) {
    return 0;
  }
  const value = Date.parse(book.publishedAt);
  return Number.isFinite(value) ? value : 0;
}

const STATUS_ORDER: Record<string, number> = {
  published: 0,
  scheduled: 1,
  in_review: 2,
  draft: 3,
  archived: 4,
  withdrawn: 5,
};

export function sortLibraryBooks(
  books: TalisBooksLibraryBook[],
  sort: TalisBooksLibrarySort = "published_desc",
): TalisBooksLibraryBook[] {
  const sorted = [...books];

  sorted.sort((a, b) => {
    switch (sort) {
      case "published_asc":
        return publishedTimestamp(a) - publishedTimestamp(b);
      case "title_asc":
        return a.title.localeCompare(b.title);
      case "title_desc":
        return b.title.localeCompare(a.title);
      case "views_desc":
        return b.views - a.views || a.title.localeCompare(b.title);
      case "clicks_desc":
        return b.clicks - a.clicks || a.title.localeCompare(b.title);
      case "status":
        return (
          (STATUS_ORDER[a.publishStatus] ?? 99) - (STATUS_ORDER[b.publishStatus] ?? 99) ||
          a.title.localeCompare(b.title)
        );
      case "published_desc":
      default:
        return publishedTimestamp(b) - publishedTimestamp(a);
    }
  });

  return sorted;
}

export function paginateLibraryBooks(
  books: TalisBooksLibraryBook[],
  page = 1,
  pageSize = 48,
): {
  books: TalisBooksLibraryBook[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
} {
  const safeSize = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(books.length / safeSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * safeSize;

  return {
    books: books.slice(start, start + safeSize),
    total: books.length,
    page: safePage,
    pageSize: safeSize,
    pageCount,
  };
}

export function queryLibraryBooks(
  books: TalisBooksLibraryBook[],
  query: TalisBooksLibraryQuery = {},
) {
  const filtered = filterLibraryBooks(books, query);
  const sorted = sortLibraryBooks(filtered, query.sort ?? "published_desc");
  return paginateLibraryBooks(sorted, query.page ?? 1, query.pageSize);
}
