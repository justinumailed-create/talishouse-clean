"use client";

import { useLocale } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";
import { faqEssayLibraryBooks } from "@/lib/talisbooks/library/faq-essay-books";
import TalisBooksLibraryShell from "@/components/talisbooks/library/TalisBooksLibraryShell";
import { TalisBooksViewerOriginProvider } from "@/components/talisbooks/library/ViewerOriginContext";
import BookshelfUnlockPanel from "@/components/talisbooks/library/BookshelfUnlockPanel";
import {
  LOCKED_SHELF_DUMMY_COUNT,
  lockedShelfDummyCover,
} from "@/lib/talisbooks/bookshelf/lock";
import { VIEWER_ORIGIN_BOOKSHELF } from "@/lib/talisbooks/viewer/origin";
import type { IsolatedBookshelfBook } from "@/lib/talisbooks/isolated-bookshelf-service";
import { ISOLATED_BOOKSHELF_DEFAULT_DESCRIPTION } from "@/lib/talisbooks/isolated-bookshelf";
import { allPinsClaimedHref } from "@/lib/talispros/allpins-mapsite-ui";
import { displayShelfBookTitle } from "@/lib/talisbooks/book-title";
import { ALLPINS_FAST_CODE } from "@/lib/talispros/allpins-mapsite-constants";
import { TALISBOOKS_LIBRARY_SPINE_PALETTES } from "@/lib/talisbooks/library/constants";
import { BOOKSHELF_PLACEMENT_METADATA_KEY } from "@/lib/talisbooks/library/placement";
import type {
  TalisBooksBookshelf,
  TalisBooksLibraryBook,
} from "@/lib/talisbooks/library/types";
import { PINNED_TALISBOOK_SLUG } from "@/lib/talisbooks/library/pinned-catalog";
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


const TOKENIZATION_TITLE = "Real-World Asset Tokenization";

