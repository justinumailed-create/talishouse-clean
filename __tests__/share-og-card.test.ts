import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  SHARE_OG_HEIGHT,
  SHARE_OG_LOGO_MARGIN_RIGHT,
  SHARE_OG_WIDTH,
  esriWorldImageryUrl,
  lngLatToWebMercator,
  planMapsiteShareOg,
  planViewerShareOg,
  shareOgImageryBbox,
  shareOgLogoPlacement,
  shareOgPinPlacement,
} from "../lib/share/og-card";
import { fetchOgImageBuffer } from "../lib/share/fetch-og-image";
import { renderShareOgCard } from "../lib/share/render-share-og";

const DC02 = { latitude: 45.4215, longitude: -75.6972 };

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

describe("share OG composition", () => {
  it("centers the pin on a landscape frame and parks the logo on the right", () => {
    expect(SHARE_OG_WIDTH / SHARE_OG_HEIGHT).toBeCloseTo(1.904, 2);

    const pin = shareOgPinPlacement();
    expect(pin.tip).toEqual({ x: SHARE_OG_WIDTH / 2, y: SHARE_OG_HEIGHT / 2 });
    expect(pin.left + 43).toBe(pin.tip.x);
    expect(pin.top + 112).toBe(pin.tip.y);
    expect(pin.left).toBeGreaterThan(0);
    expect(pin.top).toBeGreaterThan(0);

    const logo = shareOgLogoPlacement();
    expect(logo.left).toBeGreaterThan(pin.tip.x);
    expect(logo.top + logo.height / 2).toBe(SHARE_OG_HEIGHT / 2);
    expect(logo.left + logo.width).toBe(SHARE_OG_WIDTH - SHARE_OG_LOGO_MARGIN_RIGHT);
    expect(logo.width).toBeLessThan(SHARE_OG_WIDTH / 4);
  });

  it("centers the satellite bbox on the listing coordinates", () => {
    const box = shareOgImageryBbox(DC02);
    const center = lngLatToWebMercator(DC02.longitude, DC02.latitude);
    expect((box.west + box.east) / 2).toBeCloseTo(center.x, 3);
    expect((box.south + box.north) / 2).toBeCloseTo(center.y, 3);
    expect(box.east - box.west).toBeGreaterThan(box.north - box.south);

    const url = esriWorldImageryUrl({ ...DC02, zoom: 18 });
    expect(url).toContain("World_Imagery/MapServer/export");
    expect(url).toContain("bboxSR=3857");
    expect(url).toContain(`size=${SHARE_OG_WIDTH}%2C${SHARE_OG_HEIGHT}`);
    expect(shareOgImageryBbox({ ...DC02, zoom: 18 }).zoom).toBe(17);
    expect(shareOgImageryBbox({ ...DC02, zoom: 3 }).zoom).toBe(15);
  });

  it("plans a map pin for Mapsite™ links and a pin-free parting shot for the viewer", () => {
    expect(
      planMapsiteShareOg({
        hasCoordinates: true,
        scenicImageUrl: "https://cdn.example/parting.webp",
      }),
    ).toEqual({ kind: "satellite", showPin: true });
    expect(
      planMapsiteShareOg({
        hasCoordinates: false,
        scenicImageUrl: "https://cdn.example/parting.webp",
      }),
    ).toEqual({
      kind: "scenic",
      imageUrl: "https://cdn.example/parting.webp",
      showPin: true,
    });
    expect(planMapsiteShareOg({ hasCoordinates: false })).toEqual({
      kind: "fallback",
      showPin: true,
    });
    expect(
      planViewerShareOg({ partingShotUrl: "https://cdn.example/parting.webp" }),
    ).toEqual({
      kind: "scenic",
      imageUrl: "https://cdn.example/parting.webp",
      showPin: false,
    });
    expect(planViewerShareOg({ partingShotUrl: null })).toEqual({
      kind: "fallback",
      showPin: false,
    });
  });

  it("loads public image files and skips private hosts", async () => {
    const logo = await fetchOgImageBuffer("/logo.png");
    expect(logo && logo.length).toBeGreaterThan(1000);
    expect(await fetchOgImageBuffer("/../logo.png")).toBeNull();
    expect(await fetchOgImageBuffer("http://127.0.0.1/logo.png")).toBeNull();
    expect(await fetchOgImageBuffer("http://169.254.169.254/latest")).toBeNull();
  });

  it("renders a 1200×630 card with a centered red pin and the logo on the right", async () => {
    const background = await sharp({
      create: {
        width: 80,
        height: 40,
        channels: 3,
        background: "#1f8a3b",
      },
    })
      .jpeg()
      .toBuffer();
    const logo = await readFile(path.join(process.cwd(), "public/logo.png"));
    const jpeg = await renderShareOgCard({ background, showPin: true, logo });
    const { data, info } = await sharp(jpeg)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    expect(info.width).toBe(SHARE_OG_WIDTH);
    expect(info.height).toBe(SHARE_OG_HEIGHT);

    const pinBody = pixel(data, info.width, info.channels, 600, 270);
    expect(pinBody[0]).toBeGreaterThan(180);
    expect(pinBody[0]).toBeGreaterThan(pinBody[1] + 80);
    expect(pinBody[0]).toBeGreaterThan(pinBody[2] + 80);

    const leftPhoto = pixel(data, info.width, info.channels, 40, 315);
    expect(leftPhoto[1]).toBeGreaterThan(leftPhoto[0] + 40);

    const logoSlot = shareOgLogoPlacement();
    const logoPixel = pixel(
      data,
      info.width,
      info.channels,
      logoSlot.left + Math.round(logoSlot.width / 2),
      logoSlot.top + Math.round(logoSlot.height / 2),
    );
    const logoIsNotThePhoto =
      Math.abs(logoPixel[1] - leftPhoto[1]) > 40 ||
      Math.abs(logoPixel[0] - leftPhoto[0]) > 40;
    expect(logoIsNotThePhoto).toBe(true);

    const withoutPin = await renderShareOgCard({
      background,
      showPin: false,
      logo,
    });
    const plain = await sharp(withoutPin)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const center = pixel(plain.data, plain.info.width, plain.info.channels, 600, 270);
    expect(center[1]).toBeGreaterThan(center[0]);
  });
});
