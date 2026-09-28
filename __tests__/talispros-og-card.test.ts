import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  TALISPROS_OG_HEIGHT,
  TALISPROS_OG_PARTNER_PATH,
  TALISPROS_OG_WIDTH,
  talisprosBrandShareOgPath,
  talisprosOgLogoPlacement,
  talisprosOgMapPlacement,
  talisprosOgPartnerPlacement,
} from "../lib/share/talispros-og-card";
import { renderTalisprosOgCard } from "../lib/share/render-talispros-og";
import {
  resolveTalisprosBrandOgImage,
  talisprosBrandOgMetadataImage,
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

describe("Talispros brand OG (homepage + T-All catalogue)", () => {
  it("uses the landscape Mapsite™ frame with logo + partner left and map right", () => {
    expect(TALISPROS_OG_WIDTH).toBe(SHARE_OG_WIDTH);
    expect(TALISPROS_OG_HEIGHT).toBe(SHARE_OG_HEIGHT);
    expect(talisprosBrandShareOgPath()).toBe("/api/og/talispros");

    const logo = talisprosOgLogoPlacement();
    expect(logo.left).toBeLessThan(TALISPROS_OG_WIDTH / 3);
    expect(logo.top).toBeLessThan(TALISPROS_OG_HEIGHT / 4);

    const partner = talisprosOgPartnerPlacement();
    expect(partner.left).toBeLessThan(TALISPROS_OG_WIDTH / 3);
    expect(partner.top).toBeGreaterThan(logo.top + logo.height / 2);
    expect(partner.left + partner.width).toBeLessThan(TALISPROS_OG_WIDTH / 2 + 40);
    expect(TALISPROS_OG_PARTNER_PATH).toBe("/images/mapsites/aisha-c.webp");

    const map = talisprosOgMapPlacement();
    expect(map.left).toBe(TALISPROS_OG_WIDTH / 2);
    expect(map.width).toBe(TALISPROS_OG_WIDTH / 2);
    expect(map.height).toBe(TALISPROS_OG_HEIGHT);
    expect(map.top).toBe(0);
  });

  it("renders a landscape JPEG with partner on the left and map on the right", async () => {
    const logo = await readFile(path.join(process.cwd(), "public/logo.png"));
    const partner = await readFile(
      path.join(process.cwd(), "public/images/mapsites/aisha-c.webp"),
    );
    // Stub ALLPINS map panel: teal satellite stand-in with a red pin blot.
    const mapPanel = await sharp({
      create: {
        width: 600,
        height: 630,
        channels: 3,
        background: { r: 28, g: 90, b: 72 },
      },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: 36,
              height: 48,
              channels: 3,
              background: { r: 225, g: 20, b: 10 },
            },
          })
            .png()
            .toBuffer(),
          left: 280,
          top: 280,
        },
      ])
      .jpeg()
      .toBuffer();

    const jpeg = await renderTalisprosOgCard({ logo, partner, mapPanel });
    const { data, info } = await sharp(jpeg)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    expect(info.width).toBe(TALISPROS_OG_WIDTH);
    expect(info.height).toBe(TALISPROS_OG_HEIGHT);

    // Right half is the ALLPINS map panel (teal), not empty chrome.
    const mapPx = pixel(data, info.width, info.channels, 1000, 315);
    expect(mapPx[1]).toBeGreaterThan(mapPx[0]);
    expect(mapPx[1]).toBeGreaterThan(60);
    expect(mapPx[0]).toBeLessThan(80);

    // Partner portrait occupies left column (skin/hair tones, not flat chrome).
    const face = pixel(data, info.width, info.channels, 180, 320);
    const chroma =
      Math.abs(face[0] - face[1]) +
      Math.abs(face[1] - face[2]) +
      Math.abs(face[0] - face[2]);
    expect(chroma).toBeGreaterThan(10);
  });

  it("emits absolute talispros.com OG metadata for homepage and catalogue", () => {
    expect(resolveTalisprosBrandOgImage()).toBe(
      "https://www.talispros.com/api/og/talispros",
    );
    const image = talisprosBrandOgMetadataImage("Talispros™ | Claim your market");
    expect(image).toEqual({
      url: "https://www.talispros.com/api/og/talispros",
      width: TALISPROS_OG_WIDTH,
      height: TALISPROS_OG_HEIGHT,
      alt: "Talispros™ | Claim your market",
    });
    expect(image.url).not.toContain("talishouse.com");
    expect(image.url).not.toContain("/seo/talispros-og.jpg");

    const home = createMetadata({
      title: image.alt!,
      description: "Claim your market on Talispros™.",
      path: "/",
      image,
    });
    expect(home.openGraph?.images).toEqual([image]);
    expect(home.twitter).toMatchObject({
      card: "summary_large_image",
      images: [image.url],
    });

    const catalogue = createMetadata({
      title: "T-All Catalogue | Talispros",
      description: "Top-bound T-All product catalogue.",
      path: "/catalogue",
      image: talisprosBrandOgMetadataImage("T-All Catalogue | Talispros"),
    });
    expect(catalogue.openGraph?.images).toEqual([
      {
        url: "https://www.talispros.com/api/og/talispros",
        width: TALISPROS_OG_WIDTH,
        height: TALISPROS_OG_HEIGHT,
        alt: "T-All Catalogue | Talispros",
      },
    ]);
  });
});
