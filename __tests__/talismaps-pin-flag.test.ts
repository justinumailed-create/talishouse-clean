import { describe, expect, it } from "vitest";
import { buildPinBodySvg, pinVisualCacheKey } from "@/lib/talismaps/pin";

describe("TalisMaps flag pin style", () => {
  it("renders a large white icon on a solid color body when whiteCenter is false", () => {
    const svg = buildPinBodySvg({
      pinColor: "#1A73E8",
      pinBorderColor: "#ffffff",
      pinIcon: "flag",
      whiteCenter: false,
      pinSize: 66,
      pinLabel: null,
      pinAnimation: "none",
      selectedState: false,
      categoryBadge: null,
      customLogoUrl: null,
      bodySize: 66,
      ringRadius: 22.44,
      centerRadius: 11.088,
      iconScale: 0.55,
    });

    expect(svg).toContain('fill="#1A73E8"');
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain("M12 21.5 V10");
    expect(svg).not.toContain('r="11.088"');
  });

  it("includes whiteCenter in the visual cache key", () => {
    const classic = pinVisualCacheKey({
      pinColor: "#1A73E8",
      pinIcon: "flag",
      whiteCenter: true,
    });
    const flag = pinVisualCacheKey({
      pinColor: "#1A73E8",
      pinIcon: "flag",
      whiteCenter: false,
    });

    expect(classic).not.toBe(flag);
  });
});
