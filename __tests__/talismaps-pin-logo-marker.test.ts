import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  buildPinBodySvg,
  pinLogoInsetPercent,
  pinLogoSizePx,
  resolvePinVisual,
  renderPinMarkerHtml,
  TALISMAPS_PIN_BORDER_WIDTH,
  TALISMAPS_PIN_CENTER_RATIO,
  TALISMAPS_PIN_LOGO_RATIO,
  TALISMAPS_PIN_RING_RATIO,
} from "@/lib/talismaps/pin";
import {
  TALISU_MKTS_DO_MORE_PIN_SIZE,
  TALISU_MKTS_TREE_LOGO,
} from "@/lib/talisu/markets-pins";

const TREE_LOGO = "/talisu/mkts/talispros-tree-logo.svg";

describe("Talismaps™ logo marker padding + border", () => {
  it("uses 50% logo fill (~25% diameter margin) and halves the black ring", () => {
    expect(TALISMAPS_PIN_LOGO_RATIO).toBe(0.5);
    expect(pinLogoInsetPercent()).toBe(25);
    expect(TALISMAPS_PIN_BORDER_WIDTH).toBe(0.5);
    // Ring thickness was 0.34 - 0.168 = 0.172; halved → 0.086
    expect(TALISMAPS_PIN_RING_RATIO - TALISMAPS_PIN_CENTER_RATIO).toBeCloseTo(
      0.086,
      5
    );
  });

  it("keeps the Modular Spaces tree logo ~29px inside a larger 58px body", () => {
    const visual = resolvePinVisual({
      pinSize: 58,
      whiteCenter: true,
      customLogoUrl: TREE_LOGO,
      pinBorderColor: "#000000",
      pinColor: "#FFFFFF",
    });
    expect(visual.bodySize).toBe(58);
    expect(pinLogoSizePx(visual.bodySize)).toBe(29);
    expect(visual.ringRadius).toBeCloseTo(58 * 0.34, 5);
    expect(visual.centerRadius).toBeCloseTo(58 * 0.254, 5);
  });

  it("renders the halved border width and centered logo inset in marker HTML", () => {
    const visual = resolvePinVisual({
      pinSize: 58,
      whiteCenter: true,
      customLogoUrl: TREE_LOGO,
      pinBorderColor: "#000000",
      pinColor: "#FFFFFF",
    });
    const svg = buildPinBodySvg(visual);
    expect(svg).toContain('stroke-width="0.5"');
    const { html, iconAnchor, iconSize } = renderPinMarkerHtml({
      pinSize: 58,
      whiteCenter: true,
      customLogoUrl: TREE_LOGO,
      pinBorderColor: "#000000",
      pinColor: "#FFFFFF",
    });
    expect(html).toContain("top:25%");
    expect(html).toContain("object-fit:contain");
    expect(html).not.toContain("object-fit:cover");
    expect(html).toContain("left:25%");
    expect(html).toContain("width:29px");
    expect(html).toContain("height:29px");
    expect(html).toContain(TREE_LOGO);
    // Anchor stays at the body center so the pin still points at the same spot.
    expect(iconAnchor[0]).toBe(iconSize[0] / 2);
    expect(iconAnchor[1]).toBe(29); // no badge/label → bodySize/2
  });

  it("grows preset bodies when a custom logo is present so logo px stay stable", () => {
    const plain = resolvePinVisual({ pinSize: "md", whiteCenter: true });
    const withLogo = resolvePinVisual({
      pinSize: "md",
      whiteCenter: true,
      customLogoUrl: "/assets/windswept-tree-logo.png",
    });
    expect(plain.bodySize).toBe(66);
    expect(withLogo.bodySize).toBe(Math.round(66 * (0.64 / 0.5)));
    expect(pinLogoSizePx(withLogo.bodySize)).toBe(pinLogoSizePx(Math.round(66 * 1.28)));
    // Absolute logo size ≈ legacy 0.64 * 66
    expect(pinLogoSizePx(withLogo.bodySize)).toBe(Math.round(66 * 0.64));
  });
});

describe("Talismaps™ tree logo asset", () => {
  it("is a tight vector of the navbar tree, with no baked padding", async () => {
    expect(TALISU_MKTS_TREE_LOGO).toBe(TREE_LOGO);
    const svg = readFileSync(resolve("public" + TREE_LOGO));
    expect(svg.toString()).toContain('viewBox="0 0 430 464"');
    const { data, info } = await sharp(svg, { density: 144 })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * channels;
        const alpha = data[i + 3] ?? 0;
        const lum = (data[i] ?? 0) + (data[i + 1] ?? 0) + (data[i + 2] ?? 0);
        if (alpha > 30 && lum < 540) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    expect(maxX).toBeGreaterThan(minX);
    expect((maxX - minX + 1) / width).toBeGreaterThan(0.95);
    expect((maxY - minY + 1) / height).toBeGreaterThan(0.95);
  });

  it("fills about 70–80% of the thin ring inner diameter on the Do More pin", () => {
    const body = TALISU_MKTS_DO_MORE_PIN_SIZE;
    const logo = pinLogoSizePx(body);
    const inner =
      2 * (body * TALISMAPS_PIN_RING_RATIO - TALISMAPS_PIN_BORDER_WIDTH / 2);
    const heightFill = logo / inner;
    // Navbar tree is 430×464; object-fit:contain letterboxes the width.
    const widthFill = heightFill * (430 / 464);
    expect(heightFill).toBeGreaterThanOrEqual(0.7);
    expect(heightFill).toBeLessThanOrEqual(0.8);
    expect(widthFill).toBeGreaterThan(0.65);
    expect(widthFill).toBeLessThanOrEqual(0.8);
    expect(TALISMAPS_PIN_BORDER_WIDTH).toBe(0.5);
  });
});

describe("Talismaps™ logo marker CSS", () => {
  it("uses object-fit contain with no circular crop on the logo img", async () => {
    const css = readFileSync(resolve("app/globals.css"), "utf8");
    const block = css.slice(
      css.indexOf(".talismaps-pin-logo"),
      css.indexOf(".talismaps-pin-label"),
    );
    expect(block).toContain("object-fit: contain");
    expect(block).not.toContain("object-fit: cover");
    expect(block).toContain("overflow: visible");
    expect(block).toMatch(/border-radius:\s*0/);
  });
});
