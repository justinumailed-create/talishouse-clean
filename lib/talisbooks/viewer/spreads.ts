import type { TalisBooksViewerPage } from "./types";

export interface TalisBooksViewerSpread {
  index: number;
  left: TalisBooksViewerPage | null;
  right: TalisBooksViewerPage | null;
}

export type TalisBooksViewerSpreadOptions = {
  /**
   * Opening wrap: back cover on the left leaf, front cover on the right.
   * Used when page 1 of a PDF/upload is a cover spread (back | front).
   */
  coverSpreadOpening?: boolean;
  /** Back-cover art for the opening wrap left leaf. */
  backCoverImageUrl?: string | null;
  backCoverTitle?: string;
};

function openingBackCoverPage(
  options: TalisBooksViewerSpreadOptions,
): TalisBooksViewerPage | null {
  const url = options.backCoverImageUrl?.trim();
  if (!url) return null;
  return {
    id: "opening-back-cover",
    pageNumber: 0,
    pageRole: "cover",
    layout: "cover",
    title: options.backCoverTitle || "Back cover",
    heroImageUrl: url,
    exactPdfPage: true,
    clientEditable: false,
  };
}

/**
 * Issuu / soft-cover magazine spreads (Western):
 * - Spread 0: single front cover (page 1 alone on the right; no left leaf until turned)
 * - Spread 1: pages 2–3 (first interior spread)
 * - Spread n: facing interior leaves
 * - Last: single back cover when page count is even
 *
 * Cover-spread opening (self-service PDF page 1 = wrap):
 * - Spread 0: back cover (left) | front cover (right)
 * - Remaining spreads match Issuu pairing from page 2 onward
 */
export function getViewerSpreadCount(pageCount: number): number {
  if (pageCount <= 0) {
    return 0;
  }
  return Math.ceil((pageCount + 1) / 2);
}

export function getViewerSpread(
  pages: TalisBooksViewerPage[],
  spreadIndex: number,
  options?: TalisBooksViewerSpreadOptions,
): TalisBooksViewerSpread {
  const count = getViewerSpreadCount(pages.length);
  const index = Math.max(0, Math.min(spreadIndex, Math.max(count - 1, 0)));

  if (index === 0) {
    const right = pages[0] ?? null;
    if (options?.coverSpreadOpening) {
      const left = openingBackCoverPage(options);
      return { index, left, right };
    }
    return {
      index,
      left: null,
      right,
    };
  }

  const leftIndex = index * 2 - 1;
  const rightIndex = leftIndex + 1;

  return {
    index,
    left: pages[leftIndex] ?? null,
    right: pages[rightIndex] ?? null,
  };
}

export function spreadIndexFromPageIndex(pageIndex: number): number {
  if (pageIndex <= 0) {
    return 0;
  }
  return Math.floor((pageIndex + 1) / 2);
}

export function primaryPageIndexFromSpread(spreadIndex: number): number {
  if (spreadIndex <= 0) {
    return 0;
  }
  return spreadIndex * 2 - 1;
}

export function describeViewerSpread(spread: TalisBooksViewerSpread): string {
  const left = spread.left?.pageNumber;
  const right = spread.right?.pageNumber;
  if (
    spread.index === 0 &&
    spread.left?.id === "opening-back-cover" &&
    right != null
  ) {
    return "Cover spread";
  }
  if (left != null && right != null) {
    return `Pages ${left}–${right}`;
  }
  if (right != null && spread.index === 0) {
    return "Front cover";
  }
  if (left != null && right == null) {
    return "Back cover";
  }
  if (right != null) {
    return `Page ${right}`;
  }
  if (left != null) {
    return `Page ${left}`;
  }
  return "Empty spread";
}

export function describeViewerPage(page: TalisBooksViewerPage | null): string {
  if (page?.pageNumber != null && page.pageNumber > 0) {
    return `Page ${page.pageNumber}`;
  }
  if (page?.id === "opening-back-cover") {
    return "Back cover";
  }
  return "Empty page";
}

/**
 * Convert navigation index when switching between spread and single-page modes.
 */
export function convertViewerNavIndex(
  fromMode: "spread" | "single",
  toMode: "spread" | "single",
  index: number,
  pageCount: number,
): number {
  if (fromMode === toMode) {
    return index;
  }
  if (pageCount <= 0) {
    return 0;
  }
  if (toMode === "single") {
    return Math.min(
      Math.max(0, primaryPageIndexFromSpread(index)),
      pageCount - 1,
    );
  }
  return spreadIndexFromPageIndex(Math.min(Math.max(0, index), pageCount - 1));
}
