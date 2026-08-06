import sharp from "sharp";

export interface StrippedLogoImage {
  buffer: Buffer;
  mimeType: "image/png";
  width: number;
  height: number;
}

const DEFAULT_MAX_EDGE_PX = 960;
/** Max RGB distance from sampled background to treat a pixel as background. */
const BACKGROUND_DISTANCE = 38;
/** Soft-edge band beyond the hard threshold (smoother cutouts). */
const SOFT_EDGE = 22;

function colorDistance(
  r: number,
  g: number,
  b: number,
  br: number,
  bg: number,
  bb: number,
): number {
  const dr = r - br;
  const dg = g - bg;
  const db = b - bb;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function sampleCornerAverage(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
): { r: number; g: number; b: number } {
  const inset = Math.max(1, Math.min(6, Math.floor(Math.min(width, height) / 40)));
  const points = [
    [inset, inset],
    [width - 1 - inset, inset],
    [inset, height - 1 - inset],
    [width - 1 - inset, height - 1 - inset],
  ] as const;

  let r = 0;
  let g = 0;
  let b = 0;
  for (const [x, y] of points) {
    const i = (y * width + x) * channels;
    r += data[i] ?? 255;
    g += data[i + 1] ?? 255;
    b += data[i + 2] ?? 255;
  }

  return {
    r: Math.round(r / points.length),
    g: Math.round(g / points.length),
    b: Math.round(b / points.length),
  };
}

function edgeBackgroundRatio(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  bg: { r: number; g: number; b: number },
  threshold: number,
): number {
  let matched = 0;
  let total = 0;

  const visit = (x: number, y: number) => {
    const i = (y * width + x) * channels;
    const a = data[i + 3] ?? 255;
    if (a < 8) return;
    total += 1;
    const dist = colorDistance(
      data[i] ?? 255,
      data[i + 1] ?? 255,
      data[i + 2] ?? 255,
      bg.r,
      bg.g,
      bg.b,
    );
    if (dist <= threshold) matched += 1;
  };

  for (let x = 0; x < width; x += 1) {
    visit(x, 0);
    visit(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    visit(0, y);
    visit(width - 1, y);
  }

  return total === 0 ? 0 : matched / total;
}

/**
 * Punch a flat logo backdrop to transparent and encode as PNG.
 * Uses corner/edge sampling so white, off-white, and solid paper fills drop out.
 * Skips punching when edges do not look like a solid backdrop (photo-like logos).
 */
export async function stripLogoBackground(
  input: Buffer,
  options: { maxEdgePx?: number } = {},
): Promise<StrippedLogoImage> {
  const maxEdgePx = options.maxEdgePx ?? DEFAULT_MAX_EDGE_PX;
  const rotated = sharp(input, { failOn: "none", sequentialRead: true })
    .rotate()
    .ensureAlpha();

  const meta = await rotated.metadata();
  const srcWidth = meta.width ?? 0;
  const srcHeight = meta.height ?? 0;
  if (!srcWidth || !srcHeight) {
    throw new Error("Unable to read logo dimensions.");
  }

  const longEdge = Math.max(srcWidth, srcHeight);
  const scale = Math.min(1, maxEdgePx / longEdge);
  const pipeline =
    scale < 1
      ? rotated.resize({
          width: Math.round(srcWidth * scale),
          height: Math.round(srcHeight * scale),
          fit: "inside",
          withoutEnlargement: true,
        })
      : rotated;

  const { data, info } = await pipeline
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;
  if (channels < 4) {
    throw new Error("Logo RGBA conversion failed.");
  }

  const pixels = Buffer.from(data);
  const bg = sampleCornerAverage(pixels, width, height, channels);
  const edgeRatio = edgeBackgroundRatio(
    pixels,
    width,
    height,
    channels,
    bg,
    BACKGROUND_DISTANCE,
  );

  // Only strip when the border looks like a solid paper/backdrop.
  if (edgeRatio >= 0.55) {
    const hard = BACKGROUND_DISTANCE;
    const soft = BACKGROUND_DISTANCE + SOFT_EDGE;

    for (let i = 0; i < pixels.length; i += channels) {
      const r = pixels[i] ?? 255;
      const g = pixels[i + 1] ?? 255;
      const b = pixels[i + 2] ?? 255;
      const a = pixels[i + 3] ?? 255;
      if (a === 0) continue;

      const dist = colorDistance(r, g, b, bg.r, bg.g, bg.b);
      if (dist <= hard) {
        pixels[i + 3] = 0;
      } else if (dist < soft) {
        const t = (dist - hard) / SOFT_EDGE;
        pixels[i + 3] = Math.round(a * t);
      }
    }
  }

  const encoded = await sharp(pixels, {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: 6 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: encoded.data,
    mimeType: "image/png",
    width: encoded.info.width,
    height: encoded.info.height,
  };
}

export function isLogoUploadField(fieldName: string): boolean {
  const normalized = fieldName.trim().toLowerCase();
  return (
    normalized === "logo" ||
    normalized === "brokeragelogo" ||
    normalized.endsWith("logo") ||
    normalized.includes("brokerage-logo") ||
    normalized.includes("brokerage_logo")
  );
}
