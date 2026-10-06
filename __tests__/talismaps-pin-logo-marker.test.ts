import { describe, expect, it } from "vitest";
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
      customLogoUrl: "/talisu/mkts/atlist-talisu-tree-pin.png",
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
      customLogoUrl: "/talisu/mkts/atlist-talisu-tree-pin.png",
      pinBorderColor: "#000000",
      pinColor: "#FFFFFF",
    });
    const svg = buildPinBodySvg(visual);
    expect(svg).toContain('stroke-width="0.5"');
    const { html, iconAnchor, iconSize } = renderPinMarkerHtml({
      pinSize: 58,
      whiteCenter: true,
      customLogoUrl: "/talisu/mkts/atlist-talisu-tree-pin.png",
      pinBorderColor: "#000000",
      pinColor: "#FFFFFF",
    });
    expect(html).toContain("top:25%");
    expect(html).toContain("left:25%");
    expect(html).toContain("width:29px");
    expect(html).toContain("height:29px");
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
