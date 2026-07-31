import type { TalisBooksViewerPage } from "./types";

export interface TalisBooksViewerSpread {
  index: number;
  left: TalisBooksViewerPage | null;
  right: TalisBooksViewerPage | null;
}

/**
 * Issuu / soft-cover magazine spreads (Western):
 * - Spread 0: single front cover (page 1 alone)
 * - Spread 1: pages 2–3 (first interior spread)
 * - Spread n: facing interior leaves
 * - Last: single back cover when page count is even
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
): TalisBooksViewerSpread {
  const count = getViewerSpreadCount(pages.length);
  const index = Math.max(0, Math.min(spreadIndex, Math.max(count - 1, 0)));

  if (index === 0) {
    return {
      index,
      left: null,
      right: pages[0] ?? null,
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
  if (page?.pageNumber != null) {
    return `Page ${page.pageNumber}`;
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
