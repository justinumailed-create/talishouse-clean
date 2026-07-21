import { describe, expect, it } from "vitest";
import {
  TALISBOOKS_LIBRARY_BOOK_PRICE_USD,
  TALISBOOKS_LIBRARY_GENERAL_PAGE_SIZE,
  TALISBOOKS_LIBRARY_MONTHLY_CAPACITY_USD,
  TALISBOOKS_LIBRARY_SHELF_CAPACITY,
  createDemoDerivativeBookshelf,
  createDemoRootBookshelf,
  filterLibraryBooks,
  monthlyCapacityUsd,
  paginateLibraryBooks,
  partitionBookshelf,
  queryLibraryBooks,
  sortLibraryBooks,
} from "../lib/talisbooks/library";

describe("TalisBooks library shelves", () => {
  it("stocks a Root Account shelf to the 25-book monetization capacity", () => {
    const shelf = createDemoRootBookshelf();
    expect(shelf.accountType).toBe("root");
    expect(shelf.books).toHaveLength(TALISBOOKS_LIBRARY_SHELF_CAPACITY);
    expect(shelf.books.every((book) => book.accountType === "root")).toBe(true);
  });

  it("gives every Derivative Account a personal bookshelf with books", () => {
    const shelf = createDemoDerivativeBookshelf();
    expect(shelf.accountType).toBe("derivative");
    expect(shelf.books.length).toBeGreaterThan(0);
    expect(shelf.books.every((book) => book.accountType === "derivative")).toBe(true);
  });

  it("exposes cover, title, published date, views, clicks, and status", () => {
    const book = createDemoRootBookshelf().books[0]!;
    expect(book.title).toBeTruthy();
    expect(book.coverGradient).toContain("gradient");
    expect(typeof book.views).toBe("number");
    expect(typeof book.clicks).toBe("number");
    expect(book.publishStatus).toBeTruthy();
  });

  it("targets ~$500/month at full capacity (25 × $19.95)", () => {
    expect(TALISBOOKS_LIBRARY_BOOK_PRICE_USD).toBe(19.95);
    expect(TALISBOOKS_LIBRARY_SHELF_CAPACITY).toBe(25);
    expect(TALISBOOKS_LIBRARY_MONTHLY_CAPACITY_USD).toBeCloseTo(498.75);
    expect(monthlyCapacityUsd(25, 19.95)).toBe(498.75);
  });
});

describe("TalisBooks split bookshelf layout", () => {
  const books = createDemoRootBookshelf().books;

  it("partitions into featured (5 hero) and general library (≥20)", () => {
    const { featured, general, featuredLayout } = partitionBookshelf(books, {
      featuredCapacity: 5,
    });

    expect(featured).toHaveLength(5);
    expect(featuredLayout).toBe("hero-plus-4");
    expect(general.length).toBeGreaterThanOrEqual(20);
    expect(featured.length + general.length).toBe(books.length);
  });

  it("supports a 3×2 featured grid of 6 highlighted books", () => {
    const { featured, featuredLayout } = partitionBookshelf(books, {
      featuredCapacity: 6,
    });

    expect(featured).toHaveLength(6);
    expect(featuredLayout).toBe("grid-3x2");
  });

  it("prefers scheduled / in_review books for the highlighted niche", () => {
    const { featured } = partitionBookshelf(books, { featuredCapacity: 5 });
    const highlightStatuses = new Set(["scheduled", "in_review"]);
    expect(featured.some((book) => highlightStatuses.has(book.publishStatus))).toBe(true);
  });

  it("pages the general library in a 4×5 grid of 20", () => {
    expect(TALISBOOKS_LIBRARY_GENERAL_PAGE_SIZE).toBe(20);
    const { general } = partitionBookshelf(books, { featuredCapacity: 5 });
    const page = paginateLibraryBooks(general, 1, TALISBOOKS_LIBRARY_GENERAL_PAGE_SIZE);
    expect(page.books.length).toBeLessThanOrEqual(20);
    expect(page.books.length).toBe(Math.min(20, general.length));
  });
});

describe("TalisBooks library search / sort / filter", () => {
  const books = createDemoRootBookshelf().books;

  it("searches by title", () => {
    const result = filterLibraryBooks(books, { search: "harbourfront" });
    expect(result.every((book) => book.title.toLowerCase().includes("harbourfront"))).toBe(
      true,
    );
    expect(result.length).toBeGreaterThan(0);
  });

  it("filters by status", () => {
    const drafts = filterLibraryBooks(books, { status: "draft" });
    expect(drafts.every((book) => book.publishStatus === "draft")).toBe(true);
  });

  it("sorts by views descending", () => {
    const sorted = sortLibraryBooks(books, "views_desc");
    for (let index = 1; index < sorted.length; index += 1) {
      expect(sorted[index - 1]!.views).toBeGreaterThanOrEqual(sorted[index]!.views);
    }
  });

  it("sorts by title ascending", () => {
    const sorted = sortLibraryBooks(books, "title_asc");
    const titles = sorted.map((book) => book.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
  });

  it("paginates for hundreds of books", () => {
    const many = Array.from({ length: 120 }, (_, index) => ({
      ...books[0]!,
      id: `book-${index}`,
      title: `Book ${String(index).padStart(3, "0")}`,
      views: index,
    }));

    const page = paginateLibraryBooks(many, 2, 48);
    expect(page.total).toBe(120);
    expect(page.pageCount).toBe(3);
    expect(page.books).toHaveLength(48);
    expect(page.page).toBe(2);
  });

  it("combines search, filter, sort, and pagination", () => {
    const result = queryLibraryBooks(books, {
      search: "residences",
      status: "published",
      sort: "views_desc",
      page: 1,
      pageSize: 10,
    });

    expect(result.books.length).toBeGreaterThan(0);
    expect(result.books.every((book) => book.publishStatus === "published")).toBe(true);
    expect(
      result.books.every(
        (book) =>
          /residences/i.test(book.title) ||
          /residences/i.test(book.subtitle) ||
          /residences/i.test(book.slug),
      ),
    ).toBe(true);
  });
});
