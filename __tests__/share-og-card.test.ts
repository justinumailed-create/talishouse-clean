import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  SHARE_OG_HEIGHT,
  SHARE_OG_LOGO_MARGIN_RIGHT,
  SHARE_OG_PIN_COLOR,
  SHARE_OG_WIDTH,
  esriWorldImageryUrl,
  esriWorldImageryUrlWide,
  lngLatToWebMercator,
  planMapsiteShareOg,
  planViewerShareOg,
  projectPinsOntoShareOg,
  shareOgImageryBbox,
  shareOgLogoPlacement,
  shareOgPinPlacement,
  shareOgPinSvg,
  shareOgWideImageryBbox,
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

describe("ALLPINS multi-pin OG", () => {
  it("builds a wide Canada bbox without clamping to listing zoom", () => {
    const box = shareOgWideImageryBbox({
      latitude: 56.1,
      longitude: -96.0,
      zoom: 4,
    });
    expect(box.zoom).toBe(4);
    expect(box.east - box.west).toBeGreaterThan(box.north - box.south);
    const url = esriWorldImageryUrlWide({
      latitude: 56.1,
      longitude: -96.0,
      zoom: 4,
    });
    expect(url).toContain("World_Imagery/MapServer/export");
    expect(url).toContain(`size=${SHARE_OG_WIDTH}%2C${SHARE_OG_HEIGHT}`);
  });

  it("projects coloured pins into the OG frame and keeps the logo on the right", () => {
    const { overlays } = projectPinsOntoShareOg({
      latitude: 45.5,
      longitude: -75.7,
      zoom: 6,
      scale: 0.4,
      pins: [
        { latitude: 45.42, longitude: -75.7, color: "#1A73E8" },
        { latitude: 45.6, longitude: -75.5, color: "#E10600" },
        { latitude: 45.3, longitude: -75.9, color: "#34A853" },
      ],
    });
    expect(overlays.length).toBe(3);
    expect(overlays[0]!.color).toBe("#1A73E8");
    expect(overlays[0]!.scale).toBe(0.4);
    for (const overlay of overlays) {
      expect(overlay.left).toBeGreaterThan(-80);
      expect(overlay.top).toBeGreaterThan(-120);
      expect(overlay.left + overlay.width).toBeLessThan(SHARE_OG_WIDTH + 80);
    }
    const logo = shareOgLogoPlacement();
    expect(logo.left).toBeGreaterThan(SHARE_OG_WIDTH / 2);
  });

  it("renders a multi-pin landscape card with distinct pin colours", async () => {
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
    const { overlays } = projectPinsOntoShareOg({
      latitude: 45.5,
      longitude: -75.7,
      zoom: 6,
      scale: 0.5,
      pins: [
        { latitude: 45.5, longitude: -75.7, color: "#1A73E8" },
        { latitude: 45.55, longitude: -75.55, color: "#E10600" },
      ],
    });
    expect(overlays.length).toBeGreaterThanOrEqual(1);
    const jpeg = await renderShareOgCard({
      background,
      showPin: false,
      pinOverlays: overlays,
      logo,
    });
    const meta = await sharp(jpeg).metadata();
    expect(meta.width).toBe(SHARE_OG_WIDTH);
    expect(meta.height).toBe(SHARE_OG_HEIGHT);
    expect(shareOgPinSvg("#1A73E8")).toContain("#1A73E8");
    expect(shareOgPinSvg("not-a-color")).toContain(SHARE_OG_PIN_COLOR);
  });
});

