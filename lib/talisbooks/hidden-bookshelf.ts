/**
 * Hidden bookshelf: an unlisted shelf at `/private-shelf`, opened only by
 * direct link. Never add these routes to a nav bar, footer, dropdown,
 * `lib/seo/pages.json` (the sitemap source) or any other listing.
 *
 * Data-driven: to add a book, render its covers and spreads into
 * `public/hidden-bookshelf/{slug}/` and append one entry to HIDDEN_BOOKS.
 * Each book reads at `/private-shelf/{slug}` in the same page-turning
 * reader as Ralf's TalisU™ FAQ books.
 */
import type { Metadata } from "next";
import type { TalisBooksViewerBook, TalisBooksViewerPage } from "@/lib/talisbooks/viewer/types";
import type { HiddenBook } from "@/lib/talisbooks/hidden-bookshelf-types";
import {
  TSPLITS_JOURNEY_ASSET_BASE,
  TSPLITS_JOURNEY_PAGES,
} from "@/lib/talisbooks/hidden-books/tsplits-journey";
import {
  HIDDEN_BOOKSHELF_PATH,
  isHiddenBookshelfPath,
} from "@/lib/talisbooks/hidden-bookshelf-paths";

export type { HiddenBook, HiddenBookBlock, HiddenBookPage } from "@/lib/talisbooks/hidden-bookshelf-types";

export { HIDDEN_BOOKSHELF_PATH, isHiddenBookshelfPath };
export const HIDDEN_BOOKSHELF_TITLE = "Private Bookshelf";

function bookAssets(assetBase: string) {
  return {
    assetBase,
    coverImage: `${assetBase}/cover-thumb.jpg`,
    frontCover: `${assetBase}/front.jpg`,
    backCover: `${assetBase}/back.jpg`,
  };
}

export const HIDDEN_BOOKS: readonly HiddenBook[] = [
  {
    slug: "tsplits-journey",
    title: "Tsplits™ Journey",
    subtitle: "From a single PIN to a finished product, February to November 2026",
    description:
      "The story of how Tsplits™ was built from scratch in 2026, written for Ralf Meyer.",
    ...bookAssets(TSPLITS_JOURNEY_ASSET_BASE),
    spreads: 14,
    pages: TSPLITS_JOURNEY_PAGES,
    coverGradient: "linear-gradient(180deg, #1b2a4a 0%, #24406f 100%)",
  },
];

/** `robots` for every hidden route: no index, no follow, no cache. */
export const HIDDEN_BOOKSHELF_ROBOTS = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false },
} as const satisfies Metadata["robots"];

export function hiddenBookHref(slug: string): string {
  return `${HIDDEN_BOOKSHELF_PATH}/${slug}`;
}

export function getHiddenBook(slug: string): HiddenBook | null {
  const normalized = (slug || "").trim().toLowerCase();
  return HIDDEN_BOOKS.find((book) => book.slug === normalized) ?? null;
}

/** Total pages: front cover, two per spread, back cover. */
export function hiddenBookPageCount(book: HiddenBook): number {
  return 2 + book.spreads * 2;
}

/**
 * Unlisted metadata on top of a noindex base: own title and description,
 * the book cover as the share image, and robots noindex / nofollow / nocache.
 */
export function hiddenBookshelfMetadata(
  base: Metadata,
  input: { title: string; description: string; path: string; image?: string },
): Metadata {
  const openGraph = {
    ...(base.openGraph ?? {}),
    title: input.title,
    description: input.description,
    ...(input.image
      ? { images: [{ url: input.image, width: 1200, height: 1340, alt: input.title }] }
      : {}),
  };
  const twitter = {
    ...(base.twitter ?? {}),
    title: input.title,
    description: input.description,
    ...(input.image ? { images: [input.image] } : {}),
  };
  return {
    ...base,
    title: input.title,
    description: input.description,
    alternates: { canonical: input.path },
    openGraph,
    twitter,
    robots: HIDDEN_BOOKSHELF_ROBOTS,
  } as Metadata;
}

/** Reader book: front cover, landscape spreads, back cover. */
export function createHiddenViewerBook(book: HiddenBook): TalisBooksViewerBook {
  const totalPages = hiddenBookPageCount(book);
  const pages: TalisBooksViewerPage[] = [
    {
      id: `${book.slug}-front`,
      pageNumber: 1,
      pageRole: "cover",
      layout: "cover",
      title: book.title,
      subtitle: book.subtitle,
      heroImageUrl: book.frontCover,
      exactPdfPage: true,
      clientEditable: false,
    },
  ];
  for (let spread = 1; spread <= book.spreads; spread += 1) {
    const image = `${book.assetBase}/spread-${String(spread).padStart(2, "0")}.jpg`;
    const left = spread * 2;
    for (const [side, pageNumber] of [
      ["left", left],
      ["right", left + 1],
    ] as const) {
      const copy = book.pages.find((page) => page.pageNumber === pageNumber);
      pages.push({
        id: `${book.slug}-p${String(pageNumber).padStart(2, "0")}-${side}`,
        pageNumber,
        pageRole: "property_content",
        layout: side === "left" ? "centerfold_left" : "centerfold_right",
        title: copy?.title ?? "",
        body: "",
        heroImageUrl: image,
        spreadImageUrl: image,
        exactPdfPage: true,
        clientEditable: false,
      });
    }
  }
  pages.push({
    id: `${book.slug}-back`,
    pageNumber: totalPages,
    pageRole: "cover",
    layout: "cover",
    title: book.title,
    subtitle: book.subtitle,
    heroImageUrl: book.backCover,
    exactPdfPage: true,
    clientEditable: false,
  });

  return {
    id: `hidden-${book.slug}`,
    slug: book.slug,
    title: book.title,
    subtitle: book.subtitle,
    description: book.description,
    viewerStyle: "magazine",
    coverSpreadOpening: false,
    frontCoverImageUrl: book.frontCover,
    backCoverImageUrl: book.backCover,
    pages,
  };
}
