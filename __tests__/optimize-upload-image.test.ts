import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  AGENT_PHOTO_MAX_EDGE_PX,
  PROPERTY_IMAGE_MAX_EDGE_PX,
  optimizeUploadImage,
} from "@/lib/media/optimize-upload-image";

async function makeJpeg(options: {
  width: number;
  height: number;
  quality?: number;
}): Promise<Buffer> {
  return sharp({
    create: {
      width: options.width,
      height: options.height,
      channels: 3,
      background: { r: 40, g: 90, b: 140 },
    },
  })
    .jpeg({ quality: options.quality ?? 95 })
    .toBuffer();
}

describe("optimizeUploadImage", () => {
  it("resizes property photos above 2048 and prefers webp/jpeg under target size", async () => {
    const source = await makeJpeg({ width: 4000, height: 3000, quality: 95 });
    const result = await optimizeUploadImage(source, "property");

    expect(Math.max(result.width, result.height)).toBeLessThanOrEqual(
      PROPERTY_IMAGE_MAX_EDGE_PX,
    );
    expect(result.bytes).toBeLessThan(source.byteLength);
    expect(result.bytes).toBeLessThanOrEqual(1_500_000);
    expect(["image/webp", "image/jpeg"]).toContain(result.mimeType);
    expect(result.kind).toBe("property");
  });

  it("does not upscale small property photos", async () => {
    const source = await makeJpeg({ width: 800, height: 600 });
    const result = await optimizeUploadImage(source, "property");
    expect(result.width).toBeLessThanOrEqual(800);
    expect(result.height).toBeLessThanOrEqual(600);
  });

  it("crops agent photos to a square and caps at 1200", async () => {
    const source = await makeJpeg({ width: 2400, height: 1800 });
    const result = await optimizeUploadImage(source, "agent");
    expect(result.width).toBe(result.height);
    expect(result.width).toBeLessThanOrEqual(AGENT_PHOTO_MAX_EDGE_PX);
    expect(result.kind).toBe("agent");
  });

  it("keeps logos as lossless png or webp", async () => {
    const source = await sharp({
      create: {
        width: 600,
        height: 200,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: 200,
              height: 80,
              channels: 3,
              background: { r: 20, g: 20, b: 20 },
            },
          })
            .png()
            .toBuffer(),
          top: 60,
          left: 200,
        },
      ])
      .png()
      .toBuffer();

    const result = await optimizeUploadImage(source, "logo");
    expect(["image/png", "image/webp"]).toContain(result.mimeType);
    expect(result.kind).toBe("logo");
  });
});
