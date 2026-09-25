"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownUp } from "lucide-react";
import TalisBooksStandingBook from "@/components/talisbooks/library/TalisBooksStandingBook";
import { deleteLibraryEbookAction } from "@/app/talisbooks/library/actions";
import {
  buildClaimedMapSitePath,
  MAPSITE_APP_PATH,
} from "@/lib/talispros/mapsite-state";
import {
  TALISBOOKS_LIBRARY_BOOK_PRICE_USD,
  TALISBOOKS_LIBRARY_GENERAL_PAGE_SIZE,
  TALISBOOKS_LIBRARY_MONTHLY_CAPACITY_USD,
  TALISBOOKS_LIBRARY_SHELF_CAPACITY,
  TALISBOOKS_LIBRARY_SORT_OPTIONS,
  generalShelfBookScale,
  generalShelfColumns,
  packShelfRowsNewestAtLeft,
} from "@/lib/talisbooks/library/constants";
import { partitionBookshelf } from "@/lib/talisbooks/library/partition";
import { queryLibraryBooks } from "@/lib/talisbooks/library/query";
import { displayShelfBookTitle } from "@/lib/talisbooks/book-title";
import type {
  TalisBooksBookshelf,
  TalisBooksLibraryBook,
  TalisBooksLibrarySort,
} from "@/lib/talisbooks/library/types";

interface TalisBooksLibraryShellProps {
  bookshelf: TalisBooksBookshelf;
  canDelete?: boolean;
  backHref?: string;
  /** Extra controls in the topbar actions row (e.g. admin Create ebook). */
  headerExtra?: ReactNode;
  /** Strip capacity / marketing chrome (Isolated Bookshelf). */
  compactHeader?: boolean;
  /** Optional second back control (e.g. Back to ALL-PINs). */
  secondaryBackHref?: string;
  secondaryBackLabel?: string;
}

function chunkRows<T>(items: T[], columns: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += columns) {
    rows.push(items.slice(index, index + columns));
  }
  return rows;
}

