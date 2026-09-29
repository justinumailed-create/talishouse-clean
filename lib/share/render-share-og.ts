import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";
import {
  SHARE_OG_HEIGHT,
  SHARE_OG_LOGO_PATH,
  SHARE_OG_PIN_COLOR,
  SHARE_OG_WIDTH,
  shareOgLogoPlacement,
  shareOgPinPlacement,
  shareOgPinSvg,
  type ShareOgProjectedPin,
} from "@/lib/share/og-card";

const FALLBACK_BG = "#1a3348";

export async function readShareOgLogo(logoPath = SHARE_OG_LOGO_PATH): Promise<Buffer> {
  return readFile(path.join(process.cwd(), "public", logoPath.replace(/^\//, "")));
}

async function pinPng(color: string, scale = 1): Promise<Buffer> {
  return sharp(Buffer.from(shareOgPinSvg(color, scale))).png().toBuffer();
}

export async function renderShareOgCard(input: {
  background?: Buffer | null;
  showPin: boolean;
  /** Single-pin colour (Mapsite™ listing cards). Defaults to brand red. */
  pinColor?: string;
  /**
   * Multi-pin overlays (ALLPINS). When non-empty, these replace the single
   * centered pin — each tip is already projected into the OG frame.
   */
  pinOverlays?: ShareOgProjectedPin[];
  logo?: Buffer | null;
  /** When false, skip the brand mark (brand OG already places logo on the left). */
  includeLogo?: boolean;
  /** Output frame size (defaults to full landscape OG). */
  width?: number;
  height?: number;
}): Promise<Buffer> {
  const width = input.width ?? SHARE_OG_WIDTH;
  const height = input.height ?? SHARE_OG_HEIGHT;
  const background = input.background
    ? await sharp(input.background)
        .rotate()
        .resize(width, height, {
          fit: "cover",
          position: "centre",
        })
        .toBuffer()
    : await sharp({
        create: {
          width,
          height,
          channels: 3,
          background: FALLBACK_BG,
        },
      })
        .jpeg()
        .toBuffer();

  const composites: OverlayOptions[] = [];
  const overlays = input.pinOverlays ?? [];

  if (overlays.length > 0) {
    for (const overlay of overlays) {
      composites.push({
        input: await pinPng(overlay.color, overlay.scale),
        left: overlay.left,
        top: overlay.top,
      });
    }
  } else if (input.showPin) {
    const pin = shareOgPinPlacement();
    composites.push({
      input: await pinPng(input.pinColor?.trim() || SHARE_OG_PIN_COLOR),
      left: pin.left,
      top: pin.top,
    });
  }

  if (input.includeLogo !== false) {
    const slot = shareOgLogoPlacement();
    // Keep logo inside the frame when rendering a narrower panel.
    const logoLeft = Math.min(slot.left, Math.max(0, width - slot.width - 12));
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
      left: logoLeft + Math.round((slot.width - logoW) / 2),
      top: Math.round((height - logoH) / 2),
    });
  }

  return sharp(background).composite(composites).jpeg({ quality: 86 }).toBuffer();
}
