import type { TalisBooksAccountType, TalisBooksPublishStatus } from "../types";
import type { TalisBooksCoverTemplateId } from "../covers/constants";

export type TalisBooksLibrarySort =
  | "published_desc"
  | "published_asc"
  | "title_asc"
  | "title_desc"
  | "views_desc"
  | "clicks_desc"
  | "status";

export type TalisBooksLibraryStatusFilter = TalisBooksPublishStatus | "all";

export interface TalisBooksLibraryBook {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  coverImageUrl: string | null;
  coverTemplateId: TalisBooksCoverTemplateId | null;
  coverGradient: string;
  publishStatus: TalisBooksPublishStatus;
  publishedAt: string | null;
  views: number;
  clicks: number;
  pageCount: number;
  accountId: string | null;
  accountType: TalisBooksAccountType;
  mapsiteId: string | null;
  fastCode: string | null;
  parentBookId: string | null;
}

export interface TalisBooksBookshelf {
  accountId: string;
  accountType: Extract<TalisBooksAccountType, "root" | "derivative">;
  accountName: string;
  fastCode: string | null;
  books: TalisBooksLibraryBook[];
}

export interface TalisBooksLibraryQuery {
  search?: string;
  status?: TalisBooksLibraryStatusFilter;
  sort?: TalisBooksLibrarySort;
  /** Page size for future-ready large libraries (default 48). */
  pageSize?: number;
  page?: number;
}

export interface TalisBooksLibraryResult {
  bookshelf: TalisBooksBookshelf;
  books: TalisBooksLibraryBook[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  stats: {
    total: number;
    published: number;
    draft: number;
    views: number;
    clicks: number;
  };
}
