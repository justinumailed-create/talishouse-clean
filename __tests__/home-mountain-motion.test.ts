import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  HOME_OWNERSHIP_BG_MP4,
  HOME_OWNERSHIP_BG_SRC,
  HOME_OWNERSHIP_BG_WEBM,
} from "../lib/talispros/ownership-models";

describe("homepage mountain looping motion", () => {
  it("ships WebM + MP4 beside the JPG poster", () => {
    expect(HOME_OWNERSHIP_BG_SRC).toBe("/assets/home-ownership-bg.jpg");
    expect(HOME_OWNERSHIP_BG_WEBM).toBe("/assets/home-ownership-bg.webm");
    expect(HOME_OWNERSHIP_BG_MP4).toBe("/assets/home-ownership-bg.mp4");
    expect(existsSync(resolve("public/assets/home-ownership-bg.webm"))).toBe(
      true,
    );
    expect(existsSync(resolve("public/assets/home-ownership-bg.mp4"))).toBe(
      true,
    );
    expect(existsSync(resolve("public/tmp-T-All-Final.pdf"))).toBe(true);
  });

  it("wires HomeMountainMotion into the upper showcase panel only", () => {
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
    expect(motion).toContain("HOME_OWNERSHIP_BG_WEBM");
    expect(motion).toContain("HOME_OWNERSHIP_BG_MP4");
    expect(motion).toContain("muted");
    expect(motion).toContain("loop");
  });
});
