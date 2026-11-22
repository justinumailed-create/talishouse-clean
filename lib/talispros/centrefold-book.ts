/**
 * Centrefolds TEB™: the 20 page green-screen demo eBook on the demo Mapsite
 * PIN (Ralf, Nov 22). It replaces the North Shore Nature Centre book there;
 * the green screen "leaves more room for the imagination". Slide 1 is the
 * cover spread: its right half is the front cover and its left half (Aisha,
 * Your Marketing Manager) is the back cover. Slides 2 to 20 are centrefolds,
 * one image across the left and right leaves. Assets: `/public/talisbooks/centrefold/`.
 */
import type { Locale } from "@/lib/i18n/config";
import type { TalisBooksViewerBook, TalisBooksViewerPage } from "@/lib/talisbooks/viewer/types";

export const CENTREFOLD_BOOK_SLUG = "centrefolds";
export const CENTREFOLD_ASSET_ROOT = "/talisbooks/centrefold";
export const CENTREFOLD_SLIDE_COUNT = 20;
export const CENTREFOLD_PIN_IMAGE = `${CENTREFOLD_ASSET_ROOT}/pin.webp`;
export const CENTREFOLD_FRONT_COVER = `${CENTREFOLD_ASSET_ROOT}/front-cover.webp`;
export const CENTREFOLD_BACK_COVER = `${CENTREFOLD_ASSET_ROOT}/back-cover.webp`;
export const CENTREFOLD_PDF_PATH = `${CENTREFOLD_ASSET_ROOT}/Centrefolds.pdf`;
export const CENTREFOLD_PDF_FILE_NAME = "Centrefolds.pdf";
export const CENTREFOLD_BOOK_HREF = `/talisbooks/viewer/${CENTREFOLD_BOOK_SLUG}`;

/** Book title; the same in every language. */
export const CENTREFOLD_TITLE = "Centrefolds";

const COPY: Record<Locale, { subtitle: string }> = {
  en: { subtitle: "Your Mapsite eBook, ready for your own photos" },
  de: { subtitle: "Ihr Mapsite-eBook, bereit für Ihre eigenen Fotos" },
};

export function centrefoldSlideHref(slide: number): string {
  return `${CENTREFOLD_ASSET_ROOT}/pages/page-${String(slide).padStart(2, "0")}.webp`;
}

export function createCentrefoldViewerBook(locale?: Locale | string | null): TalisBooksViewerBook {
  const copy = COPY[locale === "de" ? "de" : "en"];
  const interiorSlides = CENTREFOLD_SLIDE_COUNT - 1;
  const totalPages = 2 + interiorSlides * 2;
  const pages: TalisBooksViewerPage[] = [
    {
      id: `${CENTREFOLD_BOOK_SLUG}-front`,
      pageNumber: 1,
      pageRole: "cover",
      layout: "cover",
      title: CENTREFOLD_TITLE,
      subtitle: copy.subtitle,
      heroImageUrl: CENTREFOLD_FRONT_COVER,
      exactPdfPage: true,
      clientEditable: false,
    },
  ];
  for (let slide = 2; slide <= CENTREFOLD_SLIDE_COUNT; slide += 1) {
    const image = centrefoldSlideHref(slide);
    const left = (slide - 1) * 2;
    for (const [side, pageNumber] of [
      ["left", left],
      ["right", left + 1],
    ] as const) {
      pages.push({
        id: `${CENTREFOLD_BOOK_SLUG}-p${String(pageNumber).padStart(2, "0")}-${side}`,
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
    id: `${CENTREFOLD_BOOK_SLUG}-back`,
    pageNumber: totalPages,
    pageRole: "cover",
    layout: "cover",
    title: CENTREFOLD_TITLE,
    subtitle: copy.subtitle,
    heroImageUrl: CENTREFOLD_BACK_COVER,
    exactPdfPage: true,
    clientEditable: false,
  });

  return {
    id: CENTREFOLD_BOOK_SLUG,
    slug: CENTREFOLD_BOOK_SLUG,
    title: CENTREFOLD_TITLE,
    subtitle: copy.subtitle,
    description: copy.subtitle,
    viewerStyle: "magazine",
    coverSpreadOpening: false,
    isolatedBookshelf: true,
    frontCoverImageUrl: CENTREFOLD_FRONT_COVER,
    backCoverImageUrl: CENTREFOLD_BACK_COVER,
    pdfDownloadUrl: CENTREFOLD_PDF_PATH,
    pdfDownloadFileName: CENTREFOLD_PDF_FILE_NAME,
    pages,
  };
}
