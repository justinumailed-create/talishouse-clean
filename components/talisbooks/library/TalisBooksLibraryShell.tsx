"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { ArrowDownUp, Search } from "lucide-react";
import TalisBooksStandingBook from "@/components/talisbooks/library/TalisBooksStandingBook";
import {
  TALISBOOKS_ECOSYSTEM_SHELF_PROFILES,
  TALISBOOKS_LIBRARY_BOOK_PRICE_USD,
  TALISBOOKS_LIBRARY_GENERAL_COLUMNS,
  TALISBOOKS_LIBRARY_GENERAL_PAGE_SIZE,
  TALISBOOKS_LIBRARY_MONTHLY_CAPACITY_USD,
  TALISBOOKS_LIBRARY_SHELF_CAPACITY,
  TALISBOOKS_LIBRARY_SORT_OPTIONS,
} from "@/lib/talisbooks/library/constants";
import { partitionBookshelf } from "@/lib/talisbooks/library/partition";
import { queryLibraryBooks } from "@/lib/talisbooks/library/query";
import type {
  TalisBooksBookshelf,
  TalisBooksLibraryBook,
  TalisBooksLibrarySort,
} from "@/lib/talisbooks/library/types";

interface TalisBooksLibraryShellProps {
  bookshelf: TalisBooksBookshelf;
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
}: {
  books: TalisBooksLibraryBook[];
  size: "hero" | "featured" | "compact";
  startIndex?: number;
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

export default function TalisBooksLibraryShell({ bookshelf }: TalisBooksLibraryShellProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<TalisBooksLibrarySort>("title_asc");
  const [page, setPage] = useState(1);
  const [featuredCapacity, setFeaturedCapacity] = useState<5 | 6>(5);
  const [, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const { featured, general, featuredLayout } = useMemo(
    () => partitionBookshelf(bookshelf.books, { featuredCapacity }),
    [bookshelf.books, featuredCapacity],
  );

  const generalResult = useMemo(
    () =>
      queryLibraryBooks(general, {
        search: deferredSearch,
        sort,
        page,
        pageSize: TALISBOOKS_LIBRARY_GENERAL_PAGE_SIZE,
      }),
    [general, deferredSearch, sort, page],
  );

  const generalRows = useMemo(
    () => chunkRows(generalResult.books, TALISBOOKS_LIBRARY_GENERAL_COLUMNS),
    [generalResult.books],
  );

  const stocked = Math.min(bookshelf.books.length, TALISBOOKS_LIBRARY_SHELF_CAPACITY);
  const monthlyEstimate = Math.round(stocked * TALISBOOKS_LIBRARY_BOOK_PRICE_USD * 100) / 100;
  const ttvProfile = TALISBOOKS_ECOSYSTEM_SHELF_PROFILES.find(
    (entry) => entry.productCode === "TTV",
  );

  const heroBook = featuredLayout === "hero-plus-4" ? featured[0] : null;
  const featuredRest =
    featuredLayout === "hero-plus-4" ? featured.slice(1) : featured;

  return (
    <div className="talisbooks-library">
      <header className="talisbooks-library__topbar">
        <div className="talisbooks-library__brand">
          <p className="talisbooks-library__eyebrow">
            {bookshelf.accountType === "root" ? "Root Account" : "Derivative Account"}
            {bookshelf.fastCode ? ` · ${bookshelf.fastCode.toUpperCase()}` : ""}
          </p>
          <h1 className="talisbooks-library__title">Bookshelf</h1>
        </div>

        <label className="talisbooks-library__search">
          <Search className="talisbooks-library__search-icon" aria-hidden="true" />
          <span className="sr-only">Search books</span>
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              startTransition(() => setPage(1));
            }}
            placeholder="Search library…"
            className="talisbooks-library__search-input"
          />
        </label>

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
      </header>

      {ttvProfile ? (
        <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Ecosystem Shelf Framework
              </p>
              <h2 className="mt-1 text-base font-semibold text-neutral-900">
                TalisTV™ Video Shelf is pre-wired
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Same split-shelf layout model, tuned for premium video monetization.
              </p>
              <Link
                href="/talistv"
                className="mt-2 inline-block text-xs font-medium text-neutral-700 underline underline-offset-4 hover:text-neutral-900"
              >
                Preview TalisTV shelf profile
              </Link>
            </div>
            <div className="rounded-xl bg-neutral-900 px-3 py-2 text-right text-white">
              <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-300">
                Upcoming TTV Capacity
              </p>
              <p className="text-sm font-semibold">
                {ttvProfile.capacity} {ttvProfile.unitLabel} · $
                {ttvProfile.monthlyCapacityUsd.toFixed(2)}/mo
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <div className="talisbooks-library__case">
        <div className="talisbooks-library__split">
          {/* Left alcove — Highlighted / Scheduled */}
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
                    <p>No highlighted books yet</p>
                  </div>
                ) : featuredLayout === "hero-plus-4" && heroBook ? (
                  <div className="talisbooks-library__featured talisbooks-library__featured--hero">
                    <ShelfRow books={[heroBook]} size="hero" startIndex={0} />
                    <ShelfRow
                      books={featuredRest.slice(0, 2)}
                      size="featured"
                      startIndex={1}
                    />
                    <ShelfRow
                      books={featuredRest.slice(2, 4)}
                      size="featured"
                      startIndex={3}
                    />
                  </div>
                ) : (
                  <div className="talisbooks-library__featured talisbooks-library__featured--grid">
                    <ShelfRow books={featured.slice(0, 3)} size="featured" startIndex={0} />
                    <ShelfRow books={featured.slice(3, 6)} size="featured" startIndex={3} />
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="talisbooks-library__mullion" aria-hidden="true" />

          {/* Right alcove — General Library 4×5 */}
          <section
            className="talisbooks-library__niche talisbooks-library__niche--general"
            aria-label="General library"
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
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="talisbooks-library__alcove">
                {generalResult.books.length === 0 ? (
                  <div className="talisbooks-library__niche-empty">
                    <p>No books match{deferredSearch ? ` “${deferredSearch}”` : ""}</p>
                    {/* Empty shelf still shows physical planks */}
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
                      startIndex={rowIndex * TALISBOOKS_LIBRARY_GENERAL_COLUMNS}
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
    </div>
  );
}
