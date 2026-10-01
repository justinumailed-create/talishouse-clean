import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  TALIS_BRAND_FLIP_CYCLE_MS,
  TALIS_BRAND_FLIP_TALISPROS_MS,
  TALIS_BRAND_FLIP_TALISU_MS,
  talisBrandForCycleElapsed,
} from "../components/talisu/TalisBrandFlip";

describe("Talispros™ / TalisU™ brand flip", () => {
  it("weights Talispros™ ~75% of the cycle", () => {
    expect(TALIS_BRAND_FLIP_TALISPROS_MS).toBe(6000);
    expect(TALIS_BRAND_FLIP_TALISU_MS).toBe(2000);
    expect(TALIS_BRAND_FLIP_CYCLE_MS).toBe(8000);
    expect(TALIS_BRAND_FLIP_TALISPROS_MS / TALIS_BRAND_FLIP_CYCLE_MS).toBe(0.75);
    expect(talisBrandForCycleElapsed(0)).toBe("talispros");
    expect(talisBrandForCycleElapsed(5999)).toBe("talispros");
    expect(talisBrandForCycleElapsed(6000)).toBe("talisu");
    expect(talisBrandForCycleElapsed(7999)).toBe("talisu");
    expect(talisBrandForCycleElapsed(8000)).toBe("talispros");
  });

  it("wires flip into blue TalisUMktsHeader", () => {
    const header = readFileSync(
      resolve("components/talisu/TalisUMktsHeader.tsx"),
      "utf8",
    );
    expect(header).toContain("TalisBrandFlip");
    expect(header).toContain("TALISU_MKTS_HEADER_TAGLINE");
  });
});
