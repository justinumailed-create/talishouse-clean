/**
 * Shared facing-spread composition rules.
 * Generator stores these fields; the viewer must render the same split.
 *
 * Landscape interiors: ONE source image → TWO physical pages (left/right halves).
 * Portrait interiors: ONE source image → ONE physical page.
 */

export const SPREAD_SOURCE_WIDTH_PERCENT = 200;

export function isLandscapeSpreadCandidate(width: number, height: number): boolean {
  return width > 0 && height > 0 && width > height;
}

export function isMattedSpreadPage(page: {
  layout?: string;
  spreadImageUrl?: string;
  spreadMat?: boolean;
  exactPdfPage?: boolean;
}): boolean {
  return (
    page.spreadMat === true &&
    page.exactPdfPage !== true &&
    Boolean(page.spreadImageUrl) &&
    (page.layout === "centerfold_left" || page.layout === "centerfold_right")
  );
}
