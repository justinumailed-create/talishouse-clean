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

/** Right niche: general library — 4 columns × 5 rows. */
export const TALISBOOKS_LIBRARY_GENERAL_COLUMNS = 4;
export const TALISBOOKS_LIBRARY_GENERAL_ROWS = 5;
export const TALISBOOKS_LIBRARY_GENERAL_PAGE_SIZE =
  TALISBOOKS_LIBRARY_GENERAL_COLUMNS * TALISBOOKS_LIBRARY_GENERAL_ROWS; // 20

/** @deprecated Prefer GENERAL_PAGE_SIZE for the split shelf. */
export const TALISBOOKS_LIBRARY_PAGE_SIZE = TALISBOOKS_LIBRARY_GENERAL_PAGE_SIZE;

export type TalisBooksFeaturedLayout = "grid-3x2" | "hero-plus-4";

export const TALISBOOKS_LIBRARY_SORT_OPTIONS: Array<{
  value: TalisBooksLibrarySort;
  label: string;
}> = [
  { value: "title_asc", label: "Name" },
  { value: "published_desc", label: "Date" },
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
