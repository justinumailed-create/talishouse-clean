import { TALISBOOKS_COVER_TEMPLATES } from "../covers/catalog";
import type { TalisBooksCoverTemplateId } from "../covers/constants";
import type { TalisBooksBookshelf, TalisBooksLibraryBook } from "./types";
import {
  TALISBOOKS_LIBRARY_SHELF_CAPACITY,
  TALISBOOKS_LIBRARY_SPINE_PALETTES,
} from "./constants";
import type { TalisBooksPublishStatus } from "../types";

function coverGradient(templateId: TalisBooksCoverTemplateId | null, index: number): string {
  if (templateId && TALISBOOKS_COVER_TEMPLATES[templateId]) {
    return TALISBOOKS_COVER_TEMPLATES[templateId].previewGradient;
  }
  return TALISBOOKS_LIBRARY_SPINE_PALETTES[index % TALISBOOKS_LIBRARY_SPINE_PALETTES.length]!;
}

const TEMPLATES: TalisBooksCoverTemplateId[] = [
  "aurora-frame",
  "horizon-caption",
  "masthead-rise",
  "cascade-editorial",
  "vista-overlay",
];

const ROOT_TITLES: Array<{
  title: string;
  subtitle: string;
  status: TalisBooksPublishStatus;
  views: number;
  clicks: number;
  publishedAt: string | null;
  slug?: string;
  coverImageUrl?: string | null;
  pageCount?: number;
}> = [
  {
    title: "Meat Cove Retreat",
    subtitle: "FSBO · 2447 Meat Cove Rd, Pleasant Bay, NS",
    status: "scheduled",
    views: 3120,
    clicks: 840,
    publishedAt: "2026-07-21T02:00:00.000Z",
    slug: "sample-ebook",
    coverImageUrl: "/talisbooks/sample/clean/cover.jpg",
    pageCount: 16,
  },
  {
    title: "Lake Country Residences",
    subtitle: "Muskoka Collection",
    status: "scheduled",
    views: 1842,
    clicks: 416,
    publishedAt: "2026-07-20T12:00:00.000Z",
  },
  {
    title: "Harbourfront Suites",
    subtitle: "Toronto Waterfront",
    status: "in_review",
    views: 1260,
    clicks: 298,
    publishedAt: null,
  },
  {
    title: "Collingwood Retreat",
    subtitle: "Blue Mountain Estate",
    status: "scheduled",
    views: 84,
    clicks: 12,
    publishedAt: "2026-07-28T09:00:00.000Z",
  },
  {
    title: "Annex Townhomes",
    subtitle: "Heritage Modern",
    status: "in_review",
    views: 210,
    clicks: 44,
    publishedAt: null,
  },
  {
    title: "Forest Hill Manor",
    subtitle: "Private Residences",
    status: "scheduled",
    views: 2210,
    clicks: 540,
    publishedAt: "2026-08-01T16:30:00.000Z",
  },
  {
    title: "Credit River Estate",
    subtitle: "Mississauga Collection",
    status: "published",
    views: 936,
    clicks: 204,
    publishedAt: "2026-04-02T12:00:00.000Z",
  },
  {
    title: "Rosedale Courtyard",
    subtitle: "Garden Residences",
    status: "published",
    views: 1540,
    clicks: 312,
    publishedAt: "2026-03-18T11:00:00.000Z",
  },
  {
    title: "Kingsway Villas",
    subtitle: "West End Living",
    status: "published",
    views: 1188,
    clicks: 266,
    publishedAt: "2026-03-01T15:00:00.000Z",
  },
  {
    title: "Beaches Boardwalk",
    subtitle: "Lake Ontario Homes",
    status: "published",
    views: 980,
    clicks: 188,
    publishedAt: "2026-02-14T10:00:00.000Z",
  },
  {
    title: "Yorkville Penthouses",
    subtitle: "Skyline Collection",
    status: "published",
    views: 2400,
    clicks: 620,
    publishedAt: "2026-02-01T09:00:00.000Z",
  },
  {
    title: "Don Valley Lofts",
    subtitle: "Urban Nature",
    status: "published",
    views: 760,
    clicks: 140,
    publishedAt: "2026-01-22T13:00:00.000Z",
  },
  {
    title: "Cabbagetown Row",
    subtitle: "Victorian Revival",
    status: "published",
    views: 644,
    clicks: 120,
    publishedAt: "2026-01-10T14:00:00.000Z",
  },
  {
    title: "Leslieville Studios",
    subtitle: "East End Creative",
    status: "published",
    views: 512,
    clicks: 98,
    publishedAt: "2025-12-18T12:00:00.000Z",
  },
  {
    title: "High Park Terraces",
    subtitle: "Parkside Living",
    status: "published",
    views: 890,
    clicks: 176,
    publishedAt: "2025-12-02T11:00:00.000Z",
  },
  {
    title: "Distillery Flats",
    subtitle: "Historic District",
    status: "published",
    views: 1102,
    clicks: 230,
    publishedAt: "2025-11-20T10:00:00.000Z",
  },
  {
    title: "Liberty Village",
    subtitle: "Modern Condos",
    status: "published",
    views: 1330,
    clicks: 288,
    publishedAt: "2025-11-05T09:00:00.000Z",
  },
  {
    title: "Summerhill Mews",
    subtitle: "Quiet Luxury",
    status: "published",
    views: 720,
    clicks: 150,
    publishedAt: "2025-10-22T16:00:00.000Z",
  },
  {
    title: "Riverdale Park Homes",
    subtitle: "Family Collection",
    status: "published",
    views: 840,
    clicks: 162,
    publishedAt: "2025-10-08T12:00:00.000Z",
  },
  {
    title: "Queen West Galleries",
    subtitle: "Art District Lofts",
    status: "draft",
    views: 24,
    clicks: 2,
    publishedAt: null,
  },
  {
    title: "Danforth Residences",
    subtitle: "Neighbourhood Living",
    status: "published",
    views: 690,
    clicks: 134,
    publishedAt: "2025-09-18T11:00:00.000Z",
  },
  {
    title: "St. Lawrence Market",
    subtitle: "Downtown Heritage",
    status: "published",
    views: 1010,
    clicks: 210,
    publishedAt: "2025-09-01T10:00:00.000Z",
  },
  {
    title: "North York Towers",
    subtitle: "Vertical Living",
    status: "published",
    views: 580,
    clicks: 110,
    publishedAt: "2025-08-15T14:00:00.000Z",
  },
  {
    title: "Scarborough Bluffs",
    subtitle: "Cliffside Views",
    status: "published",
    views: 470,
    clicks: 92,
    publishedAt: "2025-08-01T09:00:00.000Z",
  },
  {
    title: "Etobicoke Shoreline",
    subtitle: "West Waterfront",
    status: "published",
    views: 560,
    clicks: 105,
    publishedAt: "2025-07-18T13:00:00.000Z",
  },
  {
    title: "Maple Leaf Estates",
    subtitle: "Suburban Collection",
    status: "archived",
    views: 320,
    clicks: 48,
    publishedAt: "2025-06-01T12:00:00.000Z",
  },
];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildRootBooks(): Array<Omit<TalisBooksLibraryBook, "coverGradient">> {
  return ROOT_TITLES.slice(0, TALISBOOKS_LIBRARY_SHELF_CAPACITY).map((entry, index) => ({
    id: `lib-demo-root-${index + 1}`,
    slug: entry.slug ?? slugify(entry.title),
    title: entry.title,
    subtitle: entry.subtitle,
    coverImageUrl: entry.coverImageUrl ?? null,
    coverTemplateId: TEMPLATES[index % TEMPLATES.length]!,
    publishStatus: entry.status,
    publishedAt: entry.publishedAt,
    views: entry.views,
    clicks: entry.clicks,
    pageCount: entry.pageCount ?? 12 + (index % 10),
    accountId: "demo-root-account",
    accountType: "root" as const,
    mapsiteId: null,
    fastCode: "talisroot",
    parentBookId: null,
  }));
}

