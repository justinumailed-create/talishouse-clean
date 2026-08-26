/**
 * Cover-spread helpers for self-service TalisBooks™.
 *
 * Rule: the first landscape upload (or PDF page 1) is always a wrap cover:
 *   LEFT half  = back cover
 *   RIGHT half = front cover
 *
 * Separate front/back cover assets (admin / pinned books) remain supported
 * via metadata.coverImageUrl + metadata.backCoverImageUrl without splitting.
 */

import { splitLandscapeImage } from "@/lib/talisbooks/image-engine/split-landscape";

export const COVER_SPREAD_META_KEY = "coverSpreadOpening" as const;

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
 * Split a landscape cover-spread raster into back (left) and front (right).
 */
export async function splitCoverSpreadBuffer(
  input: Buffer,
): Promise<{
  front: Buffer;
  back: Buffer;
  width: number;
  height: number;
}> {
  const split = await splitLandscapeImage(input);
  return {
    back: split.left,
    front: split.right,
    width: split.original.width,
    height: split.original.height,
  };
}

/**
 * Fetch a remote image and split it as a cover spread.
 * Falls back to treating the whole image as front (and back = front) when
 * the asset is not landscape — generation should still succeed.
 */
export async function splitCoverSpreadFromUrl(
  url: string,
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
    const halves = await splitCoverSpreadBuffer(buffer);
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
