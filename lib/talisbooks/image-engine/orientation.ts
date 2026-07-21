import type { TalisBooksImageDimensions, TalisBooksImageOrientation } from "./types";
import { TALISBOOKS_PREFERRED_PAGE_ASPECT_RATIO } from "./constants";

/** Aspect ratio (width / height) at or above this is classified as panorama. */
export const TALISBOOKS_PANORAMA_ASPECT_RATIO = 2.25;

export function aspectRatio(dimensions: TalisBooksImageDimensions): number {
  const { width, height } = dimensions;
  if (width <= 0 || height <= 0) {
    throw new Error("Image dimensions must be positive numbers.");
  }
  return width / height;
}

/**
 * Detects Landscape, Portrait, Panorama, or Square from pixel dimensions.
 * Panorama is a wide landscape (aspect ≥ 2.25).
 */
export function detectImageOrientation(
  dimensions: TalisBooksImageDimensions,
): TalisBooksImageOrientation {
  const { width, height } = dimensions;

  if (width <= 0 || height <= 0) {
    throw new Error("Image dimensions must be positive numbers.");
  }

  if (width === height) {
    return "square";
  }

  if (height > width) {
    return "portrait";
  }

  if (aspectRatio(dimensions) >= TALISBOOKS_PANORAMA_ASPECT_RATIO) {
    return "panorama";
  }

  return "landscape";
}

export function isLandscapeImage(dimensions: TalisBooksImageDimensions): boolean {
  return detectImageOrientation(dimensions) === "landscape";
}

export function isPanoramaImage(dimensions: TalisBooksImageDimensions): boolean {
  return detectImageOrientation(dimensions) === "panorama";
}

/**
 * True when the upload is wider than the preferred single-page ratio.
 * Agents' landscape photos typically exceed this and become centerfolds.
 */
export function exceedsPreferredPageRatio(
  dimensions: TalisBooksImageDimensions,
  preferredRatio = TALISBOOKS_PREFERRED_PAGE_ASPECT_RATIO,
): boolean {
  return aspectRatio(dimensions) > preferredRatio && dimensions.width > dimensions.height;
}

/**
 * Automatic centerfold: landscape (including panorama) that exceeds the
 * preferred page ratio is split into left + right facing pages.
 * Portrait and near-square uploads are left intact.
 */
export function shouldGenerateCenterfold(dimensions: TalisBooksImageDimensions): boolean {
  const orientation = detectImageOrientation(dimensions);
  if (orientation === "portrait" || orientation === "square") {
    return false;
  }
  return exceedsPreferredPageRatio(dimensions);
}

/** @deprecated Prefer shouldGenerateCenterfold — kept for callers/tests. */
export function shouldSplitImage(dimensions: TalisBooksImageDimensions): boolean {
  return shouldGenerateCenterfold(dimensions);
}