function buildDerivativeBooks(): Array<Omit<TalisBooksLibraryBook, "coverGradient">> {
  return ROOT_TITLES.slice(0, 12).map((entry, index) => ({
    id: `lib-demo-deriv-${index + 1}`,
    slug: `${slugify(entry.title)}-partner`,
    title: entry.title,
    subtitle: "Partner Edition",
    coverImageUrl: null,
    coverTemplateId: TEMPLATES[index % TEMPLATES.length]!,
    publishStatus: index < 2 ? "scheduled" : index < 4 ? "in_review" : "published",
    publishedAt: entry.publishedAt,
    views: Math.round(entry.views * 0.35),
    clicks: Math.round(entry.clicks * 0.35),
    pageCount: 12 + (index % 8),
    accountId: "demo-derivative-account",
    accountType: "derivative" as const,
    mapsiteId: null,
    fastCode: "talisderiv",
    parentBookId: `lib-demo-root-${index + 1}`,
  }));
}

function withGradients(
  books: Array<Omit<TalisBooksLibraryBook, "coverGradient">>,
): TalisBooksLibraryBook[] {
  return books.map((book, index) => ({
    ...book,
    coverGradient: coverGradient(book.coverTemplateId, index),
  }));
}

/** Demo personal bookshelf for a Root Account — fully stocked (25). */
export function createDemoRootBookshelf(): TalisBooksBookshelf {
  return {
    accountId: "demo-root-account",
    accountType: "root",
    accountName: "Bookshelf",
    fastCode: "talisroot",
    books: withGradients(buildRootBooks()),
  };
}

/** Demo personal bookshelf for a Derivative Account. */
export function createDemoDerivativeBookshelf(): TalisBooksBookshelf {
  return {
    accountId: "demo-derivative-account",
    accountType: "derivative",
    accountName: "Bookshelf",
    fastCode: "talisderiv",
    books: withGradients(buildDerivativeBooks()),
  };
}

export function createDemoBookshelf(
  accountType: "root" | "derivative" = "root",
): TalisBooksBookshelf {
  return accountType === "derivative"
    ? createDemoDerivativeBookshelf()
    : createDemoRootBookshelf();
}
