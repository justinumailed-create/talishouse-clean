"use client";

import Link from "next/link";
import TalisBooksLibraryShell from "@/components/talisbooks/library/TalisBooksLibraryShell";
import type { IsolatedBookshelfBook } from "@/lib/talisbooks/isolated-bookshelf-service";
import { ISOLATED_BOOKSHELF_CREATE_PATH } from "@/lib/talisbooks/isolated-bookshelf";
import { allPinsClaimedHref } from "@/lib/talispros/allpins-mapsite-ui";
import { displayShelfBookTitle } from "@/lib/talisbooks/book-title";
import { ALLPINS_FAST_CODE } from "@/lib/talispros/allpins-mapsite-constants";
import { TALISBOOKS_LIBRARY_SPINE_PALETTES } from "@/lib/talisbooks/library/constants";
import type {
  TalisBooksBookshelf,
  TalisBooksLibraryBook,
} from "@/lib/talisbooks/library/types";
import {
  PINNED_TALISBOOK_SLUG,
  pinnedTalisBookLibraryEntry,
} from "@/lib/talisbooks/library/pinned-catalog";
import type { TalisBooksPublishStatus } from "@/lib/talisbooks/types";

function toPublishStatus(value: string): TalisBooksPublishStatus {
  const allowed: TalisBooksPublishStatus[] = [
    "draft",
    "in_review",
    "scheduled",
    "published",
    "archived",
    "withdrawn",
  ];
  return (allowed as string[]).includes(value)
    ? (value as TalisBooksPublishStatus)
    : "draft";
}

function toLibraryBook(
  book: IsolatedBookshelfBook,
  index: number,
): TalisBooksLibraryBook {
  return {
    id: book.id,
    slug: book.slug,
    title: displayShelfBookTitle(book.title),
    subtitle: book.subtitle || "",
    coverImageUrl: book.coverImageUrl,
    coverTemplateId: null,
    coverGradient:
      TALISBOOKS_LIBRARY_SPINE_PALETTES[
        index % TALISBOOKS_LIBRARY_SPINE_PALETTES.length
      ]!,
    publishStatus: toPublishStatus(book.publishStatus),
    publishedAt: null,
    createdAt: book.createdAt,
    views: 0,
    clicks: 0,
    pageCount: 0,
    accountId: null,
    accountType: "root",
    mapsiteId: null,
    fastCode: book.fastCode || ALLPINS_FAST_CODE,
    parentBookId: null,
    isPinned: false,
    metadata: { isolatedBookshelf: true },
  };
}


/** Built-in Cowboy's Guide — left hero on Common Shelf (above Tokenization). */
function cowboyGuideLibraryEntry(heroCreatedAt: string): TalisBooksLibraryBook {
  const pinned = pinnedTalisBookLibraryEntry();
  return {
    ...pinned,
    title: "Cowboy's Guide",
    subtitle: "The Cowboy's Guide to Outside Capital · Talispros PMC",
    isPinned: true,
    pinRank: 0,
    // Win the newest hero slot so Cowboy sits above Tokenization on the left.
    createdAt: heroCreatedAt,
    publishedAt: heroCreatedAt,
  };
}


/**
 * Prefer Pipeline before Tokenization on the Common Shelf.
 * Newest-first shelf layout uses createdAt, so bump Pipeline ahead of Tokenization.
 */
function pipelineBeforeTokenization(
  books: TalisBooksLibraryBook[],
): TalisBooksLibraryBook[] {
  const pipeline = books.filter((b) => b.title.toLowerCase().includes("pipeline"));
  const tokenization = books.filter((b) =>
    b.title.toLowerCase().includes("tokenization"),
  );
  if (pipeline.length === 0 || tokenization.length === 0) {
    return books;
  }
  const tokenTimes = tokenization.map((b) => Date.parse(b.createdAt || "") || 0);
  const maxToken = Math.max(...tokenTimes, 0);
  const pipelineTime = new Date(maxToken + 60_000).toISOString();
  const adjustedIds = new Set(pipeline.map((b) => b.id));
  return books.map((book) =>
    adjustedIds.has(book.id)
      ? { ...book, createdAt: pipelineTime, publishedAt: pipelineTime }
      : book,
  );
}

/**
 * Keep Tokenization on the left under Cowboy's Guide (newest-mode remainingPinned).
 * Right-side books and decorative fillers stay unpinned.
 */
