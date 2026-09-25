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
    books: books.map(toLibraryBook),
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
