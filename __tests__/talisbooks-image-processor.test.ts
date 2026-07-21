import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  TALISBOOKS_PREFERRED_PAGE_ASPECT_RATIO,
  buildCenterfoldLayout,
  computeLandscapeSplitWidths,
  detectImageOrientation,
  exceedsPreferredPageRatio,
  isLandscapeImage,
  processImageBuffer,
  shouldGenerateCenterfold,
  shouldSplitImage,
  splitLandscapeImage,
  verifyCenterfoldAlignment,
} from "../lib/talisbooks/image-engine";

async function createSolidImage(width: number, height: number, color: string): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  })
    .png()
    .toBuffer();
}

async function createTwoToneLandscape(width: number, height: number): Promise<Buffer> {
  const { leftWidth, rightWidth } = computeLandscapeSplitWidths(width);

  const [leftHalf, rightHalf] = await Promise.all([
    createSolidImage(leftWidth, height, "#ff0000"),
    createSolidImage(rightWidth, height, "#0000ff"),
  ]);

  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite([
      { input: leftHalf, left: 0, top: 0 },
      { input: rightHalf, left: leftWidth, top: 0 },
    ])
    .png()
    .toBuffer();
}

function hashBuffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

describe("detectImageOrientation", () => {
  it("detects landscape when width is greater than height but below panorama ratio", () => {
    expect(detectImageOrientation({ width: 1600, height: 900 })).toBe("landscape");
    expect(isLandscapeImage({ width: 1600, height: 900 })).toBe(true);
  });

  it("detects panorama for ultra-wide landscapes", () => {
    expect(detectImageOrientation({ width: 2700, height: 900 })).toBe("panorama");
  });

  it("detects portrait when height is greater than width", () => {
    expect(detectImageOrientation({ width: 900, height: 1600 })).toBe("portrait");
  });

  it("detects square when width equals height", () => {
    expect(detectImageOrientation({ width: 1000, height: 1000 })).toBe("square");
  });

  it("rejects invalid dimensions", () => {
    expect(() => detectImageOrientation({ width: 0, height: 100 })).toThrow(
      "Image dimensions must be positive numbers.",
    );
  });
});

describe("preferred ratio + centerfold generation", () => {
  it("uses 4:3 as the preferred single-page aspect", () => {
    expect(TALISBOOKS_PREFERRED_PAGE_ASPECT_RATIO).toBeCloseTo(4 / 3);
  });

  it("generates centerfold when landscape exceeds preferred ratio", () => {
    expect(exceedsPreferredPageRatio({ width: 1600, height: 900 })).toBe(true);
    expect(shouldGenerateCenterfold({ width: 1600, height: 900 })).toBe(true);
    expect(shouldSplitImage({ width: 1600, height: 900 })).toBe(true);
  });

  it("generates centerfold for panoramas that exceed preferred ratio", () => {
    expect(shouldGenerateCenterfold({ width: 2700, height: 900 })).toBe(true);
  });

  it("does not centerfold portrait or near-square uploads", () => {
    expect(shouldGenerateCenterfold({ width: 900, height: 1600 })).toBe(false);
    expect(shouldGenerateCenterfold({ width: 1000, height: 1000 })).toBe(false);
    // Mildly wide but within preferred page ratio
    expect(shouldGenerateCenterfold({ width: 1200, height: 1000 })).toBe(false);
  });
});

describe("computeLandscapeSplitWidths", () => {
  it("splits even widths evenly", () => {
    expect(computeLandscapeSplitWidths(200)).toEqual({ leftWidth: 100, rightWidth: 100 });
  });

  it("assigns the extra pixel to the right half for odd widths", () => {
    expect(computeLandscapeSplitWidths(201)).toEqual({ leftWidth: 100, rightWidth: 101 });
  });
});

describe("verifyCenterfoldAlignment", () => {
  it("confirms perfect seam alignment when halves reconstruct the original", () => {
    const alignment = verifyCenterfoldAlignment({
      original: { width: 201, height: 100 },
      left: { width: 100, height: 100 },
      right: { width: 101, height: 100 },
    });

    expect(alignment.aligned).toBe(true);
    expect(alignment.seamAligned).toBe(true);
    expect(alignment.heightMatched).toBe(true);
    expect(alignment.widthPreserved).toBe(true);
  });

  it("rejects misaligned halves", () => {
    const alignment = verifyCenterfoldAlignment({
      original: { width: 200, height: 100 },
      left: { width: 90, height: 100 },
      right: { width: 100, height: 100 },
    });

    expect(alignment.aligned).toBe(false);
    expect(alignment.widthPreserved).toBe(false);
  });
});

