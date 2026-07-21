import sharp from "sharp";
import { verifyCenterfoldAlignment } from "./alignment";
import { buildCenterfoldLayout } from "./centerfold-layout";
import {
  TALISBOOKS_DERIVED_IMAGE_MIME_TYPE,
  TALISBOOKS_DERIVED_IMAGE_QUALITY,
} from "./constants";
import { detectImageOrientation, shouldGenerateCenterfold } from "./orientation";
import { buildCenterfoldPreview } from "./preview";
import { splitLandscapeImage } from "./split-landscape";
import type {
  TalisBooksCenterfoldPreview,
  TalisBooksImageProcessResult,
  TalisBooksProcessedImageAsset,
} from "./types";

export interface ProcessImageBufferOptions {
  sourceName?: string;
  outputMimeType?: string;
  jpegQuality?: number;
}

function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

function buildDerivedAssetName(baseName: string, side: "left" | "right"): string {
  return `${baseName}-${side}`;
}

async function encodeDerivedAsset(
  buffer: Buffer,
  mimeType: string,
  quality: number,
): Promise<Buffer> {
  if (mimeType === "image/png") {
    return sharp(buffer).png().toBuffer();
  }

  return sharp(buffer).jpeg({ quality, mozjpeg: true }).toBuffer();
}

/**
 * Processes an upload for automatic centerfold generation.
 *
 * - Landscape (and panorama) exceeding the preferred page ratio → left/right derived assets
 * - Original buffer is never modified or permanently cropped
 * - Preview model is always returned when a centerfold is generated
 */
export async function processImageBuffer(
  input: Buffer,
  options: ProcessImageBufferOptions = {},
): Promise<TalisBooksImageProcessResult> {
  const metadata = await sharp(input).metadata();
  const width = metadata.width;
  const height = metadata.height;

  if (!width || !height) {
    throw new Error("Unable to read image dimensions.");
  }

  const orientation = detectImageOrientation({ width, height });
  const sourceName = stripExtension(options.sourceName ?? "upload");
  const outputMimeType = options.outputMimeType ?? TALISBOOKS_DERIVED_IMAGE_MIME_TYPE;
  const jpegQuality = options.jpegQuality ?? TALISBOOKS_DERIVED_IMAGE_QUALITY;

  if (!shouldGenerateCenterfold({ width, height })) {
    return {
      orientation,
      split: false,
      original: { width, height },
      assets: [],
      centerfoldLayout: null,
      centerfoldPreview: null,
      alignment: null,
    };
  }

  // Original `input` is only read — never overwritten.
  const split = await splitLandscapeImage(input);
  const [leftBuffer, rightBuffer] = await Promise.all([
    encodeDerivedAsset(split.left, outputMimeType, jpegQuality),
    encodeDerivedAsset(split.right, outputMimeType, jpegQuality),
  ]);

  const leftMeta = await sharp(leftBuffer).metadata();
  const rightMeta = await sharp(rightBuffer).metadata();

  if (!leftMeta.width || !leftMeta.height || !rightMeta.width || !rightMeta.height) {
    throw new Error("Unable to read derived image dimensions.");
  }

  const alignment = verifyCenterfoldAlignment({
    original: split.original,
    left: { width: leftMeta.width, height: leftMeta.height },
    right: { width: rightMeta.width, height: rightMeta.height },
  });

  if (!alignment.aligned) {
    throw new Error(
      "Centerfold alignment check failed — left/right halves do not register perfectly with the original.",
    );
  }

  const assets: TalisBooksProcessedImageAsset[] = [
    {
      role: "derived_left",
      buffer: leftBuffer,
      width: leftMeta.width,
      height: leftMeta.height,
      mimeType: outputMimeType,
      name: buildDerivedAssetName(sourceName, "left"),
      storageSuffix: "left",
    },
    {
      role: "derived_right",
      buffer: rightBuffer,
      width: rightMeta.width,
      height: rightMeta.height,
      mimeType: outputMimeType,
      name: buildDerivedAssetName(sourceName, "right"),
      storageSuffix: "right",
    },
  ];

  const centerfoldLayout = buildCenterfoldLayout({
    sourceName,
    sourceWidth: split.original.width,
    sourceHeight: split.original.height,
    leftWidth: split.leftWidth,
    rightWidth: split.rightWidth,
    sourceOrientation: orientation === "panorama" ? "panorama" : "landscape",
  });

  const centerfoldPreview: TalisBooksCenterfoldPreview = buildCenterfoldPreview({
    originalName: sourceName,
    originalWidth: split.original.width,
    originalHeight: split.original.height,
    orientation,
    left: {
      width: leftMeta.width,
      height: leftMeta.height,
      name: assets[0]!.name,
    },
    right: {
      width: rightMeta.width,
      height: rightMeta.height,
      name: assets[1]!.name,
    },
    alignment,
    layout: centerfoldLayout,
    reviewStatus: "pending_preview",
  });

  return {
    orientation,
    split: true,
    original: split.original,
    assets,
    centerfoldLayout,
    centerfoldPreview,
    alignment,
  };
}
