/**
 * North Shore Nature Centre TEB™, the eBook on the demo Mapsite PIN in
 * Bay St. Lawrence, Nova Scotia. Interior centerfolds after the cover wrap. Each slide is shown as a
 * centerfold (one image across the left and right leaves). The front cover is
 * the right half of slide 1, the back cover is its left half (Aisha and the
 * team contact). Assets live in `/public/talisbooks/nsnc/`.
 */
import type { Locale } from "@/lib/i18n/config";
import type { TalisBooksViewerBook, TalisBooksViewerPage } from "@/lib/talisbooks/viewer/types";

export const NSNC_BOOK_SLUG = "north-shore-nature-centre";
export const NSNC_ASSET_ROOT = "/talisbooks/nsnc";
export const NSNC_SLIDE_COUNT = 12;
export const NSNC_PIN_IMAGE = `${NSNC_ASSET_ROOT}/pin.webp`;
export const NSNC_FRONT_COVER = `${NSNC_ASSET_ROOT}/front-cover.webp`;
export const NSNC_BACK_COVER = `${NSNC_ASSET_ROOT}/back-cover.webp`;
export const NSNC_PDF_PATH = `${NSNC_ASSET_ROOT}/North-Shore-Nature-Centre.pdf`;
export const NSNC_PDF_FILE_NAME = "North-Shore-Nature-Centre.pdf";
export const NSNC_BOOK_HREF = `/talisbooks/viewer/${NSNC_BOOK_SLUG}`;

/** Proper name of the place; the same in every language. */
export const NSNC_TITLE = "North Shore Nature Centre";

const COPY: Record<Locale, { title: string; subtitle: string }> = {
  en: { title: NSNC_TITLE, subtitle: "Bay St. Lawrence, Nova Scotia" },
  de: { title: NSNC_TITLE, subtitle: "Bay St. Lawrence, Neuschottland" },
};

export function nsncSlideHref(slide: number): string {
  return `${NSNC_ASSET_ROOT}/pages/page-${String(slide).padStart(2, "0")}.webp`;
}

export function createNsncViewerBook(locale?: Locale | string | null): TalisBooksViewerBook {
  const copy = COPY[locale === "de" ? "de" : "en"];
  const interiorSlides = NSNC_SLIDE_COUNT - 1;
  const totalPages = 2 + interiorSlides * 2;
  const pages: TalisBooksViewerPage[] = [
    {
      id: `${NSNC_BOOK_SLUG}-front`,
      pageNumber: 1,
      pageRole: "cover",
      layout: "cover",
      title: copy.title,
      subtitle: copy.subtitle,
      heroImageUrl: NSNC_FRONT_COVER,
      exactPdfPage: true,
      clientEditable: false,
    },
  ];
  for (let slide = 2; slide <= NSNC_SLIDE_COUNT; slide += 1) {
    const image = nsncSlideHref(slide);
    const left = (slide - 1) * 2;
    for (const [side, pageNumber] of [
      ["left", left],
      ["right", left + 1],
    ] as const) {
      pages.push({
        id: `${NSNC_BOOK_SLUG}-p${String(pageNumber).padStart(2, "0")}-${side}`,
        pageNumber,
        pageRole: "property_content",
        layout: side === "left" ? "centerfold_left" : "centerfold_right",
        title: "",
        body: "",
        heroImageUrl: image,
        spreadImageUrl: image,
        exactPdfPage: true,
        clientEditable: false,
      });
    }
  }
  pages.push({
    id: `${NSNC_BOOK_SLUG}-back`,
    pageNumber: totalPages,
    pageRole: "cover",
    layout: "cover",
    title: copy.title,
    subtitle: copy.subtitle,
    heroImageUrl: NSNC_BACK_COVER,
    exactPdfPage: true,
    clientEditable: false,
  });

  return {
    id: NSNC_BOOK_SLUG,
    slug: NSNC_BOOK_SLUG,
    title: copy.title,
    subtitle: copy.subtitle,
    description: copy.subtitle,
    viewerStyle: "magazine",
    coverSpreadOpening: false,
    isolatedBookshelf: true,
    frontCoverImageUrl: NSNC_FRONT_COVER,
    backCoverImageUrl: NSNC_BACK_COVER,
    pdfDownloadUrl: NSNC_PDF_PATH,
    pdfDownloadFileName: NSNC_PDF_FILE_NAME,
    pages,
  };
}
