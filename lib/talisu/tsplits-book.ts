/**
 * TSPLITS™ – from Vision to Implementation as a page-turning Talisbook™
 * (EN + DE). Ten portrait pages (926×1200, rendered at 2x): front cover,
 * eight interior pages as four landscape spreads, back cover. Assets live in
 * `/public/talisbooks/tsplits/{locale}/` with the matching PDFs one level up.
 */
import type { Locale } from "@/lib/i18n/config";
import type { TalisBooksViewerBook, TalisBooksViewerPage } from "@/lib/talisbooks/viewer/types";

export const TSPLITS_PATH = "/talisu/tsplits";
export const TSPLITS_BOOK_SLUG = "talisu-tsplits";
export const TSPLITS_BOOK_SPREADS = 4;
export const TSPLITS_ASSET_ROOT = "/talisbooks/tsplits";

type TsplitsBookCopy = {
  title: string;
  subtitle: string;
  downloadPdf: string;
  pdfUrl: string;
  pdfFileName: string;
  discuss: string;
};

export const TSPLITS_BOOK_COPY: Record<Locale, TsplitsBookCopy> = {
  en: {
    title: "TSPLITS™",
    subtitle: "from Vision to Implementation",
    downloadPdf: "Download PDF",
    pdfUrl: `${TSPLITS_ASSET_ROOT}/TSPLITS-eBook-EN.pdf`,
    pdfFileName: "TSPLITS-eBook-EN.pdf",
    discuss: "Share a Project Vision",
  },
  de: {
    title: "TSPLITS™",
    subtitle: "von der Vision zur Umsetzung",
    downloadPdf: "PDF herunterladen",
    pdfUrl: `${TSPLITS_ASSET_ROOT}/TSPLITS-eBook-DE.pdf`,
    pdfFileName: "TSPLITS-eBook-DE.pdf",
    discuss: "Projektvision teilen",
  },
};

export function tsplitsLocale(locale: Locale | string | null | undefined): Locale {
  return locale === "de" ? "de" : "en";
}

export function tsplitsBookAssetBase(locale: Locale | string | null | undefined): string {
  return `${TSPLITS_ASSET_ROOT}/${tsplitsLocale(locale)}`;
}

export function createTsplitsViewerBook(
  locale: Locale | string | null | undefined,
): TalisBooksViewerBook {
  const loc = tsplitsLocale(locale);
  const copy = TSPLITS_BOOK_COPY[loc];
  const base = tsplitsBookAssetBase(loc);
  const front = `${base}/front.jpg`;
  const back = `${base}/back.jpg`;
  const totalPages = 2 + TSPLITS_BOOK_SPREADS * 2;

  const pages: TalisBooksViewerPage[] = [
    {
      id: `${TSPLITS_BOOK_SLUG}-front`,
      pageNumber: 1,
      pageRole: "cover",
      layout: "cover",
      title: copy.title,
      subtitle: copy.subtitle,
      heroImageUrl: front,
      exactPdfPage: true,
      clientEditable: false,
    },
  ];
  for (let spread = 1; spread <= TSPLITS_BOOK_SPREADS; spread += 1) {
    const image = `${base}/spread-${String(spread).padStart(2, "0")}.jpg`;
    const left = spread * 2;
    for (const [side, pageNumber] of [
      ["left", left],
      ["right", left + 1],
    ] as const) {
      pages.push({
        id: `${TSPLITS_BOOK_SLUG}-p${String(pageNumber).padStart(2, "0")}-${side}`,
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
    id: `${TSPLITS_BOOK_SLUG}-back`,
    pageNumber: totalPages,
    pageRole: "cover",
    layout: "cover",
    title: copy.title,
    subtitle: copy.subtitle,
    heroImageUrl: back,
    exactPdfPage: true,
    clientEditable: false,
  });

  return {
    id: TSPLITS_BOOK_SLUG,
    slug: TSPLITS_BOOK_SLUG,
    title: copy.title,
    subtitle: copy.subtitle,
    description: copy.subtitle,
    viewerStyle: "magazine",
    coverSpreadOpening: false,
    isolatedBookshelf: true,
    frontCoverImageUrl: front,
    backCoverImageUrl: back,
    pages,
  };
}
