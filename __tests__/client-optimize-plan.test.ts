import { describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import {
  clientOptimizeStepsFrom,
  jpegFileName,
  nextClientOptimizePass,
  pickClientOptimizeEncoding,
  shouldSkipClientOptimize,
  stillTooLargeAfterOptimizeMessage,
  type ClientEncodeResult,
} from "@/lib/media/client-optimize-plan";
import {
  CLIENT_UPLOAD_MAX_BYTES,
  CLIENT_UPLOAD_SKIP_BYTES,
  VERCEL_FUNCTION_BODY_LIMIT_BYTES,
} from "@/lib/media/upload-size-limits";
import { optimizeUploadImage } from "@/lib/media/optimize-upload-image";

async function makeNoisyPhoneJpeg(options?: {
  width?: number;
  height?: number;
  quality?: number;
}): Promise<Buffer> {
  const width = options?.width ?? 4032;
  const height = options?.height ?? 3024;
  const pixels = Buffer.alloc(width * height * 3);
  let seed = 9973;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const i = (y * width + x) * 3;
      const xf = x / width;
      const yf = y / height;
      const grain = seed % 48;
      pixels[i] = Math.min(255, 36 + xf * 170 + grain);
      pixels[i + 1] = Math.min(255, 70 + yf * 110 + grain);
      pixels[i + 2] = Math.min(255, 90 + xf * yf * 90 + grain);
    }
  }
  return sharp(pixels, { raw: { width, height, channels: 3 } })
    .sharpen()
    .jpeg({ quality: options?.quality ?? 96 })
    .toBuffer();
}

async function sharpEncode(
  source: Buffer,
  srcW: number,
  srcH: number,
  maxEdge: number,
  quality: number,
): Promise<ClientEncodeResult> {
  const scale = Math.min(1, maxEdge / Math.max(srcW, srcH));
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));
  const buffer = await sharp(source, { failOn: "none" })
    .rotate()
    .resize({
      width,
      height,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality: Math.round(quality * 100),
      chromaSubsampling: "4:2:0",
    })
    .toBuffer();
  const meta = await sharp(buffer).metadata();
  return {
    bytes: new Uint8Array(buffer),
    mimeType: "image/jpeg",
    width: meta.width ?? width,
    height: meta.height ?? height,
  };
}

describe("client ebook upload optimize plan", () => {
  it("walks default → retry → last-resort, with retry strictly smaller/softer", () => {
    expect(nextClientOptimizePass("default")).toBe("retry");
    expect(nextClientOptimizePass("retry")).toBe("last-resort");
    expect(nextClientOptimizePass("last-resort")).toBeNull();

    const firstDefault = clientOptimizeStepsFrom("default")[0];
    const firstRetry = clientOptimizeStepsFrom("retry")[0];
    expect(firstDefault).toBeTruthy();
    expect(firstRetry).toBeTruthy();
    expect(firstRetry!.maxEdge).toBeLessThanOrEqual(firstDefault!.maxEdge);
    expect(firstRetry!.quality).toBeLessThan(firstDefault!.quality);
    expect(
      clientOptimizeStepsFrom("retry").every((step) => step.pass !== "default"),
    ).toBe(true);
  });

  it("skips first-pass re-encode for already-small photos and logos under the gate", () => {
    expect(
      shouldSkipClientOptimize({
        byteLength: CLIENT_UPLOAD_SKIP_BYTES,
        minPass: "default",
        kind: "property",
      }),
    ).toBe(true);
    expect(
      shouldSkipClientOptimize({
        byteLength: CLIENT_UPLOAD_SKIP_BYTES + 1,
        minPass: "default",
        kind: "property",
      }),
    ).toBe(false);
    expect(
      shouldSkipClientOptimize({
        byteLength: CLIENT_UPLOAD_SKIP_BYTES,
        minPass: "retry",
        kind: "property",
      }),
    ).toBe(false);
    expect(
      shouldSkipClientOptimize({
        byteLength: CLIENT_UPLOAD_MAX_BYTES,
        minPass: "default",
        kind: "logo",
      }),
    ).toBe(true);
  });

  it("does not call the encoder when the original is already small", async () => {
    const encode = vi.fn();
    const picked = await pickClientOptimizeEncoding({
      originalBytes: 400_000,
      kind: "property",
      minPass: "default",
      encode,
    });
    expect(picked.skipped).toBe(true);
    expect(encode).not.toHaveBeenCalled();
  });

  it("keeps jpeg filenames and honest last-resort copy", () => {
    expect(jpegFileName("IMG_20260909_171315_041.jpg")).toBe(
      "IMG_20260909_171315_041.jpg",
    );
    expect(jpegFileName("photo.HEIC")).toBe("photo.jpg");
    expect(stillTooLargeAfterOptimizeMessage("yard.jpg", 5_000_000)).toMatch(
      /maximum compression/,
    );
    expect(stillTooLargeAfterOptimizeMessage("yard.jpg", 5_000_000)).not.toMatch(
      /optimization should shrink it/i,
    );
  });
});

describe("typical phone JPEG vs Vercel 4.5 MB gate", () => {
  it("shrinks a high-entropy 12MP camera JPEG under the upload budget", async () => {
    const source = await makeNoisyPhoneJpeg();
    expect(source.byteLength).toBeGreaterThan(VERCEL_FUNCTION_BODY_LIMIT_BYTES);

    const meta = await sharp(source).metadata();
    const srcW = meta.width ?? 0;
    const srcH = meta.height ?? 0;

    const picked = await pickClientOptimizeEncoding({
      originalBytes: source.byteLength,
      kind: "property",
      minPass: "default",
      label: "20240925_134502.jpg",
      encode: ({ maxEdge, quality }) =>
        sharpEncode(source, srcW, srcH, maxEdge, quality),
    });

    expect(picked.skipped).toBe(false);
    if (picked.skipped) return;
    expect(picked.result.bytes.byteLength).toBeLessThanOrEqual(
      CLIENT_UPLOAD_MAX_BYTES,
    );
    expect(picked.result.bytes.byteLength).toBeLessThan(source.byteLength);
    expect(Math.max(picked.result.width, picked.result.height)).toBeLessThanOrEqual(
      2048,
    );

    const retry = await pickClientOptimizeEncoding({
      originalBytes: source.byteLength,
      kind: "property",
      minPass: "retry",
      label: "20240925_134502.jpg",
      encode: ({ maxEdge, quality }) =>
        sharpEncode(source, srcW, srcH, maxEdge, quality),
    });
    expect(retry.skipped).toBe(false);
    if (retry.skipped) return;
    expect(Math.max(retry.result.width, retry.result.height)).toBeLessThanOrEqual(
      1600,
    );
    expect(retry.result.bytes.byteLength).toBeLessThanOrEqual(
      picked.result.bytes.byteLength,
    );
  }, 60_000);

  it("server Sharp still stores a noisy 12MP photo under the 1.5 MB target", async () => {
    const source = await makeNoisyPhoneJpeg({ width: 2400, height: 1800 });
    const result = await optimizeUploadImage(source, "property");
    expect(result.bytes).toBeLessThanOrEqual(1_500_000);
    expect(Math.max(result.width, result.height)).toBeLessThanOrEqual(2048);
  }, 60_000);
});
