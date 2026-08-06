import sharp, { type Sharp } from "sharp";
import { stripLogoBackground } from "@/lib/media/strip-logo-background";

export type OptimizeImageKind = "property" | "agent" | "logo";

export type OptimizedImageResult = {
  buffer: Buffer;
  mimeType: "image/webp" | "image/jpeg" | "image/png";
  width: number;
  height: number;
  bytes: number;
  originalBytes: number;
  kind: OptimizeImageKind;
};

/** Property / PDF page art — fullscreen + ebook quality. */
export const PROPERTY_IMAGE_MAX_EDGE_PX = 2048;
/** Agent headshot — cropped square, then capped. */
export const AGENT_PHOTO_MAX_EDGE_PX = 1200;
/** Logo long edge after background strip. */
export const LOGO_MAX_EDGE_PX = 1200;

const PROPERTY_QUALITY_START = 88;
const PROPERTY_QUALITY_FLOOR = 78;
const PROPERTY_TARGET_MAX_BYTES = 1_500_000;
const PROPERTY_TARGET_MIN_BYTES = 300_000;

function extForMime(mime: OptimizedImageResult["mimeType"]): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export function extensionForOptimizedMime(
  mime: OptimizedImageResult["mimeType"],
): string {
  return extForMime(mime);
}

async function encodeWebp(
  pipeline: Sharp,
  quality: number,
  lossless = false,
): Promise<Buffer> {
  if (lossless) {
    return pipeline.webp({ lossless: true, effort: 4 }).toBuffer();
  }
  return pipeline.webp({ quality, effort: 4 }).toBuffer();
}

async function encodeJpeg(pipeline: Sharp, quality: number): Promise<Buffer> {
  return pipeline
    .jpeg({ quality, mozjpeg: false, progressive: false, chromaSubsampling: "4:2:0" })
    .toBuffer();
}

/**
 * Adaptive property encode: prefer WebP ~85–90 visual quality, stay under ~1.5 MB.
 * Falls back to JPEG when WebP is larger or unavailable.
 */
async function optimizePropertyImage(
  input: Buffer,
): Promise<OptimizedImageResult> {
  const originalBytes = input.byteLength;
  const rotated = sharp(input, { failOn: "none", sequentialRead: true }).rotate();
  const meta = await rotated.metadata();
  const srcW = meta.width ?? 0;
  const srcH = meta.height ?? 0;
  if (!srcW || !srcH) {
    throw new Error("Unable to read property image dimensions.");
  }

  const longEdge = Math.max(srcW, srcH);
  const scale = Math.min(1, PROPERTY_IMAGE_MAX_EDGE_PX / longEdge);
  const width = Math.round(srcW * scale);
  const height = Math.round(srcH * scale);

  const base = () => {
    const pipeline = sharp(input, { failOn: "none", sequentialRead: true }).rotate();
    if (scale < 1) {
      return pipeline.resize({
        width,
        height,
        fit: "inside",
        withoutEnlargement: true,
      });
    }
    return pipeline;
  };

  let quality = PROPERTY_QUALITY_START;
  let bestWebp: Buffer | null = null;

  while (quality >= PROPERTY_QUALITY_FLOOR) {
    const webp = await encodeWebp(base(), quality);
    bestWebp = webp;
    if (webp.byteLength <= PROPERTY_TARGET_MAX_BYTES) {
      break;
    }
    quality -= 4;
  }

  const jpeg = await encodeJpeg(base(), Math.max(quality, 85));
  let chosen: Buffer;
  let mimeType: OptimizedImageResult["mimeType"];

  if (bestWebp && bestWebp.byteLength <= jpeg.byteLength * 1.05) {
    chosen = bestWebp;
    mimeType = "image/webp";
  } else {
    chosen = jpeg;
    mimeType = "image/jpeg";
  }

  // Prefer the smaller encoding when the source was already compact.
  if (chosen.byteLength >= originalBytes && scale === 1 && originalBytes > 0) {
    const srcMime = meta.format === "png" ? "image/png" : meta.format === "webp" ? "image/webp" : "image/jpeg";
    if (srcMime === "image/jpeg" || srcMime === "image/webp" || srcMime === "image/png") {
      return {
        buffer: input,
        mimeType: srcMime,
        width: srcW,
        height: srcH,
        bytes: originalBytes,
        originalBytes,
        kind: "property",
      };
    }
  }

  // Soft floor: if extremely small after aggressive compress, bump quality once.
  if (
    chosen.byteLength < PROPERTY_TARGET_MIN_BYTES &&
    quality < PROPERTY_QUALITY_START &&
    mimeType === "image/webp"
  ) {
    const bumped = await encodeWebp(base(), Math.min(PROPERTY_QUALITY_START, quality + 4));
    if (bumped.byteLength <= PROPERTY_TARGET_MAX_BYTES) {
      chosen = bumped;
    }
  }

  const outMeta = await sharp(chosen).metadata();
  return {
    buffer: chosen,
    mimeType,
    width: outMeta.width ?? width,
    height: outMeta.height ?? height,
    bytes: chosen.byteLength,
    originalBytes,
    kind: "property",
  };
}

