import type { TalisBooksLibrarySort, TalisBooksLibraryStatusFilter } from "./types";
import type { TalisBooksPublishStatus } from "../types";
import {
  TALISBOOKS_SHELF_PROFILE,
  TALISTV_VIDEO_SHELF_PROFILE,
} from "@/lib/talispros/shelf-framework";

/**
 * Ralf bookshelf capacity — fully stocked shelf monetization target.
 * 25 books × $19.95 ≈ $498.75 / month.
 */
export const TALISBOOKS_LIBRARY_SHELF_CAPACITY = TALISBOOKS_SHELF_PROFILE.capacity;
export const TALISBOOKS_LIBRARY_BOOK_PRICE_USD = TALISBOOKS_SHELF_PROFILE.unitValueUsd;
export const TALISBOOKS_LIBRARY_MONTHLY_CAPACITY_USD =
  TALISBOOKS_SHELF_PROFILE.monthlyCapacityUsd;

/**
 * Shared ecosystem shelf profiles for multi-product UI framing.
 * TTV is pre-wired as the higher-value video shelf.
 */
export const TALISBOOKS_ECOSYSTEM_SHELF_PROFILES = [
  TALISBOOKS_SHELF_PROFILE,
  TALISTV_VIDEO_SHELF_PROFILE,
] as const;

/** Left niche: highlighted / scheduled books. */
export const TALISBOOKS_LIBRARY_FEATURED_CAPACITY_GRID = 6; // 3×2
export const TALISBOOKS_LIBRARY_FEATURED_CAPACITY_HERO = 5; // 1 large + 4 small

/** Right niche: general library — up to 20 books, shrinking every 5. */
export const TALISBOOKS_LIBRARY_GENERAL_COLUMNS = 4;
export const TALISBOOKS_LIBRARY_GENERAL_ROWS = 5;
export const TALISBOOKS_LIBRARY_GENERAL_PAGE_SIZE =
  TALISBOOKS_LIBRARY_GENERAL_COLUMNS * TALISBOOKS_LIBRARY_GENERAL_ROWS; // 20
export const TALISBOOKS_LIBRARY_GENERAL_SCALE_STEP = 5;
export const TALISBOOKS_LIBRARY_GENERAL_SCALE_REDUCTION = 0.25;

/** Right-shelf book scale: full size for the first 5, then −25% for every
 * additional 5 until 20 books (1 → 0.75 → 0.5 → 0.25).
 */
export function generalShelfBookScale(bookCount: number): number {
  const count = Math.min(
    Math.max(bookCount, 0),
    TALISBOOKS_LIBRARY_GENERAL_PAGE_SIZE,
  );
  if (count <= 0) return 1;
  const steps = Math.floor((count - 1) / TALISBOOKS_LIBRARY_GENERAL_SCALE_STEP);
  return Math.max(0.25, 1 - steps * TALISBOOKS_LIBRARY_GENERAL_SCALE_REDUCTION);
}

/** Plank column count — leftover slots stay empty on the right so books start at the left. */
export function generalShelfColumns(bookCount: number): number {
  const count = Math.min(
    Math.max(bookCount, 1),
    TALISBOOKS_LIBRARY_GENERAL_PAGE_SIZE,
  );
  if (count <= 15) return 5;
  return TALISBOOKS_LIBRARY_GENERAL_COLUMNS;
}

/**
 * Lay a newest-first list onto shelf rows packed from the left.
 * Leftmost book in each row is the newest in that row; older books shift right.
 */
export function packShelfRowsNewestAtLeft<T>(items: T[], columns: number): T[][] {
  const width = Math.max(1, columns);
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += width) {
    rows.push(items.slice(index, index + width));
  }
  return rows;
}

/** @deprecated Use packShelfRowsNewestAtLeft — right-shelf books now enter from the left. */
export function packShelfRowsNewestAtRight<T>(items: T[], columns: number): T[][] {
  return packShelfRowsNewestAtLeft(items, columns);
}

/** @deprecated Prefer GENERAL_PAGE_SIZE for the split shelf. */
export const TALISBOOKS_LIBRARY_PAGE_SIZE = TALISBOOKS_LIBRARY_GENERAL_PAGE_SIZE;

export type TalisBooksFeaturedLayout = "grid-3x2" | "hero-plus-4";

export const TALISBOOKS_LIBRARY_SORT_OPTIONS: Array<{
  value: TalisBooksLibrarySort;
  label: string;
}> = [
  { value: "published_desc", label: "Date" },
  { value: "title_asc", label: "Name" },
  { value: "views_desc", label: "Most viewed" },
  { value: "clicks_desc", label: "Most clicked" },
  { value: "status", label: "Status" },
];

export const TALISBOOKS_LIBRARY_STATUS_OPTIONS: Array<{
  value: TalisBooksLibraryStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In review" },
  { value: "scheduled", label: "Scheduled" },
  { value: "archived", label: "Archived" },
];

export const TALISBOOKS_LIBRARY_STATUS_LABELS: Record<TalisBooksPublishStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
  withdrawn: "Withdrawn",
};

/** Spine / cover accents for standing books without cover art. */
export const TALISBOOKS_LIBRARY_SPINE_PALETTES = [
  "linear-gradient(180deg, #1c1917 0%, #44403c 100%)",
  "linear-gradient(180deg, #0c4a6e 0%, #0369a1 100%)",
  "linear-gradient(180deg, #14532d 0%, #166534 100%)",
  "linear-gradient(180deg, #431407 0%, #9a3412 100%)",
  "linear-gradient(180deg, #171717 0%, #3f3f46 100%)",
  "linear-gradient(180deg, #1e3a5f 0%, #3b82f6 100%)",
  "linear-gradient(180deg, #3f1d0b 0%, #b45309 100%)",
  "linear-gradient(180deg, #064e3b 0%, #10b981 100%)",
] as const;
