import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";
import { renderAllPinsOgCard } from "@/lib/share/render-allpins-og";
import {
  TALISPROS_OG_BG,
  TALISPROS_OG_HEIGHT,
  TALISPROS_OG_LOGO_PATH,
  TALISPROS_OG_PARTNER_PATH,
  TALISPROS_OG_WIDTH,
  talisprosOgLogoPlacement,
  talisprosOgMapPlacement,
  talisprosOgPartnerPlacement,
} from "@/lib/share/talispros-og-card";

function publicPath(assetPath: string): string {
  return path.join(process.cwd(), "public", assetPath.replace(/^\//, ""));
}

export async function readTalisprosOgLogo(): Promise<Buffer> {
  return readFile(publicPath(TALISPROS_OG_LOGO_PATH));
}

export async function readTalisprosOgPartner(): Promise<Buffer> {
  return readFile(publicPath(TALISPROS_OG_PARTNER_PATH));
}

/**
 * Compose the brand share card: soft chrome background, logo + Aisha on the
 * left, ALLPINS multi-pin Mapsite™ map on the right.
 */
export async function renderTalisprosOgCard(input?: {
  logo?: Buffer | null;
  partner?: Buffer | null;
  /** Pre-rendered ALLPINS map panel (tests). Live path loads pins + imagery. */
  mapPanel?: Buffer | null;
}): Promise<Buffer> {
  const background = await sharp({
    create: {
      width: TALISPROS_OG_WIDTH,
      height: TALISPROS_OG_HEIGHT,
      channels: 3,
      background: TALISPROS_OG_BG,
    },
  })
    .png()
    .toBuffer();

  const logoSlot = talisprosOgLogoPlacement();
  const logoPng = await sharp(input?.logo ?? (await readTalisprosOgLogo()))
    .resize(logoSlot.width, logoSlot.height, {
      fit: "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const logoMeta = await sharp(logoPng).metadata();
  const logoW = logoMeta.width ?? logoSlot.width;
  const logoH = logoMeta.height ?? logoSlot.height;

  const partnerSlot = talisprosOgPartnerPlacement();
  // Keep portrait inside the frame if logo + gap + height would overflow.
  const maxPartnerHeight = Math.max(
    120,
    TALISPROS_OG_HEIGHT - partnerSlot.top - 40,
  );
  const partnerHeight = Math.min(partnerSlot.height, maxPartnerHeight);
  const partnerWidth = Math.round(
    (partnerSlot.width / partnerSlot.height) * partnerHeight,
  );

  const partnerJpeg = await sharp(input?.partner ?? (await readTalisprosOgPartner()))
    .rotate()
    .resize(partnerWidth, partnerHeight, {
      fit: "cover",
      position: "top",
    })
    .jpeg({ quality: 90 })
    .toBuffer();

  // Rounded mask so the portrait matches Mapsite™ market-partner chrome.
  const radius = 24;
  const roundedMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${partnerWidth}" height="${partnerHeight}">
      <rect width="${partnerWidth}" height="${partnerHeight}" rx="${radius}" ry="${radius}" fill="#fff"/>
    </svg>`,
  );
  const partnerRounded = await sharp(partnerJpeg)
    .composite([{ input: roundedMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const composites: OverlayOptions[] = [
    {
      input: logoPng,
      left: logoSlot.left + Math.round((logoSlot.width - logoW) / 2),
      top: logoSlot.top + Math.round((logoSlot.height - logoH) / 2),
    },
    {
      input: partnerRounded,
      left: partnerSlot.left,
      top: partnerSlot.top,
    },
  ];

  const mapSlot = talisprosOgMapPlacement();
  try {
    const mapSource =
      input?.mapPanel ??
      (await renderAllPinsOgCard({
        includeLogo: false,
        width: mapSlot.width,
        height: mapSlot.height,
      }));
    const mapPanel = await sharp(mapSource)
      .resize(mapSlot.width, mapSlot.height, {
        fit: "cover",
        position: "centre",
      })
      .jpeg({ quality: 86 })
      .toBuffer();
    composites.push({
      input: mapPanel,
      left: mapSlot.left,
      top: mapSlot.top,
    });
  } catch (error) {
    console.warn(
      "[og] ALLPINS map panel failed; leaving chrome on the right:",
      error instanceof Error ? error.message : error,
    );
  }

  return sharp(background)
    .composite(composites)
    .jpeg({ quality: 88 })
    .toBuffer();
}
