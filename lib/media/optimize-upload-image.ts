import sharp, { type Sharp } from "sharp";
import { stripLogoBackground } from "@/lib/media/strip-logo-background";
import {
  AGENT_PHOTO_MAX_EDGE_PX,
  LOGO_MAX_EDGE_PX,
  PROPERTY_IMAGE_MAX_EDGE_PX,
  PROPERTY_TARGET_MAX_BYTES,
  type OptimizeImageKind,
} from "@/lib/media/upload-size-limits";

export type { OptimizeImageKind };
export {
  AGENT_PHOTO_MAX_EDGE_PX,
  LOGO_MAX_EDGE_PX,
  PROPERTY_IMAGE_MAX_EDGE_PX,
};

export type OptimizedImageResult = {
  buffer: Buffer;
  mimeType: "image/webp" | "image/jpeg" | "image/png";
  width: number;
  height: number;
  bytes: number;
  originalBytes: number;
  kind: OptimizeImageKind;
};

const PROPERTY_QUALITY_START = 88;
const PROPERTY_QUALITY_FLOOR = 62;
const PROPERTY_TARGET_MIN_BYTES = 300_000;
const PROPERTY_EDGE_STEPS_PX = [2048, 1600, 1280, 1024] as const;

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

function sourceMime(
  format: string | undefined,
): OptimizedImageResult["mimeType"] | null {
  if (format === "png") return "image/png";
  if (format === "webp") return "image/webp";
  if (format === "jpeg" || format === "jpg") return "image/jpeg";
  return null;
}

/**
 * Adaptive property encode: prefer WebP ~85–90 visual quality, stay under ~1.5 MB.
 * Falls back to JPEG when WebP is larger. Steps down long-edge if quality alone
 * cannot hit the byte target (high-entropy phone photos).
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
  const uniqueEdges = [
    ...new Set(
      [Math.min(longEdge, PROPERTY_IMAGE_MAX_EDGE_PX), ...PROPERTY_EDGE_STEPS_PX].filter(
        (edge) => edge > 0 && edge <= longEdge,
      ),
    ),
  ].sort((a, b) => b - a);

  let best: {
    buffer: Buffer;
    mimeType: OptimizedImageResult["mimeType"];
    width: number;
    height: number;
    quality: number;
  } | null = null;

  for (const maxEdge of uniqueEdges) {
    const scale = Math.min(1, maxEdge / longEdge);
    const width = Math.max(1, Math.round(srcW * scale));
    const height = Math.max(1, Math.round(srcH * scale));
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

    for (
      let quality = PROPERTY_QUALITY_START;
      quality >= PROPERTY_QUALITY_FLOOR;
      quality -= 4
    ) {
      const webp = await encodeWebp(base(), quality);
      const jpeg = await encodeJpeg(base(), quality);
      const useWebp = webp.byteLength <= jpeg.byteLength * 1.05;
      const buffer = useWebp ? webp : jpeg;
      const mimeType = useWebp ? ("image/webp" as const) : ("image/jpeg" as const);
      if (!best || buffer.byteLength < best.buffer.byteLength) {
        best = { buffer, mimeType, width, height, quality };
      }
      if (buffer.byteLength <= PROPERTY_TARGET_MAX_BYTES) {
        // Soft floor: if extremely small after aggressive compress, bump quality once.
        if (
          buffer.byteLength < PROPERTY_TARGET_MIN_BYTES &&
          quality < PROPERTY_QUALITY_START &&
          mimeType === "image/webp"
        ) {
          const bumped = await encodeWebp(
            base(),
            Math.min(PROPERTY_QUALITY_START, quality + 4),
          );
          if (bumped.byteLength <= PROPERTY_TARGET_MAX_BYTES) {
            best = {
              buffer: bumped,
              mimeType,
              width,
              height,
              quality,
            };
          }
        }
        const chosen = best;
        const outMeta = await sharp(chosen.buffer).metadata();
        return {
          buffer: chosen.buffer,
          mimeType: chosen.mimeType,
          width: outMeta.width ?? width,
          height: outMeta.height ?? height,
          bytes: chosen.buffer.byteLength,
          originalBytes,
          kind: "property",
        };
      }
    }
  }

  // Prefer the original only when it is already compact enough to store/serve.
  const compactMime = sourceMime(meta.format);
  if (
    compactMime &&
    originalBytes <= PROPERTY_TARGET_MAX_BYTES &&
    (!best || best.buffer.byteLength >= originalBytes)
  ) {
    return {
      buffer: input,
      mimeType: compactMime,
      width: srcW,
      height: srcH,
      bytes: originalBytes,
      originalBytes,
      kind: "property",
    };
  }

  if (!best) {
    throw new Error("Unable to encode property image.");
  }

  const outMeta = await sharp(best.buffer).metadata();
  return {
    buffer: best.buffer,
    mimeType: best.mimeType,
    width: outMeta.width ?? best.width,
    height: outMeta.height ?? best.height,
    bytes: best.buffer.byteLength,
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
