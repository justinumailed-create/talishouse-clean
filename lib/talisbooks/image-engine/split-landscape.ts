import sharp from "sharp";
import type { TalisBooksImageDimensions } from "./types";

export interface LandscapeSplitResult {
  left: Buffer;
  right: Buffer;
  original: TalisBooksImageDimensions;
  leftWidth: number;
  rightWidth: number;
}

export function computeLandscapeSplitWidths(width: number): {
  leftWidth: number;
  rightWidth: number;
} {
  const leftWidth = Math.floor(width / 2);
  const rightWidth = width - leftWidth;
  return { leftWidth, rightWidth };
}

export async function splitLandscapeImage(input: Buffer): Promise<LandscapeSplitResult> {
  const metadata = await sharp(input).metadata();
  const width = metadata.width;
  const height = metadata.height;

  if (!width || !height) {
    throw new Error("Unable to read image dimensions for landscape split.");
  }

  if (width <= height) {
    throw new Error("Landscape split requires width greater than height.");
  }

  const { leftWidth, rightWidth } = computeLandscapeSplitWidths(width);

  const [left, right] = await Promise.all([
    sharp(input)
      .extract({ left: 0, top: 0, width: leftWidth, height })
      .toBuffer(),
    sharp(input)
      .extract({ left: leftWidth, top: 0, width: rightWidth, height })
      .toBuffer(),
  ]);

  return {
    left,
    right,
    original: { width, height },
    leftWidth,
    rightWidth,
  };
}
