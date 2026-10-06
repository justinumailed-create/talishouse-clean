"use client";

import { useT } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/format";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownUp } from "lucide-react";
import TalisBooksStandingBook from "@/components/talisbooks/library/TalisBooksStandingBook";
import { deleteLibraryEbookAction } from "@/app/talisbooks/library/actions";
import {
  TALISBOOKS_LIBRARY_BOOK_PRICE_USD,
  TALISBOOKS_LIBRARY_MONTHLY_CAPACITY_USD,
  TALISBOOKS_LIBRARY_SHELF_CAPACITY,
  TALISBOOKS_LIBRARY_SORT_OPTIONS,
  generalShelfColumns,
  packShelfRowsNewestAtLeft,
  TALISBOOKS_LIBRARY_GENERAL_ROWS,
} from "@/lib/talisbooks/library/constants";
import {
  layoutMainShelfRows,
  layoutNicheRows,
  readBookshelfPlacement,
} from "@/lib/talisbooks/library/placement";
import { partitionBookshelf } from "@/lib/talisbooks/library/partition";
import { sortLibraryBooks } from "@/lib/talisbooks/library/query";
import { displayShelfBookTitle } from "@/lib/talisbooks/book-title";
import {
  resolveClaimMapsiteId,
  TALISBOOKS_SAMCART_REGISTER_URL,
  talisBooksShelfCta,
} from "@/lib/talisbooks/cta-mode";
import DemoClaimMarketButton from "@/components/talispros/mapsite/DemoClaimMarketButton";
import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";
import type {
  TalisBooksBookshelf,
  TalisBooksLibraryBook,
  TalisBooksLibrarySort,
} from "@/lib/talisbooks/library/types";