function metadataIdentityText(book: TalisBooksLibraryBook): string {
  const metadata = book.metadata ?? {};
  return [
    metadata.seoDescription,
    metadata.metaDescription,
    metadata.description,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
}

/**
 * Match the ALLPINS Tokenization listing on the isolated shelf. Title may be a
 * blank/synthetic FAST-code label; RWA copy often lives in metadata SEO fields.
 */
function isTokenizationBook(book: TalisBooksLibraryBook): boolean {
  const shelfIdentity = [
    book.title,
    book.subtitle,
    book.slug,
    metadataIdentityText(book),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (
    shelfIdentity.includes("tokenization") ||
    shelfIdentity.includes("real-world asset") ||
    shelfIdentity.includes(
      ISOLATED_BOOKSHELF_DEFAULT_DESCRIPTION.toLowerCase(),
    )
  ) {
    return true;
  }
  const slug = (book.slug || "").toLowerCase();
  return slug.includes("allpins-isolated") || slug.includes("isolated-shelf");
}

function withoutBookshelfPlacement(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const next = { ...(metadata ?? {}) };
  delete next[BOOKSHELF_PLACEMENT_METADATA_KEY];
  return next;
}

/**
 * Primary left hero on the isolated ALLPINS shelf. Prefer the real ALLPINS
 * Tokenization listing (cover + viewer); otherwise inject a sample cover so
 * Tokenization always owns the large hero slot.
 */
function tokenizationLibraryEntry(
  source: TalisBooksLibraryBook | null,
  heroCreatedAt: string,
): TalisBooksLibraryBook {
  if (source) {
    return {
      ...source,
      // Shelf chrome label — the ALLPINS isolated listing is Tokenization.
      title: TOKENIZATION_TITLE,
      subtitle:
        source.subtitle.trim() || ISOLATED_BOOKSHELF_DEFAULT_DESCRIPTION,
      isPinned: true,
      pinRank: 0,
      // Clear any prior main-shelf anchor so newest-mode can feature this book.
      shelfPlacement: null,
      metadata: {
        ...withoutBookshelfPlacement(source.metadata),
        isolatedBookshelf: true,
      },
      // Win the newest hero slot so Tokenization is the large left feature.
      createdAt: heroCreatedAt,
      publishedAt: heroCreatedAt,
    };
  }
  return {
    id: "allpins-isolated-tokenization",
    slug: "real-world-asset-tokenization",
    title: TOKENIZATION_TITLE,
    subtitle: ISOLATED_BOOKSHELF_DEFAULT_DESCRIPTION,
    coverImageUrl: null,
    coverTemplateId: null,
    coverGradient: TALISBOOKS_LIBRARY_SPINE_PALETTES[1]!,
    publishStatus: "published",
    publishedAt: heroCreatedAt,
    createdAt: heroCreatedAt,
    views: 0,
    clicks: 0,
    pageCount: 0,
    accountId: null,
    accountType: "root",
    mapsiteId: null,
    fastCode: ALLPINS_FAST_CODE,
    parentBookId: null,
    isPinned: true,
    pinRank: 0,
    decorative: true,
    metadata: { decorative: true, isolatedBookshelf: true },
  };
}

/**
 * Left hero slots 2–5: the four TalisU™ FAQ essays as real Talisbooks™
 * (front cover, landscape essay spreads, back cover) in the reader's locale.
 */
function leftHeroFaqBooks(locale: Locale): TalisBooksLibraryBook[] {
  return faqEssayLibraryBooks(locale, TALISBOOKS_LIBRARY_SPINE_PALETTES).map(
    (book) => ({ ...book, fastCode: ALLPINS_FAST_CODE }),
  );
}

/**
 * Locked right shelf: dummy covers only (no links, no titles shown) —
 * 4 rows × 10 behind the blur. Real catalogue books stay off the locked shelf.
 */
export function lockedShelfDummyBooks(
  count = LOCKED_SHELF_DUMMY_COUNT,
): TalisBooksLibraryBook[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `decorative-shelf-${index + 1}`,
    slug: `decorative-shelf-${index + 1}`,
    title: "",
    subtitle: "",
    coverImageUrl: null,
    coverTemplateId: null,
    coverGradient: lockedShelfDummyCover(index),
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

export function buildIsolatedAllPinsBookshelf(
  books: IsolatedBookshelfBook[],
  locale: Locale = "en",
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
      // Left hero-5 (newest-mode): ALLPINS Tokenization as primary hero + 4 TalisU™ FAQ books.
      const tokenizationSource =
        withoutDup.find(isTokenizationBook) ?? null;
      const tokenization = tokenizationLibraryEntry(
        tokenizationSource,
        "2099-12-31T23:59:59.000Z",
      );
      const leftFaqBooks = leftHeroFaqBooks(locale);
      // Right niche: locked — dummy covers only (blurred, Register / FAST Code unlock).
      return [
        ...lockedShelfDummyBooks(),
        ...leftFaqBooks,
        tokenization,
      ];
    })(),
  };
}

/**
 * Isolated catalogue shelf — same Mapsite-connected Talisbooks™ shelf UX
 * as `/talisbooks/fast/{code}`, scoped to ALLPINS. The shelf header carries
 * no Create ebook control; admins create from `/catalogue/bookshelf/create`.
 */
export default function IsolatedBookshelfView({
  books,
  fromAllPins = false,
}: {
  books: IsolatedBookshelfBook[];
  /** Retained for callers; no longer shown in shelf chrome. */
  adminFastCode?: string;
  /** Retained for callers; the shelf header no longer shows Create ebook. */
  canCreate?: boolean;
  /** True when the reader opened this shelf from the ALLPINS Mapsite chrome. */
  fromAllPins?: boolean;
}) {
  const locale = useLocale();
  const bookshelf = buildIsolatedAllPinsBookshelf(books, locale);
  const backHref = allPinsClaimedHref();

  return (
    <div data-testid="isolated-bookshelf" className="relative min-h-dvh">
      {/* Viewer links from this shelf carry ?from=bookshelf (no Claim / Assign, Back to Bookshelf). */}
      <TalisBooksViewerOriginProvider value={VIEWER_ORIGIN_BOOKSHELF}>
        <TalisBooksLibraryShell
          bookshelf={bookshelf}
          backHref={backHref}
          compactHeader
          secondaryBackHref={fromAllPins ? backHref : undefined}
          secondaryBackLabel="Back to ALL-PINs"
          generalLock={<BookshelfUnlockPanel />}
        />
      </TalisBooksViewerOriginProvider>
    </div>
  );
}
