/**
 * TalisBooks™ ecosystem relationships — reusable across Talispros™ products.
 *
 * Book → MapSite™ → Account → FAST Code
 */

export type TalisBooksAccountType = "root" | "derivative" | "adpro";

export interface TalisBooksEcosystemLinks {
  bookId: string;
  mapsiteId: string | null;
  accountId: string | null;
  fastCode: string | null;
  accountType: TalisBooksAccountType;
  parentBookId: string | null;
}

/** Maps DB table names to domain model names used in docs and admin UI. */
export const TALISBOOKS_TABLE_MAP = {
  books: "talisbooks_books",
  book_pages: "talisbooks_book_pages",
  book_templates: "talisbooks_templates",
  book_media: "talisbooks_book_media",
  book_assets: "talisbooks_book_assets",
  book_themes: "talisbooks_book_themes",
  book_analytics: "talisbooks_book_analytics",
  book_versions: "talisbooks_book_versions",
  book_settings: "talisbooks_book_settings",
} as const;

export type TalisBooksDomainModel = keyof typeof TALISBOOKS_TABLE_MAP;

export const TALISBOOKS_ECOSYSTEM_CHAIN = [
  { layer: "Book", description: "Digital publication (lookbook, property story)" },
  { layer: "MapSite™", description: "Property marketing site the book belongs to" },
  { layer: "Account", description: "Talispros™ account hierarchy" },
  { layer: "FAST Code", description: "Referral network identifier" },
] as const;
