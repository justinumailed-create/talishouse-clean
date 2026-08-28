/**
 * Cover-spread helpers for self-service TalisBooks™.
 *
 * Rule: image #1 (or PDF page 1) is ALWAYS the wrap cover:
 *   LEFT half  = back cover
 *   RIGHT half = front cover
 *
 * Split is exactly 50% of width (vertical center line), regardless of
 * whether the source is landscape or portrait.
 *
 * Separate front/back cover assets (admin / pinned books) remain supported
 * via metadata.coverImageUrl + metadata.backCoverImageUrl without splitting.
 */

import sharp from "sharp";
import { computeLandscapeSplitWidths } from "@/lib/talisbooks/image-engine/split-landscape";

export const COVER_SPREAD_META_KEY = "coverSpreadOpening" as const;

export interface CoverSpreadSplitOptions {
  /** Target single-page width (matches interior page leaf width). */
  targetWidth?: number;
  /** Target single-page height (matches interior page leaf height). */
  targetHeight?: number;
}

export type CoverSpreadHalves = {
  /** Full wrap source (optional, for shelf / admin). */
  coverSpreadImageUrl?: string | null;
  frontCoverImageUrl: string;
  backCoverImageUrl: string;
  frontBuffer: Buffer;
  backBuffer: Buffer;
  width: number;
  height: number;
};

/**
 * Split any cover-spread raster into back (left) and front (right) at 50% width,
 * and force-resize both halves to the exact interior-page dimensions (without cropping).
 */
export async function splitCoverSpreadBuffer(
  input: Buffer,
  options?: CoverSpreadSplitOptions,
): Promise<{
  front: Buffer;
  back: Buffer;
  width: number;
  height: number;
}> {
  const metadata = await sharp(input, { failOn: "none" }).rotate().metadata();
  const width = metadata.width;
  const height = metadata.height;

  if (!width || !height) {
    throw new Error("Unable to read cover spread image dimensions.");
  }
  if (width < 2) {
    throw new Error("Cover spread image is too narrow to split.");
  }

  const { leftWidth, rightWidth } = computeLandscapeSplitWidths(width);
  const rotated = sharp(input, { failOn: "none" }).rotate();

  const targetWidth =
    options?.targetWidth && options.targetWidth > 0
      ? options.targetWidth
      : leftWidth;
  const targetHeight =
    options?.targetHeight && options.targetHeight > 0
      ? options.targetHeight
      : height;

  const [back, front] = await Promise.all([
    rotated
      .clone()
      .extract({ left: 0, top: 0, width: leftWidth, height })
      .resize({
        width: targetWidth,
        height: targetHeight,
        fit: "fill",
      })
      .jpeg({ quality: 92, mozjpeg: false })
      .toBuffer(),
    rotated
      .clone()
      .extract({ left: leftWidth, top: 0, width: rightWidth, height })
      .resize({
        width: targetWidth,
        height: targetHeight,
        fit: "fill",
      })
      .jpeg({ quality: 92, mozjpeg: false })
      .toBuffer(),
  ]);

  return {
    back,
    front,
    width: targetWidth,
    height: targetHeight,
  };
}

/**
 * Fetch a remote image and split it as a cover spread.
 * Falls back to treating the whole image as front (and back = front) when
 * the asset cannot be split — generation should still succeed.
 */
export async function splitCoverSpreadFromUrl(
  url: string,
  options?: CoverSpreadSplitOptions,
): Promise<{
  front: Buffer;
  back: Buffer;
  width: number;
  height: number;
  splitApplied: boolean;
}> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load cover spread image (${response.status}).`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  try {
    const halves = await splitCoverSpreadBuffer(buffer, options);
    return { ...halves, splitApplied: true };
  } catch {
    return {
      front: buffer,
      back: buffer,
      width: 0,
      height: 0,
      splitApplied: false,
    };
  }
}
