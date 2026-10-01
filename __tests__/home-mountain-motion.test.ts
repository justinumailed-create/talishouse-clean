import { describe, expect, it } from "vitest";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  HOME_OWNERSHIP_BANNER_TITLE,
  HOME_OWNERSHIP_BG_MP4,
  HOME_OWNERSHIP_BG_SRC,
} from "../lib/talispros/ownership-models";

describe("homepage mountain looping motion", () => {
  it("ships a muted looping MP4 under public/assets as the primary motion asset", () => {
    expect(HOME_OWNERSHIP_BG_SRC).toBe("/assets/home-ownership-bg.jpg");
    expect(HOME_OWNERSHIP_BG_MP4).toBe("/assets/home-ownership-bg.mp4");

    const mp4Path = resolve("public/assets/home-ownership-bg.mp4");
    expect(existsSync(mp4Path)).toBe(true);
    expect(statSync(mp4Path).size).toBeGreaterThan(100_000);
    expect(statSync(mp4Path).size).toBeLessThan(15 * 1024 * 1024);
    expect(statSync(resolve("public/assets/home-ownership-bg.jpg")).size).toBeGreaterThan(
      0,
    );
  });

  it("wires the MP4 video into the upper panel and the JPG for reduced motion", () => {
    const showcase = readFileSync(
      resolve("components/talispros/TalisprosHomeShowcase.tsx"),
      "utf8",
    );
    expect(showcase).toContain("HomeMountainMotion");
    expect(showcase).toContain("metallic");

    const motion = readFileSync(
      resolve("components/talispros/HomeMountainMotion.tsx"),
      "utf8",
    );
    expect(motion).toContain("HOME_OWNERSHIP_BG_MP4");
    expect(motion).toContain("<video");
    expect(motion).toContain("autoPlay");
    expect(motion).toContain("muted");
    expect(motion).toContain("loop");
    expect(motion).toContain("playsInline");
    expect(motion).toContain("object-cover");
    expect(motion).toContain("motion-reduce:hidden");
    expect(motion).toContain("HOME_OWNERSHIP_BG_SRC");
    expect(motion).toContain("motion-reduce:block");
  });

  it("overlays Industry Adjacent Fulfilment Options 101 on the mountain panel", () => {
    expect(HOME_OWNERSHIP_BANNER_TITLE).toBe(
      "Industry Adjacent Fulfilment Options 101",
    );
    const showcase = readFileSync(
      resolve("components/talispros/TalisprosHomeShowcase.tsx"),
      "utf8",
    );
    expect(showcase).toContain("HOME_OWNERSHIP_BANNER_TITLE");
    expect(showcase).toContain("pointer-events-none");
    expect(showcase).toContain("z-[1]");
  });
});
