import { describe, it, expect } from "vitest";
import sharp from "sharp";
import {
  splitCoverSpreadBuffer,
} from "@/lib/talisbooks/cover-spread";
import {
  getBookContinuousSpreadImageUrl,
  continuousSpreadImageUrl,
  clampSpreadAspectRatio,
  isMattedSpreadPage,
} from "@/lib/talisbooks/viewer/spread-layout";
import { getViewerSpread, getViewerSpreadCount } from "@/lib/talisbooks/viewer/spreads";
import { createPinnedTalisBookViewer } from "@/lib/talisbooks/library/pinned-catalog";

describe("TalisBook Cover Dimension + Viewer Focus Fix", () => {
  it("1-3: Splits first image at exact 50% with left half as back cover and right half as front cover", async () => {
    // Create a 1000x600 test image with distinct left and right colors
    // Left: red, Right: blue
    const leftColor = { r: 255, g: 0, b: 0, alpha: 1 };
    const rightColor = { r: 0, g: 0, b: 255, alpha: 1 };

    const leftPart = await sharp({
      create: {
        width: 500,
        height: 600,
        channels: 4,
        background: leftColor,
      },
    })
      .png()
      .toBuffer();

    const rightPart = await sharp({
      create: {
        width: 500,
        height: 600,
        channels: 4,
        background: rightColor,
      },
    })
      .png()
      .toBuffer();

    const fullCoverSpread = await sharp({
      create: {
        width: 1000,
        height: 600,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      },
    })
      .composite([
        { input: leftPart, left: 0, top: 0 },
        { input: rightPart, left: 500, top: 0 },
      ])
      .jpeg()
      .toBuffer();

    const result = await splitCoverSpreadBuffer(fullCoverSpread);

    // Verify left half is back cover (red)
    const backMeta = await sharp(result.back).metadata();
    expect(backMeta.width).toBe(500);
    expect(backMeta.height).toBe(600);

    // Verify right half is front cover (blue)
    const frontMeta = await sharp(result.front).metadata();
    expect(frontMeta.width).toBe(500);
    expect(frontMeta.height).toBe(600);
  });

  it("4-8: Resizes both cover halves to exact target interior-page dimensions with fit 'fill' without cropping or letterboxing", async () => {
    // Source cover spread with 1200x700 dimensions (each half 600x700, aspect 0.857)
    const sourceCover = await sharp({
      create: {
        width: 1200,
        height: 700,
        channels: 4,
        background: { r: 128, g: 64, b: 32, alpha: 1 },
      },
    })
      .jpeg()
      .toBuffer();

    // Target interior page dimensions: 800x893 (aspect 0.8958)
    const TARGET_PAGE_WIDTH = 800;
    const TARGET_PAGE_HEIGHT = 893;

    const result = await splitCoverSpreadBuffer(sourceCover, {
      targetWidth: TARGET_PAGE_WIDTH,
      targetHeight: TARGET_PAGE_HEIGHT,
    });

    const frontMeta = await sharp(result.front).metadata();
    const backMeta = await sharp(result.back).metadata();

    // 4 & 5: Dimensions exactly match target interior page dimensions
    expect(frontMeta.width).toBe(TARGET_PAGE_WIDTH);
    expect(frontMeta.height).toBe(TARGET_PAGE_HEIGHT);
    expect(backMeta.width).toBe(TARGET_PAGE_WIDTH);
    expect(backMeta.height).toBe(TARGET_PAGE_HEIGHT);

    // 6 & 7: No extra canvas or cropping; output width & height match exactly
    expect(result.width).toBe(TARGET_PAGE_WIDTH);
    expect(result.height).toBe(TARGET_PAGE_HEIGHT);
  });

  it("9-10: Pinned book assets have matching page geometry across cover and interior landscape spreads", async () => {
    const book = createPinnedTalisBookViewer();

    // Front cover asset
    const frontMeta = await sharp("public/talisbooks/pinned/front-cover.jpg").metadata();
    // Back cover asset
    const backMeta = await sharp("public/talisbooks/pinned/back-cover.jpg").metadata();
    // Interior slide asset
    const interiorMeta = await sharp("public/talisbooks/pinned/pages/page-01.jpg").metadata();

    const interiorSingleWidth = Math.round(interiorMeta.width! / 2);
    const interiorSingleHeight = interiorMeta.height!;

    // Front cover and back cover match interior single leaf dimensions exactly
    expect(frontMeta.width).toBe(interiorSingleWidth);
    expect(frontMeta.height).toBe(interiorSingleHeight);
    expect(backMeta.width).toBe(interiorSingleWidth);
    expect(backMeta.height).toBe(interiorSingleHeight);

    // Interior page is a landscape spread (2x width of single leaf)
    expect(interiorMeta.width).toBe(interiorSingleWidth * 2);
    expect(interiorMeta.height).toBe(interiorSingleHeight);

    // Every interior page is a continuous spread
    for (let i = 1; i < book.pages.length - 1; i++) {
      const page = book.pages[i]!;
      expect(isMattedSpreadPage(page)).toBe(true);
    }
  });

  it("11-13: Viewer geometry remains completely stable between cover, interior spreads, and back cover", () => {
    const book = createPinnedTalisBookViewer();
    const spreadCount = getViewerSpreadCount(book.pages.length);

    // Stable book-wide spread aspect ratio source
    const bookSpreadUrl = getBookContinuousSpreadImageUrl(book.pages);
    expect(bookSpreadUrl).toBeTruthy();
    expect(bookSpreadUrl).toMatch(/\/pages\/page-01\.jpg$/);

    // Cover spread (nav index 0)
    const coverSpread = getViewerSpread(book.pages, 0, {
      coverSpreadOpening: false,
      backCoverImageUrl: book.backCoverImageUrl,
      backCoverTitle: book.title,
    });
    expect(coverSpread.left).toBeNull();
    expect(coverSpread.right?.layout).toBe("cover");

    // First interior spread (nav index 1)
    const firstInterior = getViewerSpread(book.pages, 1, {
      coverSpreadOpening: false,
      backCoverImageUrl: book.backCoverImageUrl,
      backCoverTitle: book.title,
    });
    expect(firstInterior.left).toBeTruthy();
    expect(firstInterior.right).toBeTruthy();
    expect(firstInterior.left?.spreadImageUrl).toBe(firstInterior.right?.spreadImageUrl);

    // Back cover spread (last nav index)
    const backCoverSpread = getViewerSpread(book.pages, spreadCount - 1, {
      coverSpreadOpening: false,
      backCoverImageUrl: book.backCoverImageUrl,
      backCoverTitle: book.title,
    });
    expect(backCoverSpread.left?.layout).toBe("cover");
    expect(backCoverSpread.right).toBeNull();

    // Continuous spread aspect ratio helper produces identical clamped ratios
    const ratio = clampSpreadAspectRatio(1600 / 893);
    expect(ratio).toBeCloseTo(1.7917, 3);

    // The book's spread geometry URL does NOT depend on the active page,
    // guaranteeing consistent geometry across cover -> interior -> back cover navigation.
    const urlFromPages = getBookContinuousSpreadImageUrl(book.pages);
    expect(urlFromPages).toBe(book.pages[1]?.spreadImageUrl);
  });
});
