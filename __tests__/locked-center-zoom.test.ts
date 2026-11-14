import { describe, expect, it } from "vitest";
import { zoomToApplyWhileCenterLocked } from "@/lib/talismaps/map-engine/locked-center-zoom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("zoom while the Mapsite pin is locked", () => {
  it("steps the zoom and ignores a reading that is already on that step", () => {
    expect(zoomToApplyWhileCenterLocked(10, 11)).toBe(11);
    expect(zoomToApplyWhileCenterLocked(11, 10)).toBe(10);
    expect(zoomToApplyWhileCenterLocked(10, 10)).toBeNull();
    expect(zoomToApplyWhileCenterLocked(10, 10.01)).toBeNull();
  });

  it("sends that zoom to the map even when the center is locked", () => {
    const canvas = readFileSync(
      resolve("components/talismaps/map-engine/MapEngineCanvas.tsx"),
      "utf8",
    );
    expect(canvas).toContain("zoomToApplyWhileCenterLocked");
    expect(canvas).not.toContain("if (lockCenter || !interactive) return");
  });
});