/** Center-square crop + resize for agent headshots. */
async function optimizeAgentPhoto(input: Buffer): Promise<OptimizedImageResult> {
  const originalBytes = input.byteLength;
  const meta = await sharp(input, { failOn: "none" }).rotate().metadata();
  const srcW = meta.width ?? 0;
  const srcH = meta.height ?? 0;
  if (!srcW || !srcH) {
    throw new Error("Unable to read agent photo dimensions.");
  }

  const side = Math.min(srcW, srcH);
  const left = Math.floor((srcW - side) / 2);
  const top = Math.floor((srcH - side) / 2);
  const edge = Math.min(side, AGENT_PHOTO_MAX_EDGE_PX);

  const build = () =>
    sharp(input, { failOn: "none", sequentialRead: true })
      .rotate()
      .extract({ left, top, width: side, height: side })
      .resize({
        width: edge,
        height: edge,
        fit: "fill",
        withoutEnlargement: true,
      });

  let webp = await encodeWebp(build(), 88);
  if (webp.byteLength > 900_000) {
    webp = await encodeWebp(build(), 82);
  }
  const jpeg = await encodeJpeg(build(), 88);
  const useWebp = webp.byteLength <= jpeg.byteLength * 1.08;
  const buffer = useWebp ? webp : jpeg;
  const mimeType = useWebp ? ("image/webp" as const) : ("image/jpeg" as const);
  const outMeta = await sharp(buffer).metadata();

  return {
    buffer,
    mimeType,
    width: outMeta.width ?? edge,
    height: outMeta.height ?? edge,
    bytes: buffer.byteLength,
    originalBytes,
    kind: "agent",
  };
}

/** Logos: strip flat backgrounds, keep lossless PNG/WebP when possible. */
async function optimizeLogo(input: Buffer): Promise<OptimizedImageResult> {
  const originalBytes = input.byteLength;
  const stripped = await stripLogoBackground(input, {
    maxEdgePx: LOGO_MAX_EDGE_PX,
  });

  // Prefer lossless WebP when smaller; otherwise keep PNG.
  try {
    const webp = await sharp(stripped.buffer)
      .webp({ lossless: true, effort: 4 })
      .toBuffer();
    if (webp.byteLength < stripped.buffer.byteLength * 0.95) {
      const meta = await sharp(webp).metadata();
      return {
        buffer: webp,
        mimeType: "image/webp",
        width: meta.width ?? stripped.width,
        height: meta.height ?? stripped.height,
        bytes: webp.byteLength,
        originalBytes,
        kind: "logo",
      };
    }
  } catch {
    // fall through to PNG
  }

  return {
    buffer: stripped.buffer,
    mimeType: "image/png",
    width: stripped.width,
    height: stripped.height,
    bytes: stripped.buffer.byteLength,
    originalBytes,
    kind: "logo",
  };
}

/**
 * Optimize an upload for Talisbook™ storage.
 * Always corrects EXIF orientation, never upscales, prefers WebP for photos.
 */
export async function optimizeUploadImage(
  input: Buffer,
  kind: OptimizeImageKind,
): Promise<OptimizedImageResult> {
  if (!input.byteLength) {
    throw new Error("Empty image upload.");
  }
  if (kind === "agent") {
    return optimizeAgentPhoto(input);
  }
  if (kind === "logo") {
    return optimizeLogo(input);
  }
  return optimizePropertyImage(input);
}

export function parseOptimizeImageKind(value: string | null | undefined): OptimizeImageKind {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "agent" || normalized === "agentphoto" || normalized === "agent_photo") {
    return "agent";
  }
  if (normalized === "logo" || normalized === "brokeragelogo" || normalized === "brokerage_logo") {
    return "logo";
  }
  return "property";
}