interface TalisBooksLibraryShellProps {
  bookshelf: TalisBooksBookshelf;
  canDelete?: boolean;
  /** Retained for callers; shelf UI no longer renders a Mapsite back CTA. */
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
  books: Array<TalisBooksLibraryBook | null>;
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
        {books.map((book, index) =>
          book ? (
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
          ) : (
            <div
              key={`gap-${startIndex + index}`}
              className="talisbooks-library__shelf-slot talisbooks-library__shelf-slot--gap"
              aria-hidden="true"
            />
          ),
        )}
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
  backHref: _backHref,
  headerExtra,
  compactHeader = false,
  secondaryBackHref,
  secondaryBackLabel = "Back to ALL-PINs",
}: TalisBooksLibraryShellProps) {
  const bs = useT().bookshelf;
  const router = useRouter();
  const ownerOrdered = Boolean(bookshelf.ownerOrdered);
  // Owner-ordered FAST shelves keep the saved order until a sort pill is chosen.
  const [sort, setSort] = useState<TalisBooksLibrarySort | "owner">(
    ownerOrdered ? "owner" : "published_desc",
  );
  const [page, setPage] = useState(1);
  const [featuredCapacity, setFeaturedCapacity] = useState<5 | 6>(5);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const scoped = Boolean(bookshelf.scopedToFastCode && bookshelf.fastCode);
  const publicCatalog = Boolean(bookshelf.publicCatalog);
  const createdCatalog = Boolean(bookshelf.createdCatalog);

  // _backHref retained for caller compatibility; shelves no longer render a Mapsite back CTA.
  void _backHref;
  const shelfCta = scoped ? talisBooksShelfCta(bookshelf.fastCode) : null;
  const claimMapsiteId = resolveClaimMapsiteId(bookshelf.mapsiteId);

  const visibleBooks = useMemo(
    () => bookshelf.books.filter((book) => !deletedIds.includes(book.id)),
    [bookshelf.books, deletedIds],
  );

  const anchoredBooks = useMemo(
    () => visibleBooks.filter((book) => readBookshelfPlacement(book)),
    [visibleBooks],
  );
  const anchoredIds = useMemo(
    () => new Set(anchoredBooks.map((book) => book.id)),
    [anchoredBooks],
  );
  const flexibleBooks = useMemo(
    () => visibleBooks.filter((book) => !anchoredIds.has(book.id)),
    [visibleBooks, anchoredIds],
  );

  const { featured, general, featuredLayout } = useMemo(
    () =>
      partitionBookshelf(flexibleBooks, {
        featuredCapacity,
        featuredMode:
          ownerOrdered && sort === "owner"
            ? "ordered"
            : scoped || createdCatalog
              ? "newest"
              : "fill",
      }),
    [flexibleBooks, featuredCapacity, scoped, createdCatalog, ownerOrdered, sort],
  );

  const mainAnchors = useMemo(
    () => anchoredBooks.filter((book) => readBookshelfPlacement(book)?.shelf === 2),
    [anchoredBooks],
  );
  const leftAnchors = useMemo(
    () => anchoredBooks.filter((book) => readBookshelfPlacement(book)?.shelf === 1),
    [anchoredBooks],
  );

  const featuredLayoutResult = useMemo(
    () =>
      layoutNicheRows(
        featured,
        leftAnchors,
        1,
        featuredLayout === "grid-3x2" ? [3, 3] : [1, 2, 2],
      ),
    [featured, leftAnchors, featuredLayout],
  );
  const featuredRows = featuredLayoutResult.rows;

  const sortedGeneral = useMemo(
    () =>
      sort === "owner"
        ? [...general, ...featuredLayoutResult.overflow]
        : sortLibraryBooks([...general, ...featuredLayoutResult.overflow], sort),
    [general, featuredLayoutResult.overflow, sort],
  );

  const generalColumns = generalShelfColumns(sortedGeneral.length + mainAnchors.length);
  const generalRowsAll = useMemo(() => {
    if (mainAnchors.length === 0) {
      return packShelfRowsNewestAtLeft(sortedGeneral, generalColumns);
    }
    return layoutMainShelfRows(sortedGeneral, mainAnchors, generalColumns);
  }, [sortedGeneral, mainAnchors, generalColumns]);

  const generalPageCount = Math.max(
    1,
    Math.ceil(generalRowsAll.length / TALISBOOKS_LIBRARY_GENERAL_ROWS),
  );
  const generalPage = Math.min(page, generalPageCount);
  const generalRows = generalRowsAll.slice(
    (generalPage - 1) * TALISBOOKS_LIBRARY_GENERAL_ROWS,
    generalPage * TALISBOOKS_LIBRARY_GENERAL_ROWS,
  );
  const generalTotal = sortedGeneral.length + mainAnchors.length;

  const stocked = Math.min(visibleBooks.length, TALISBOOKS_LIBRARY_SHELF_CAPACITY);
  const monthlyEstimate = Math.round(stocked * TALISBOOKS_LIBRARY_BOOK_PRICE_USD * 100) / 100;

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
    <div className="talisbooks-library-shell">
      <TalisUMktsHeader />
      <div className="talisbooks-library">
      <header className="talisbooks-library__topbar">
        <div className="talisbooks-library__brand">
          {compactHeader ? (
            <h1 className="talisbooks-library__title">{bs.title}</h1>
          ) : (
            <>
              <p className="talisbooks-library__eyebrow">
                {publicCatalog
                  ? scoped
                    ? `Talispros™ Ecosystem · ${bookshelf.fastCode!.toUpperCase()}`
                    : bs.ecosystem
                  : createdCatalog
                    ? bs.ecosystem
                  : scoped
                    ? `TEB™ · ${bookshelf.fastCode!.toUpperCase()}`
                    : bookshelf.accountType === "root"
                      ? bs.rootAccount
                      : bs.derivativeAccount}
                {!publicCatalog && !createdCatalog && !scoped && bookshelf.fastCode
                  ? ` · ${bookshelf.fastCode.toUpperCase()}`
                  : ""}
              </p>
              <h1 className="talisbooks-library__title">
                {publicCatalog
                  ? "TalisBooks™"
                  : scoped
                    ? bookshelf.accountName
                    : bs.title}
              </h1>
              {publicCatalog || createdCatalog ? (
                <p className="talisbooks-library__subtitle">
                  {scoped && bookshelf.fastCode
                    ? fmt(bs.subtitleScoped, { code: bookshelf.fastCode.toUpperCase() })
                    : createdCatalog
                      ? bs.subtitleCreated
                      : bs.subtitlePublic}
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="talisbooks-library__header-actions">
          {!compactHeader && !publicCatalog && !createdCatalog ? (
            <div
              className="talisbooks-library__capacity"
              title={bs.capacityTitle}
            >
              <span className="talisbooks-library__capacity-label">{bs.capacityLabel}</span>
              <strong>
                {stocked}/{TALISBOOKS_LIBRARY_SHELF_CAPACITY}
              </strong>
              <span className="talisbooks-library__capacity-value">
                ${monthlyEstimate.toFixed(2)} / ${TALISBOOKS_LIBRARY_MONTHLY_CAPACITY_USD.toFixed(2)}{" "}
                {bs.perMonth}
              </span>
            </div>
          ) : null}
          {headerExtra}
          {scoped && shelfCta === "claim" ? (
            <div className="talisbooks-library__claim">
              <DemoClaimMarketButton
                mapsiteId={claimMapsiteId}
                align="end"
              />
            </div>
          ) : null}
          {scoped && shelfCta === "register" ? (
            <a
              href={TALISBOOKS_SAMCART_REGISTER_URL}
              className="talisbooks-library__back"
              target="_blank"
              rel="noopener noreferrer"
            >
              {bs.register}
            </a>
          ) : null}
          {secondaryBackHref ? (
            <Link href={secondaryBackHref} className="talisbooks-library__back">
              {secondaryBackLabel === "Back to ALL-PINs"
                ? bs.backToAllPins
                : secondaryBackLabel}
            </Link>
          ) : null}
        </div>
      </header>

      {!compactHeader && scoped && bookshelf.entitlements && !bookshelf.entitlements.activated ? (
        <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          <p className="font-medium text-neutral-900">{bs.lockedTitle}</p>
          <p className="mt-1 text-neutral-600">
            {bs.lockedBody}
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
            aria-label={bs.highlightedAria}
          >
            <div className="talisbooks-library__niche-inner">
              <div className="talisbooks-library__niche-header">
                <div
                  className="talisbooks-library__layout-toggle"
                  role="group"
                  aria-label={bs.featuredLayoutAria}
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
                {featuredRows.length === 0 ? (
                  <div className="talisbooks-library__niche-empty">
                    <p>
                      {visibleBooks.length > 0
                        ? bs.emptyFeatured
                        : publicCatalog
                          ? bs.emptyPublished
                          : createdCatalog
                            ? bs.emptyCreated
                            : scoped
                              ? bs.emptyScoped
                              : bs.emptyHighlighted}
                    </p>
                  </div>
                ) : (
                  <div
                    className={
                      featuredLayout === "hero-plus-4"
                        ? "talisbooks-library__featured talisbooks-library__featured--hero"
                        : "talisbooks-library__featured talisbooks-library__featured--grid"
                    }
                  >
                    {featuredRows.map((row, rowIndex) => (
                      <ShelfRow
                        key={`featured-row-${rowIndex}`}
                        books={row}
                        size={
                          featuredLayout === "hero-plus-4" && rowIndex === 0
                            ? "hero"
                            : "featured"
                        }
                        startIndex={featuredRows
                          .slice(0, rowIndex)
                          .reduce((sum, previous) => sum + previous.length, 0)}
                        {...shelfControls}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="talisbooks-library__mullion" aria-hidden="true" />

          <section
            className="talisbooks-library__niche talisbooks-library__niche--general"
            aria-label={bs.generalAria}
          >
            <div className="talisbooks-library__niche-inner">
              <div className="talisbooks-library__niche-header talisbooks-library__niche-header--end">
                <div className="talisbooks-library__sort-pills">
                  {ownerOrdered ? (
                    <button
                      type="button"
                      className={[
                        "talisbooks-library__sort-pill",
                        sort === "owner" ? "is-active" : "",
                      ].join(" ")}
                      onClick={() => {
                        setSort("owner");
                        setPage(1);
                      }}
                    >
                      {bs.savedOrder}
                    </button>
                  ) : null}
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
                      {(bs.sort as Record<string, string>)[option.value] ?? option.label}
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
                {generalTotal === 0 ? (
                  <div className="talisbooks-library__niche-empty">
                    <p>{bs.noBooks}</p>
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
                  {fmt(bs.pageCount, {
                    page: generalPage,
                    count: generalPageCount,
                    total: generalTotal,
                  })}
                </span>
                {generalPageCount > 1 ? (
                  <div className="talisbooks-library__pager-actions">
                    <button
                      type="button"
                      disabled={generalPage <= 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      {bs.prev}
                    </button>
                    <button
                      type="button"
                      disabled={generalPage >= generalPageCount}
                      onClick={() =>
                        setPage((current) => Math.min(generalPageCount, current + 1))
                      }
                    >
                      {bs.next}
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
            {bs.rootShelf}
          </a>
          <a
            href="/talisbooks/library?accountType=derivative"
            className={bookshelf.accountType === "derivative" ? "is-active" : ""}
          >
            {bs.derivativeShelf}
          </a>
        </div>
      ) : null}
      </div>
    </div>
  );
}
