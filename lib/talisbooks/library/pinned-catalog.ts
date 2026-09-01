/**
 * Built-in pinned TalisBook™ for the public /talisbooks bookshelf.
 *
 * Architecture:
 *   front cover asset  → /talisbooks/pinned/front-cover.jpg
 *   back cover asset   → /talisbooks/pinned/back-cover.jpg
 *   interior PDF pages → /talisbooks/pinned/pages/page-NN.jpg
 *
 * Covers are supplied separately from the interior PDF (page 1 of the PDF
 * is NOT treated as the final front cover for this demonstration book).
 *
 * Every interior PDF page is landscape and renders as a continuous centerfold
 * (one source image spanning left + right leaves).
 */

import type { TalisBooksLibraryBook } from "./types";
import type { TalisBooksViewerBook, TalisBooksViewerPage } from "../viewer/types";

export const PINNED_TALISBOOK_SLUG = "talispros-ebook-sample";
export const PINNED_TALISBOOK_ASSET_ROOT = "/talisbooks/pinned";
export const PINNED_TALISBOOK_PDF_PATH = `${PINNED_TALISBOOK_ASSET_ROOT}/talispros-ebook-sample.pdf`;
export const PINNED_TALISBOOK_PDF_FILE_NAME = "TalisPros-Ebook-Sample.pdf";
export const PINNED_TALISBOOK_INTERIOR_PAGE_COUNT = 11;

/** Front + back covers + 2 leaves per interior landscape slide. */
export const PINNED_TALISBOOK_PAGE_COUNT =
  2 + PINNED_TALISBOOK_INTERIOR_PAGE_COUNT * 2;

function interiorCenterfoldPair(
  startPage: number,
  slideIndex: number,
): TalisBooksViewerPage[] {
  const n = String(slideIndex).padStart(2, "0");
  const spreadImageUrl = `${PINNED_TALISBOOK_ASSET_ROOT}/pages/page-${n}.jpg`;
  return [
    {
      id: `pinned-p${n}-left`,
      pageNumber: startPage,
      pageRole: "property_content",
      layout: "centerfold_left",
      title: "",
      body: "",
      heroImageUrl: spreadImageUrl,
      spreadImageUrl,
      exactPdfPage: true,
      clientEditable: false,
    },
    {
      id: `pinned-p${n}-right`,
      pageNumber: startPage + 1,
      pageRole: "property_content",
      layout: "centerfold_right",
      title: "",
      body: "",
      heroImageUrl: spreadImageUrl,
      spreadImageUrl,
      exactPdfPage: true,
      clientEditable: false,
    },
  ];
}

export function pinnedTalisBookLibraryEntry(): TalisBooksLibraryBook {
  return {
    id: "pinned-talispros-ebook-sample",
    slug: PINNED_TALISBOOK_SLUG,
    title: "Talispros eBook",
    subtitle: "Pinned demonstration · cover wrap + interior PDF",
    coverImageUrl: `${PINNED_TALISBOOK_ASSET_ROOT}/front-cover.jpg`,
    coverTemplateId: null,
    coverGradient: "linear-gradient(145deg, #1c1917 0%, #44403c 55%, #a8a29e 100%)",
    publishStatus: "published",
    publishedAt: "2026-08-24T12:00:00.000Z",
    views: 0,
    clicks: 0,
    pageCount: PINNED_TALISBOOK_PAGE_COUNT,
    accountId: null,
    accountType: "root",
    mapsiteId: null,
    fastCode: null,
    parentBookId: null,
    isPinned: true,
  };
}

export function createPinnedTalisBookViewer(): TalisBooksViewerBook {
  const front = `${PINNED_TALISBOOK_ASSET_ROOT}/front-cover.jpg`;
  const back = `${PINNED_TALISBOOK_ASSET_ROOT}/back-cover.jpg`;
  const pages: TalisBooksViewerPage[] = [
    {
      id: "pinned-front",
      pageNumber: 1,
      pageRole: "cover",
      layout: "cover",
      title: "Talispros eBook",
      subtitle: "Demonstration TalisBook™",
      heroImageUrl: front,
      exactPdfPage: true,
      clientEditable: false,
    },
  ];

  for (let i = 1; i <= PINNED_TALISBOOK_INTERIOR_PAGE_COUNT; i += 1) {
    const startPage = 2 + (i - 1) * 2;
    pages.push(...interiorCenterfoldPair(startPage, i));
  }

  pages.push({
    id: "pinned-back",
    pageNumber: PINNED_TALISBOOK_PAGE_COUNT,
    pageRole: "cover",
    layout: "cover",
    title: "Talispros eBook",
    heroImageUrl: back,
    exactPdfPage: true,
    clientEditable: false,
  });

  return {
    id: "pinned-talispros-ebook-sample",
    slug: PINNED_TALISBOOK_SLUG,
    title: "Talispros eBook",
    subtitle: "Pinned demonstration",
    listingProfile: "fsbo",
    viewerStyle: "magazine",
    coverSpreadOpening: false,
    frontCoverImageUrl: front,
    backCoverImageUrl: back,
    pdfDownloadUrl: PINNED_TALISBOOK_PDF_PATH,
    pdfDownloadFileName: PINNED_TALISBOOK_PDF_FILE_NAME,
    pages,
  };
}