function ShelfRow({
  books,
  size,
  startIndex = 0,
  canDelete = false,
  deletingId = null,
  onDelete,
}: {
  books: TalisBooksLibraryBook[];
  size: "hero" | "featured" | "compact";
  startIndex?: number;
  canDelete?: boolean;
  deletingId?: string | null;
  onDelete?: (book: TalisBooksLibraryBook) => void;
}) {
  return (
    <div className="talisbooks-library__shelf-bay">
      <div
        className={[
          "talisbooks-library__shelf-row",
          size === "hero" ? "talisbooks-library__shelf-row--hero" : "",
          size === "compact" ? "talisbooks-library__shelf-row--compact" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="list"
      >
        {books.map((book, index) => (
          <div key={book.id} role="listitem" className="talisbooks-library__shelf-slot">
            <TalisBooksStandingBook
              book={book}
              index={startIndex + index}
              size={size}
              showMeta={false}
              canDelete={canDelete}
              deleting={deletingId === book.id}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
      <div className="talisbooks-library__plank" aria-hidden="true">
        <span className="talisbooks-library__plank-face" />
        <span className="talisbooks-library__plank-shadow" />
      </div>
    </div>
  );
}

export default function TalisBooksLibraryShell({
  bookshelf,
  canDelete = false,
  backHref,
  headerExtra,
  compactHeader = false,
  secondaryBackHref,
  secondaryBackLabel = "Back to ALL-PINs",
}: TalisBooksLibraryShellProps) {
  const router = useRouter();
  const [sort, setSort] = useState<TalisBooksLibrarySort>("published_desc");
  const [page, setPage] = useState(1);
  const [featuredCapacity, setFeaturedCapacity] = useState<5 | 6>(5);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const scoped = Boolean(bookshelf.scopedToFastCode && bookshelf.fastCode);
  const publicCatalog = Boolean(bookshelf.publicCatalog);
  const createdCatalog = Boolean(bookshelf.createdCatalog);

  const claimedHref =
    bookshelf.registrationHref?.trim() ||
    (bookshelf.fastCode
      ? buildClaimedMapSitePath({
          fastCode: bookshelf.fastCode,
          accountType: bookshelf.accountType,
        })
      : "");
  const requestedHref = backHref?.trim() || "";
  const mapsiteHref = requestedHref.startsWith("/talispros/mapsite")
    ? requestedHref
    : claimedHref || requestedHref || MAPSITE_APP_PATH;

  const visibleBooks = useMemo(
    () => bookshelf.books.filter((book) => !deletedIds.includes(book.id)),
    [bookshelf.books, deletedIds],
  );

  const { featured, general, featuredLayout } = useMemo(
    () =>
      partitionBookshelf(visibleBooks, {
        featuredCapacity,
        featuredMode: scoped || createdCatalog ? "newest" : "fill",
      }),
    [visibleBooks, featuredCapacity, scoped, createdCatalog],
  );

  const generalResult = useMemo(
    () =>
      queryLibraryBooks(general, {
        search: "",
        sort,
        page,
        pageSize: TALISBOOKS_LIBRARY_GENERAL_PAGE_SIZE,
      }),
      [general, sort, page],
  );

  const generalCount = generalResult.books.length;
  const generalColumns = generalShelfColumns(generalCount);
  const generalScale = generalShelfBookScale(generalCount);

  const generalRows = useMemo(
    () => packShelfRowsNewestAtLeft(generalResult.books, generalColumns),
    [generalResult.books, generalColumns],
  );

  const stocked = Math.min(visibleBooks.length, TALISBOOKS_LIBRARY_SHELF_CAPACITY);
  const monthlyEstimate = Math.round(stocked * TALISBOOKS_LIBRARY_BOOK_PRICE_USD * 100) / 100;

  const heroBook = featuredLayout === "hero-plus-4" ? featured[0] : null;
  const featuredRest =
    featuredLayout === "hero-plus-4" ? featured.slice(1) : featured;
  const shelfControls = {
    canDelete,
    deletingId,
    onDelete: async (book: TalisBooksLibraryBook) => {
      const title = displayShelfBookTitle(book.title) || "this ebook";
      if (
        !window.confirm(
          `Delete “${title}”? This removes it from the shelf and cannot be undone.`,
        )
      ) {
        return;
      }

      setDeletingId(book.id);
      const result = await deleteLibraryEbookAction(book.id);
      setDeletingId(null);
      if (!result.success) {
        window.alert(result.error || "Could not delete this ebook.");
        return;
      }
      setDeletedIds((current) =>
        current.includes(book.id) ? current : [...current, book.id],
      );
      startTransition(() => {
        router.refresh();
      });
    },
  };

  return (
    <div className="talisbooks-library">
      <header className="talisbooks-library__topbar">
        <div className="talisbooks-library__brand">
          {compactHeader ? (
            <h1 className="talisbooks-library__title">Bookshelf</h1>
          ) : (
            <>
              <p className="talisbooks-library__eyebrow">
                {publicCatalog
                  ? scoped
                    ? `Talispros™ Ecosystem · ${bookshelf.fastCode!.toUpperCase()}`
                    : "Talispros™ Ecosystem"
                  : createdCatalog
                    ? "Talispros™ Ecosystem"
                  : scoped
                    ? `TEB™ · ${bookshelf.fastCode!.toUpperCase()}`
                    : bookshelf.accountType === "root"
                      ? "Root Account"
                      : "Derivative Account"}
                {!publicCatalog && !createdCatalog && !scoped && bookshelf.fastCode
                  ? ` · ${bookshelf.fastCode.toUpperCase()}`
                  : ""}
              </p>
              <h1 className="talisbooks-library__title">
                {publicCatalog
                  ? "TalisBooks™"
                  : scoped
                    ? bookshelf.accountName
                    : "Bookshelf"}
              </h1>
              {publicCatalog || createdCatalog ? (
                <p className="talisbooks-library__subtitle">
                  {scoped && bookshelf.fastCode
                    ? `Open a cover to read. This shelf shows Talisbooks™ connected to FAST Code ${bookshelf.fastCode.toUpperCase()} only.`
                    : createdCatalog
                      ? "Open a cover to read. Created Talisbooks™ with FAST codes stand on this shelf. The latest book is pinned on the left; older books stand on the right, newest first from the left."
                      : "Open a cover to read. The featured book is pinned at the front of the shelf."}
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="talisbooks-library__header-actions">
          {!compactHeader && !publicCatalog && !createdCatalog ? (
            <div
              className="talisbooks-library__capacity"
              title="Fully stocked shelf monetization capacity"
            >
              <span className="talisbooks-library__capacity-label">Shelf capacity</span>
              <strong>
                {stocked}/{TALISBOOKS_LIBRARY_SHELF_CAPACITY}
              </strong>
              <span className="talisbooks-library__capacity-value">
                ${monthlyEstimate.toFixed(2)} / ${TALISBOOKS_LIBRARY_MONTHLY_CAPACITY_USD.toFixed(2)}{" "}
                mo
              </span>
            </div>
          ) : null}
          {headerExtra}
          {secondaryBackHref ? (
            <Link href={secondaryBackHref} className="talisbooks-library__back">
              {secondaryBackLabel}
            </Link>
          ) : null}
          <Link href={mapsiteHref} className="talisbooks-library__back">
            Back to Mapsite™
          </Link>
        </div>
      </header>

      {!compactHeader && scoped && bookshelf.entitlements && !bookshelf.entitlements.activated ? (
        <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          <p className="font-medium text-neutral-900">Bookshelf locked</p>
          <p className="mt-1 text-neutral-600">
            Full bookshelf features, publishing, global marketing, additional uploads,
            derivative books, and Adpro books unlock after account activation. Your first
            draft remains available now.
          </p>
        </div>
      ) : null}

      {!compactHeader && scoped && bookshelf.entitlements?.activated ? (
        <div className="mx-auto mb-4 max-w-3xl text-xs text-neutral-500">
          Activated {bookshelf.entitlements.accountKind} · quota{" "}
          {bookshelf.entitlements.bookCount}/{bookshelf.entitlements.bookQuota} books
        </div>
      ) : null}

      <div
        className={[
          "talisbooks-library__case",
          scoped && bookshelf.entitlements && !bookshelf.entitlements.canUseBookshelf
            ? "talisbooks-library__case--locked"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="talisbooks-library__split">
          <section
            className="talisbooks-library__niche talisbooks-library__niche--featured"
            aria-label="Highlighted and scheduled books"
          >
            <div className="talisbooks-library__niche-inner">
              <div className="talisbooks-library__niche-header">
                <div
                  className="talisbooks-library__layout-toggle"
                  role="group"
                  aria-label="Featured layout"
                >
                  <button
                    type="button"
                    className={featuredCapacity === 5 ? "is-active" : ""}
                    onClick={() => setFeaturedCapacity(5)}
                  >
                    5 · Hero
                  </button>
                  <button
                    type="button"
                    className={featuredCapacity === 6 ? "is-active" : ""}
                    onClick={() => setFeaturedCapacity(6)}
                  >
                    6 · 3×2
                  </button>
                </div>
              </div>

              <div className="talisbooks-library__alcove">
                {featured.length === 0 ? (
                  <div className="talisbooks-library__niche-empty">
                    <p>
                      {visibleBooks.length > 0
                        ? "No featured TalisBooks™ yet"
                        : publicCatalog
                          ? "No published TalisBooks™ yet"
                          : createdCatalog
                            ? "No created FAST Talisbooks™ yet"
                            : scoped
                              ? "No ebook on this FAST Code shelf yet"
                              : "No highlighted books yet"}
                    </p>
                  </div>
                ) : featuredLayout === "hero-plus-4" && heroBook ? (
                  <div className="talisbooks-library__featured talisbooks-library__featured--hero">
                    <ShelfRow books={[heroBook]} size="hero" startIndex={0} {...shelfControls} />
                    <ShelfRow
                      books={featuredRest.slice(0, 2)}
                      size="featured"
                      startIndex={1}
                      {...shelfControls}
                    />
                    <ShelfRow
                      books={featuredRest.slice(2, 4)}
                      size="featured"
                      startIndex={3}
                      {...shelfControls}
                    />
                  </div>
                ) : (
                  <div className="talisbooks-library__featured talisbooks-library__featured--grid">
                    <ShelfRow
                      books={featured.slice(0, 3)}
                      size="featured"
                      startIndex={0}
                      {...shelfControls}
                    />
                    <ShelfRow
                      books={featured.slice(3, 6)}
                      size="featured"
                      startIndex={3}
                      {...shelfControls}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="talisbooks-library__mullion" aria-hidden="true" />

          <section
            className="talisbooks-library__niche talisbooks-library__niche--general"
            aria-label="General library"
            style={{ ["--general-book-scale" as string]: String(generalScale) }}
          >
            <div className="talisbooks-library__niche-inner">
              <div className="talisbooks-library__niche-header talisbooks-library__niche-header--end">
                <div className="talisbooks-library__sort-pills">
                  {TALISBOOKS_LIBRARY_SORT_OPTIONS.filter(
                    (option) =>
                      option.value === "title_asc" || option.value === "published_desc",
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={[
                        "talisbooks-library__sort-pill",
                        sort === option.value ? "is-active" : "",
                      ].join(" ")}
                      onClick={() => {
                        setSort(option.value);
                        setPage(1);
                      }}
                    >
                      {option.label}
                      <ArrowDownUp
                        className="talisbooks-library__sort-icon"
                        size={11}
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="talisbooks-library__alcove">
                {generalResult.books.length === 0 ? (
                  <div className="talisbooks-library__niche-empty">
                    <p>No books on this shelf</p>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="talisbooks-library__shelf-bay">
                        <div className="talisbooks-library__shelf-row talisbooks-library__shelf-row--compact" />
                        <div className="talisbooks-library__plank" aria-hidden="true">
                          <span className="talisbooks-library__plank-face" />
                          <span className="talisbooks-library__plank-shadow" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  generalRows.map((row, rowIndex) => (
                    <ShelfRow
                      key={`general-row-${rowIndex}`}
                      books={row}
                      size="compact"
                      startIndex={rowIndex * generalColumns}
                      {...shelfControls}
                    />
                  ))
                )}
              </div>

              <div className="talisbooks-library__pager">
                <span>
                  {generalResult.page}/{generalResult.pageCount} ({generalResult.total} books)
                </span>
                {generalResult.pageCount > 1 ? (
                  <div className="talisbooks-library__pager-actions">
                    <button
                      type="button"
                      disabled={generalResult.page <= 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={generalResult.page >= generalResult.pageCount}
                      onClick={() =>
                        setPage((current) => Math.min(generalResult.pageCount, current + 1))
                      }
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>

      {!scoped && !bookshelf.createdCatalog ? (
        <div className="talisbooks-library__account-switch">
          <a
            href="/talisbooks/library?accountType=root"
            className={bookshelf.accountType === "root" ? "is-active" : ""}
          >
            Root shelf
          </a>
          <a
            href="/talisbooks/library?accountType=derivative"
            className={bookshelf.accountType === "derivative" ? "is-active" : ""}
          >
            Derivative shelf
          </a>
        </div>
      ) : null}
    </div>
  );
}