function pinTokenizationUnderCowboy(
  books: TalisBooksLibraryBook[],
): TalisBooksLibraryBook[] {
  return books.map((book) =>
    book.title.toLowerCase().includes("tokenization")
      ? { ...book, isPinned: true, pinRank: 1 }
      : book,
  );
}

/** Decorative filler covers so the Common Shelf looks fuller (non-interactive). */
function decorativeShelfFillers(count = 10): TalisBooksLibraryBook[] {
  const titles = [
    "Harbour Lookbook",
    "Prairie Estates",
    "Lakefront Digest",
    "Summit Residences",
    "Garden Court",
    "Northshore Collection",
    "Cedar Ridge",
    "Market Square",
    "Vista Heights",
    "Riverbend Homes",
  ];
  return titles.slice(0, count).map((title, index) => ({
    id: `decorative-shelf-${index + 1}`,
    slug: `decorative-shelf-${index + 1}`,
    title,
    subtitle: "",
    coverImageUrl: null,
    coverTemplateId: null,
    coverGradient:
      TALISBOOKS_LIBRARY_SPINE_PALETTES[
        index % TALISBOOKS_LIBRARY_SPINE_PALETTES.length
      ]!,
    publishStatus: "published" as const,
    publishedAt: "2019-01-01T00:00:00.000Z",
    createdAt: "2019-01-01T00:00:00.000Z",
    views: 0,
    clicks: 0,
    pageCount: 0,
    accountId: null,
    accountType: "root" as const,
    mapsiteId: null,
    fastCode: ALLPINS_FAST_CODE,
    parentBookId: null,
    isPinned: false,
    decorative: true,
    metadata: { decorative: true, isolatedBookshelf: true },
  }));
}

function buildIsolatedAllPinsBookshelf(
  books: IsolatedBookshelfBook[],
): TalisBooksBookshelf {
  return {
    accountId: null,
    accountType: "root",
    accountName: "ALLPINS Talisbooks™",
    fastCode: ALLPINS_FAST_CODE,
    mapsiteId: null,
    scopedToFastCode: true,
    publicCatalog: false,
    createdCatalog: false,
    registrationHref: allPinsClaimedHref(),
    entitlements: null,
    primaryEbook: null,
    books: (() => {
      const libraryBooks = books.map(toLibraryBook);
      const withoutDup = libraryBooks.filter(
        (book) =>
          book.id !== "pinned-talispros-ebook-sample" &&
          book.slug !== PINNED_TALISBOOK_SLUG,
      );
      const ordered = pinTokenizationUnderCowboy(
        pipelineBeforeTokenization(withoutDup),
      );
      // Far-future createdAt so Cowboy always wins the left hero over Pipeline /
      // Tokenization / decorative fillers (newest-mode partition).
      const cowboy = cowboyGuideLibraryEntry("2099-12-31T23:59:59.000Z");
      return [...ordered, ...decorativeShelfFillers(10), cowboy];
    })(),
  };
}

/**
 * Isolated catalogue shelf — same Mapsite™-connected Talisbooks™ shelf UX
 * as `/talisbooks/fast/{code}`, scoped to ALLPINS. Admin-only create stays
 * available when `canCreate`; the chrome matches a normal connected shelf.
 */
export default function IsolatedBookshelfView({
  books,
  canCreate = false,
  fromAllPins = false,
}: {
  books: IsolatedBookshelfBook[];
  /** Retained for callers; no longer shown in shelf chrome. */
  adminFastCode?: string;
  /** Show the Create ebook control (Global Admin session only). */
  canCreate?: boolean;
  /** True when the reader opened this shelf from the ALLPINS Mapsite™ chrome. */
  fromAllPins?: boolean;
}) {
  const bookshelf = buildIsolatedAllPinsBookshelf(books);
  const backHref = allPinsClaimedHref();

  return (
    <div data-testid="isolated-bookshelf" className="relative min-h-dvh">
      <TalisBooksLibraryShell
        bookshelf={bookshelf}
        backHref={backHref}
        compactHeader
        secondaryBackHref={fromAllPins ? backHref : undefined}
        secondaryBackLabel="Back to ALL-PINs"
        headerExtra={
          canCreate ? (
            <Link
              href={ISOLATED_BOOKSHELF_CREATE_PATH}
              className="inline-flex flex-shrink-0 items-center justify-center rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800"
              data-testid="isolated-bookshelf-create"
            >
              Create ebook
            </Link>
          ) : null
        }
      />
    </div>
  );
}
