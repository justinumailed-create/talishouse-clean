import { describe, expect, it } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  HOME_OWNERSHIP_BG_GIF,
  HOME_OWNERSHIP_BG_SRC,
} from "../lib/talispros/ownership-models";

describe("homepage mountain looping motion", () => {
  it("ships a looping GIF under 3MB as the primary motion asset", () => {
    expect(HOME_OWNERSHIP_BG_SRC).toBe("/assets/home-ownership-bg.jpg");
    expect(HOME_OWNERSHIP_BG_GIF).toBe("/assets/home-ownership-bg.gif");

    const gifPath = resolve("public/assets/home-ownership-bg.gif");
    const gif = readFileSync(gifPath);
    expect(gif.subarray(0, 6).toString("ascii")).toBe("GIF89a");
    expect(gif.includes(Buffer.from("NETSCAPE2.0"))).toBe(true);
    expect(statSync(gifPath).size).toBeGreaterThan(200_000);
    expect(statSync(gifPath).size).toBeLessThan(3 * 1024 * 1024);
    expect(statSync(resolve("public/assets/home-ownership-bg.jpg")).size).toBeGreaterThan(
      0,
    );
  });

  it("wires the GIF into the upper panel and the JPG for reduced motion", () => {
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
    expect(motion.indexOf("HOME_OWNERSHIP_BG_GIF")).toBeLessThan(
      motion.indexOf("HOME_OWNERSHIP_BG_SRC"),
    );
    expect(motion).toContain("unoptimized");
    expect(motion).toContain("motion-reduce:hidden");
    expect(motion).toContain("motion-reduce:block");
    expect(motion).not.toContain("<video");
    expect(motion).not.toContain("HOME_OWNERSHIP_BG_WEBM");
    expect(motion).not.toContain("HOME_OWNERSHIP_BG_MP4");
  });
});
