/**
 * Shared facing-spread composition rules.
 * Generator stores these fields; the viewer must render the same split.
 *
 * Landscape interiors: ONE source image → TWO physical pages (left/right halves).
 * Portrait interiors: ONE source image → ONE physical page.
 */

import type { TalisBooksViewerPage } from "./types";

export const SPREAD_SOURCE_WIDTH_PERCENT = 200;

/** Clamp open-book aspect so extreme panoramas still fit the stage. */
export const SPREAD_ASPECT_MIN = 1.15;
export const SPREAD_ASPECT_MAX = 3.2;

export function isLandscapeSpreadCandidate(width: number, height: number): boolean {
  return width > 0 && height > 0 && width > height;
}

export function isMattedSpreadPage(page: {
  layout?: string;
  spreadImageUrl?: string;
  spreadMat?: boolean;
  exactPdfPage?: boolean;
}): boolean {
  // Continuous centerfold: one landscape source spans both leaves.
  // Prefer explicit spreadMat; also accept centerfold + spreadImageUrl
  // (PDF/self-service) even when exactPdfPage was set historically.
  const isCenterfold =
    page.layout === "centerfold_left" || page.layout === "centerfold_right";
  if (!isCenterfold || !page.spreadImageUrl) return false;
  if (page.spreadMat === true) return true;
  // Legacy exact-PDF centerfolds still render as continuous spreads.
  return page.exactPdfPage === true;
}

/** Shared landscape source for a continuous left|right centerfold. */
export function continuousSpreadImageUrl(
  left: TalisBooksViewerPage | null | undefined,
  right: TalisBooksViewerPage | null | undefined,
): string | null {
  for (const page of [left, right]) {
    if (!page || !isMattedSpreadPage(page)) continue;
    const url = page.spreadImageUrl?.trim();
    if (url) return url;
  }
  return null;
}

export function clampSpreadAspectRatio(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return SPREAD_ASPECT_MIN;
  }
  return Math.min(SPREAD_ASPECT_MAX, Math.max(SPREAD_ASPECT_MIN, ratio));
}
