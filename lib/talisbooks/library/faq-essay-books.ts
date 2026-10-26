/**
 * TalisU™ FAQ essays as static Talisbooks™ — the four books under the
 * Tokenization hero on the isolated ALLPINS bookshelf.
 *
 * Covers and landscape interior spreads are pre-rendered per locale under
 * `/public/talisbooks/faq/{slug}/{locale}/` (front, back, cover-thumb, spread-NN).
 */
import type { Locale } from "@/lib/i18n/config";
import type { TalisBooksLibraryBook } from "./types";
import type { TalisBooksViewerBook, TalisBooksViewerPage } from "../viewer/types";

export type FaqEssayBookKey =
  | "bare-land"
  | "hospitality"
  | "student-housing"
  | "long-term-care";

type FaqLocaleCopy = {
  title: string;
  subtitle: string;
  /** Number of landscape interior spreads rendered for this locale. */
  spreads: number;
};

export type FaqEssayBookDefinition = {
  key: FaqEssayBookKey;
  slug: string;
  en: FaqLocaleCopy;
  de: FaqLocaleCopy;
};

export const FAQ_ESSAY_BOOKS: readonly FaqEssayBookDefinition[] = [
  {
    key: "bare-land",
    slug: "talisu-faq-bare-land",
    en: {
      title: "Bare Land Tokenization",
      subtitle:
        "How blockchain tokens can represent economic or ownership interests in a land-holding LLC — without tokenizing the deed itself.",
      spreads: 4,
    },
    de: {
      title: "Tokenisierung von Bauland",
      subtitle:
        "Wie Blockchain-Token wirtschaftliche oder Eigentumsrechte an einer grundstückshaltenden LLC abbilden können – ohne die Grundstücksurkunde selbst zu tokenisieren.",
      spreads: 5,
    },
  },
  {
    key: "hospitality",
    slug: "talisu-faq-hospitality",
    en: {
      title: "Hospitality Tokenization",
      subtitle:
        "How a retiring owner can turn an LLC interest into fractional digital investment interests — without selling to a single buyer.",
      spreads: 8,
    },
    de: {
      title: "Tokenisierung im Gastgewerbe",
      subtitle:
        "Wie ein Eigentümer im Ruhestand seinen LLC-Anteil in fraktionierte digitale Beteiligungen umwandeln kann – ohne Verkauf an einen einzigen Käufer.",
      spreads: 8,
    },
  },
  {
    key: "student-housing",
    slug: "talisu-faq-student-housing",
    en: {
      title: "Student Housing Tokenization",
      subtitle:
        "How digital tokens can divide the economic ownership of a student-housing investment — while the LLC keeps owning the building.",
      spreads: 7,
    },
    de: {
      title: "Tokenisierung von Studentenwohnheimen",
      subtitle:
        "Wie digitale Token das wirtschaftliche Eigentum an einer Studentenwohnheim-Investition aufteilen können – während die LLC Eigentümerin des Gebäudes bleibt.",
      spreads: 7,
    },
  },
  {
    key: "long-term-care",
    slug: "talisu-faq-long-term-care",
    en: {
      title: "Long-Term Care Tokenization",
      subtitle:
        "How digital tokens can divide ownership or economic rights in a care-facility LLC — to raise capital, add investors or plan succession.",
      spreads: 6,
    },
    de: {
      title: "Tokenisierung in der Langzeitpflege",
      subtitle:
        "Wie digitale Token Eigentum oder wirtschaftliche Rechte an einer Pflegeheim-LLC aufteilen können – um Kapital zu beschaffen, Investoren aufzunehmen oder die Nachfolge zu planen.",
      spreads: 8,
    },
  },
] as const;

const FAQ_BOOK_PUBLISHED_AT = "2020-01-01T00:00:00.000Z";

function faqLocale(locale: Locale | string | null | undefined): "en" | "de" {
  return locale === "de" ? "de" : "en";
}

export function faqEssayBookAssetBase(slug: string, locale: Locale | string | null | undefined): string {
  return `/talisbooks/faq/${slug}/${faqLocale(locale)}`;
}

export function getFaqEssayBookDefinition(slug: string): FaqEssayBookDefinition | null {
  const normalized = slug.trim();
  return FAQ_ESSAY_BOOKS.find((book) => book.slug === normalized) ?? null;
}

export function isFaqEssayBookSlug(slug: string): boolean {
  return getFaqEssayBookDefinition(slug) !== null;
}

/** Shelf entries (left hero slots 2–5), localized cover + title. */
export function faqEssayLibraryBooks(
  locale: Locale | string | null | undefined,
  coverGradients: readonly string[],
): TalisBooksLibraryBook[] {
  const loc = faqLocale(locale);
  return FAQ_ESSAY_BOOKS.map((book, index) => {
    const copy = book[loc];
    return {
      id: book.slug,
      slug: book.slug,
      title: copy.title,
      subtitle: copy.subtitle,
      coverImageUrl: `${faqEssayBookAssetBase(book.slug, loc)}/cover-thumb.jpg`,
      coverTemplateId: null,
      coverGradient: coverGradients[(index + 2) % coverGradients.length]!,
      publishStatus: "published" as const,
      publishedAt: FAQ_BOOK_PUBLISHED_AT,
      createdAt: FAQ_BOOK_PUBLISHED_AT,
      views: 0,
      clicks: 0,
      pageCount: 2 + copy.spreads * 2,
      accountId: null,
      accountType: "root" as const,
      mapsiteId: null,
      fastCode: null,
      parentBookId: null,
      isPinned: true,
      pinRank: 1 + index,
      metadata: { isolatedBookshelf: true, talisuFaqEssay: book.key },
    };
  });
}

/** Viewer book: front cover, landscape essay spreads, back cover. */
export function createFaqEssayViewerBook(
  slug: string,
  locale: Locale | string | null | undefined,
): TalisBooksViewerBook | null {
  const book = getFaqEssayBookDefinition(slug);
  if (!book) return null;
  const loc = faqLocale(locale);
  const copy = book[loc];
  const base = faqEssayBookAssetBase(book.slug, loc);
  const front = `${base}/front.jpg`;
  const back = `${base}/back.jpg`;
  const totalPages = 2 + copy.spreads * 2;

  const pages: TalisBooksViewerPage[] = [
    {
      id: `${book.slug}-front`,
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
  for (let spread = 1; spread <= copy.spreads; spread += 1) {
    const image = `${base}/spread-${String(spread).padStart(2, "0")}.jpg`;
    const left = spread * 2;
    for (const [side, pageNumber] of [
      ["left", left],
      ["right", left + 1],
    ] as const) {
      pages.push({
        id: `${book.slug}-p${String(pageNumber).padStart(2, "0")}-${side}`,
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
    id: `${book.slug}-back`,
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
    id: book.slug,
    slug: book.slug,
    title: copy.title,
    subtitle: copy.subtitle,
    description: copy.subtitle,
    listingProfile: "fsbo",
    viewerStyle: "magazine",
    coverSpreadOpening: false,
    isolatedBookshelf: true,
    frontCoverImageUrl: front,
    backCoverImageUrl: back,
    pages,
  };
}
