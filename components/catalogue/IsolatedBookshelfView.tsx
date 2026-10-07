"use client";

import { useT } from "@/lib/i18n/client";
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
    metadata: book.metadata ?? { isolatedBookshelf: true },
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

const TOKENIZATION_TITLE = "Real-World Asset Tokenization";

/** Match Tokenization across title / subtitle / slug (synthetic titles may be blank). */
function isTokenizationBook(book: TalisBooksLibraryBook): boolean {
  const shelfIdentity = [book.title, book.subtitle, book.slug]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return (
    shelfIdentity.includes("tokenization") ||
    shelfIdentity.includes("real-world asset")
  );
}

/**
 * Left slot 2 under Cowboy. Prefer a real isolated listing; otherwise inject a
 * sample cover so the hero-5 niche never leaves Tokenization on the right.
 */
function tokenizationLibraryEntry(
  source: TalisBooksLibraryBook | null,
): TalisBooksLibraryBook {
  if (source) {
    return {
      ...source,
      title: source.title.trim() || TOKENIZATION_TITLE,
      subtitle:
        source.subtitle.trim() ||
        "Talispros™ Real-World Asset Tokenization",
      isPinned: true,
      pinRank: 1,
    };
  }
  return {
    id: "common-shelf-tokenization",
    slug: "real-world-asset-tokenization",
    title: TOKENIZATION_TITLE,
    subtitle: "Talispros™ Real-World Asset Tokenization",
    coverImageUrl: null,
    coverTemplateId: null,
    coverGradient: TALISBOOKS_LIBRARY_SPINE_PALETTES[1]!,
    publishStatus: "published",
    publishedAt: "2026-09-01T00:00:00.000Z",
    createdAt: "2026-09-01T00:00:00.000Z",
    views: 0,
    clicks: 0,
    pageCount: 0,
    accountId: null,
    accountType: "root",
    mapsiteId: null,
    fastCode: ALLPINS_FAST_CODE,
    parentBookId: null,
    isPinned: true,
    pinRank: 1,
    decorative: true,
    metadata: { decorative: true, isolatedBookshelf: true },
  };
}

/** Left hero slots 3–5: sample/dummy covers under Cowboy + Tokenization. */
const LEFT_HERO_DUMMY_TITLES = [
  "Harbour Lookbook",
  "Prairie Estates",
  "Lakefront Digest",
] as const;

function leftHeroDummyBooks(): TalisBooksLibraryBook[] {
  return LEFT_HERO_DUMMY_TITLES.map((title, index) => ({
    id: `left-hero-dummy-${index + 1}`,
    slug: `left-hero-dummy-${index + 1}`,
    title,
    subtitle: "",
    coverImageUrl: null,
    coverTemplateId: null,
    coverGradient:
      TALISBOOKS_LIBRARY_SPINE_PALETTES[
        (index + 2) % TALISBOOKS_LIBRARY_SPINE_PALETTES.length
      ]!,
    publishStatus: "published" as const,
    publishedAt: "2020-01-01T00:00:00.000Z",
    createdAt: "2020-01-01T00:00:00.000Z",
    views: 0,
    clicks: 0,
    pageCount: 0,
    accountId: null,
    accountType: "root" as const,
    mapsiteId: null,
    fastCode: ALLPINS_FAST_CODE,
    parentBookId: null,
    isPinned: true,
    pinRank: 2 + index,
    decorative: true,
    metadata: { decorative: true, isolatedBookshelf: true },
  }));
}

/** Right-shelf decorative fillers (unpinned) — packed at 10 per row. */
function decorativeShelfFillers(count = 10): TalisBooksLibraryBook[] {
  const titles = [
    "Summit Residences",
    "Garden Court",
    "Northshore Collection",
    "Cedar Ridge",
    "Market Square",
    "Vista Heights",
    "Riverbend Homes",
    "Canal District",
    "Oak Hollow",
    "Bayview Commons",
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
      // Left hero-5 (newest-mode): Cowboy, Tokenization, 3 sample dummies.
      const tokenizationSource =
        withoutDup.find(isTokenizationBook) ?? null;
      const rightCatalog = withoutDup.filter(
        (book) => !tokenizationSource || book.id !== tokenizationSource.id,
      );
      const cowboy = cowboyGuideLibraryEntry("2099-12-31T23:59:59.000Z");
      const tokenization = tokenizationLibraryEntry(tokenizationSource);
      const leftDummies = leftHeroDummyBooks();
      // Right niche: remaining real books + decorative fillers (10 per row).
      return [
        ...rightCatalog,
        ...decorativeShelfFillers(10),
        ...leftDummies,
        tokenization,
        cowboy,
      ];
    })(),
  };
}

/**
 * Isolated catalogue shelf — same Mapsite-connected Talisbooks™ shelf UX
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
  /** True when the reader opened this shelf from the ALLPINS Mapsite chrome. */
  fromAllPins?: boolean;
}) {
  const bs = useT().bookshelf;
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
              className="inline-flex flex-shrink-0 items-center justify-center rounded-xl bg-[var(--talis-nav-blue)] px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-[var(--talis-nav-blue-hover)]"
              data-testid="isolated-bookshelf-create"
            >
              {bs.createEbook}
            </Link>
          ) : null
        }
      />
    </div>
  );
}
