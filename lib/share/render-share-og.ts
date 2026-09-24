import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";
import {
  SHARE_OG_HEIGHT,
  SHARE_OG_LOGO_PATH,
  SHARE_OG_WIDTH,
  shareOgLogoPlacement,
  shareOgPinPlacement,
  shareOgPinSvg,
} from "@/lib/share/og-card";

const FALLBACK_BG = "#1a3348";

export async function readShareOgLogo(): Promise<Buffer> {
  return readFile(path.join(process.cwd(), "public", SHARE_OG_LOGO_PATH.replace(/^\//, "")));
}

export async function renderShareOgCard(input: {
  background?: Buffer | null;
  showPin: boolean;
  logo?: Buffer | null;
}): Promise<Buffer> {
  const background = input.background
    ? await sharp(input.background)
        .rotate()
        .resize(SHARE_OG_WIDTH, SHARE_OG_HEIGHT, {
          fit: "cover",
          position: "centre",
        })
        .toBuffer()
    : await sharp({
        create: {
          width: SHARE_OG_WIDTH,
          height: SHARE_OG_HEIGHT,
          channels: 3,
          background: FALLBACK_BG,
        },
      })
        .jpeg()
        .toBuffer();

  const composites: OverlayOptions[] = [];

  if (input.showPin) {
    const pin = shareOgPinPlacement();
    composites.push({
      input: await sharp(Buffer.from(shareOgPinSvg())).png().toBuffer(),
      left: pin.left,
      top: pin.top,
    });
  }

  const slot = shareOgLogoPlacement();
  const logoPng = await sharp(input.logo ?? (await readShareOgLogo()))
    .resize(slot.width, slot.height, {
      fit: "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const meta = await sharp(logoPng).metadata();
  const logoW = meta.width ?? slot.width;
  const logoH = meta.height ?? slot.height;
  composites.push({
    input: logoPng,
    left: slot.left + Math.round((slot.width - logoW) / 2),
    top: slot.top + Math.round((slot.height - logoH) / 2),
  });

  return sharp(background).composite(composites).jpeg({ quality: 86 }).toBuffer();
}