describe("splitLandscapeImage", () => {
  it("extracts left and right facing pages from a landscape image", async () => {
    const source = await createTwoToneLandscape(200, 100);
    const result = await splitLandscapeImage(source);

    expect(result.original).toEqual({ width: 200, height: 100 });
    expect(result.leftWidth).toBe(100);
    expect(result.rightWidth).toBe(100);

    const leftMeta = await sharp(result.left).metadata();
    const rightMeta = await sharp(result.right).metadata();

    expect(leftMeta.width).toBe(100);
    expect(leftMeta.height).toBe(100);
    expect(rightMeta.width).toBe(100);
    expect(rightMeta.height).toBe(100);
  });

  it("does not modify the original buffer", async () => {
    const source = await createTwoToneLandscape(201, 100);
    const beforeHash = hashBuffer(source);

    await splitLandscapeImage(source);

    expect(hashBuffer(source)).toBe(beforeHash);
  });

  it("rejects non-landscape images", async () => {
    const portrait = await createSolidImage(100, 200, "#00ff00");
    await expect(splitLandscapeImage(portrait)).rejects.toThrow(
      "Landscape split requires width greater than height.",
    );
  });
});

describe("buildCenterfoldLayout", () => {
  it("builds a spread layout for facing left and right pages", () => {
    const layout = buildCenterfoldLayout({
      sourceName: "kitchen-hero.jpg",
      sourceWidth: 200,
      sourceHeight: 100,
      leftWidth: 100,
      rightWidth: 100,
      layoutId: "layout-12345678",
    });

    expect(layout.layoutType).toBe("spread");
    expect(layout.gridConfig.centerfold).toBe(true);
    expect(layout.config.pages).toEqual([
      { side: "left", imageRole: "derived_left", fit: "cover", bleed: true },
      { side: "right", imageRole: "derived_right", fit: "cover", bleed: true },
    ]);
    expect(layout.slug).toContain("centerfold-kitchen-hero");
  });
});

describe("processImageBuffer — automatic centerfold", () => {
  it("splits landscape uploads into derived left and right assets with preview", async () => {
    const source = await createTwoToneLandscape(200, 100);
    const result = await processImageBuffer(source, { sourceName: "spread-photo.png" });

    expect(result.orientation).toBe("landscape");
    expect(result.split).toBe(true);
    expect(result.assets).toHaveLength(2);
    expect(result.assets.map((asset) => asset.role)).toEqual(["derived_left", "derived_right"]);
    expect(result.centerfoldLayout).not.toBeNull();
    expect(result.centerfoldPreview?.reviewStatus).toBe("pending_preview");
    expect(result.centerfoldPreview?.originalPreserved).toBe(true);
    expect(result.alignment?.aligned).toBe(true);
  });

  it("splits panorama uploads into aligned centerfold halves", async () => {
    const source = await createTwoToneLandscape(2700, 900);
    const result = await processImageBuffer(source, { sourceName: "pano.png" });

    expect(result.orientation).toBe("panorama");
    expect(result.split).toBe(true);
    expect(result.alignment?.aligned).toBe(true);
    expect(result.centerfoldLayout?.config.sourceOrientation).toBe("panorama");
  });

  it("keeps portrait uploads unchanged with no derived assets", async () => {
    const source = await createSolidImage(900, 1600, "#123456");
    const result = await processImageBuffer(source, { sourceName: "portrait-cover.png" });

    expect(result.orientation).toBe("portrait");
    expect(result.split).toBe(false);
    expect(result.assets).toHaveLength(0);
    expect(result.centerfoldLayout).toBeNull();
    expect(result.centerfoldPreview).toBeNull();
  });

  it("keeps square uploads unchanged with no derived assets", async () => {
    const source = await createSolidImage(1200, 1200, "#abcdef");
    const result = await processImageBuffer(source, { sourceName: "square-tile.png" });

    expect(result.orientation).toBe("square");
    expect(result.split).toBe(false);
    expect(result.assets).toHaveLength(0);
    expect(result.centerfoldLayout).toBeNull();
  });

  it("does not permanently modify the original upload buffer", async () => {
    const source = await createTwoToneLandscape(201, 100);
    const beforeHash = hashBuffer(source);

    await processImageBuffer(source, { sourceName: "preserve-original.png" });

    expect(hashBuffer(source)).toBe(beforeHash);
  });

  it("preserves distinct left and right content in derived assets", async () => {
    const source = await createTwoToneLandscape(200, 100);
    const result = await processImageBuffer(source, { sourceName: "two-tone.png" });

    const leftAsset = result.assets.find((asset) => asset.role === "derived_left");
    const rightAsset = result.assets.find((asset) => asset.role === "derived_right");

    expect(leftAsset).toBeDefined();
    expect(rightAsset).toBeDefined();

    const leftStats = await sharp(leftAsset!.buffer).stats();
    const rightStats = await sharp(rightAsset!.buffer).stats();

    expect(leftStats.channels[0].mean).toBeGreaterThan(rightStats.channels[0].mean);
    expect(rightStats.channels[2].mean).toBeGreaterThan(leftStats.channels[2].mean);
  });
});
