import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";
import {
  BOOKSHELF_OG_HEIGHT,
  BOOKSHELF_OG_LOGO_PATH,
  BOOKSHELF_OG_WIDTH,
  bookshelfOgLogoPlacement,
  bookshelfOgSceneSvg,
} from "@/lib/share/bookshelf-og-card";

export async function readBookshelfOgLogo(): Promise<Buffer> {
  return readFile(
    path.join(process.cwd(), "public", BOOKSHELF_OG_LOGO_PATH.replace(/^\//, "")),
  );
}

/**
 * Compose the portrait bookshelf share card: SVG shelf scene + Talispros™ logo.
 */
export async function renderBookshelfOgCard(input?: {
  logo?: Buffer | null;
}): Promise<Buffer> {
  const scene = await sharp(Buffer.from(bookshelfOgSceneSvg()))
    .resize(BOOKSHELF_OG_WIDTH, BOOKSHELF_OG_HEIGHT, {
      fit: "fill",
    })
    .png()
    .toBuffer();

  const slot = bookshelfOgLogoPlacement();
  const logoPng = await sharp(input?.logo ?? (await readBookshelfOgLogo()))
    .resize(slot.width, slot.height, {
      fit: "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const meta = await sharp(logoPng).metadata();
  const logoW = meta.width ?? slot.width;
  const logoH = meta.height ?? slot.height;

  const composites: OverlayOptions[] = [
    {
      input: logoPng,
      left: slot.left + Math.round((slot.width - logoW) / 2),
      top: slot.top + Math.round((slot.height - logoH) / 2),
    },
  ];

  return sharp(scene).composite(composites).jpeg({ quality: 88 }).toBuffer();
}
