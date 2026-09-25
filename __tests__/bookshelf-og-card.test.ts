import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  BOOKSHELF_OG_HEIGHT,
  BOOKSHELF_OG_WIDTH,
  bookshelfOgLogoPlacement,
  bookshelfOgSceneSvg,
  bookshelfShareOgPath,
} from "../lib/share/bookshelf-og-card";
import { renderBookshelfOgCard } from "../lib/share/render-bookshelf-og";
import {
  bookshelfOgMetadataImage,
  bookshelfSeoCopy,
  resolveBookshelfOgImage,
} from "../lib/talispros/mapsite-og-image";
import { createMetadata } from "../lib/seo";
import { SHARE_OG_HEIGHT, SHARE_OG_WIDTH } from "../lib/share/og-card";

function pixel(
  data: Buffer,
  width: number,
  channels: number,
  x: number,
  y: number,
): [number, number, number] {
  const i = (y * width + x) * channels;
  return [data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0];
}

describe("bookshelf portrait OG", () => {
  it("uses a portrait frame distinct from landscape Mapsite™ / viewer cards", () => {
    expect(BOOKSHELF_OG_WIDTH / BOOKSHELF_OG_HEIGHT).toBeCloseTo(0.8, 2);
    expect(BOOKSHELF_OG_HEIGHT).toBeGreaterThan(BOOKSHELF_OG_WIDTH);
    expect(SHARE_OG_WIDTH / SHARE_OG_HEIGHT).toBeCloseTo(1.904, 2);
    expect(bookshelfShareOgPath()).toBe("/api/og/bookshelf");
    expect(bookshelfShareOgPath()).not.toContain("/api/og/mapsite");
    expect(bookshelfShareOgPath()).not.toContain("/api/og/talisbooks/");
  });

  it("parks the logo near the top center", () => {
    const logo = bookshelfOgLogoPlacement();
    expect(logo.top).toBeLessThan(BOOKSHELF_OG_HEIGHT / 4);
    expect(logo.left + logo.width / 2).toBeCloseTo(BOOKSHELF_OG_WIDTH / 2, 0);
  });

  it("draws shelf planks and a standing book in the SVG scene", () => {
    const svg = bookshelfOgSceneSvg();
    expect(svg).toContain(`width="${BOOKSHELF_OG_WIDTH}"`);
    expect(svg).toContain(`height="${BOOKSHELF_OG_HEIGHT}"`);
    expect(svg).toContain("url(#plankFace)");
    expect(svg).toContain("url(#cover)");
    expect(svg).toContain("url(#spine)");
  });

  it("renders a portrait JPEG with the Talispros™ logo composited", async () => {
    const logo = await readFile(path.join(process.cwd(), "public/logo.png"));
    const jpeg = await renderBookshelfOgCard({ logo });
    const { data, info } = await sharp(jpeg)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    expect(info.width).toBe(BOOKSHELF_OG_WIDTH);
    expect(info.height).toBe(BOOKSHELF_OG_HEIGHT);

    // Lower-shelf book cover sits around mid-x / ~900y — cool blue cover.
    const cover = pixel(data, info.width, info.channels, 540, 900);
    expect(cover[2]).toBeGreaterThan(cover[0]);

    // Soft warm wall near the top corners (below the logo slot).
    const wall = pixel(data, info.width, info.channels, 80, 400);
    expect(wall[0]).toBeGreaterThan(180);
    expect(wall[1]).toBeGreaterThan(170);
  });

  it("emits portrait bookshelf SEO + OG metadata (not ALLPINS Mapsite landscape)", () => {
    expect(bookshelfSeoCopy({ isolatedAllPins: true })).toEqual({
      title: "ALLPINS Talisbooks™ · Bookshelf",
      description:
        "Mapsite™-connected Talisbooks™ bookshelf for FAST Code ALLPINS. Open a cover to read books on the isolated shelf.",
    });
    expect(
      bookshelfSeoCopy({ fastCode: "dc02", place: "Grand River Falls" }),
    ).toEqual({
      title: "Talisbooks™ · Grand River Falls",
      description:
        "Talisbooks™ bookshelf for Grand River Falls (FAST Code DC02). Open a cover to read books connected to this Mapsite™ only.",
    });

    expect(resolveBookshelfOgImage()).toBe(
      "https://www.talispros.com/api/og/bookshelf",
    );
    const image = bookshelfOgMetadataImage("ALLPINS Talisbooks™ · Bookshelf");
    expect(image).toEqual({
      url: "https://www.talispros.com/api/og/bookshelf",
      width: BOOKSHELF_OG_WIDTH,
      height: BOOKSHELF_OG_HEIGHT,
      alt: "ALLPINS Talisbooks™ · Bookshelf",
    });
    expect(image.url).not.toContain("/api/og/mapsite/allpins");
    expect(image.width).not.toBe(SHARE_OG_WIDTH);
    expect(image.height).not.toBe(SHARE_OG_HEIGHT);

    const meta = createMetadata({
      title: image.alt!,
      description: bookshelfSeoCopy({ isolatedAllPins: true }).description,
      path: "/catalogue/bookshelf",
      image,
    });
    expect(meta.openGraph?.images).toEqual([image]);
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      images: [image.url],
    });
  });
});
