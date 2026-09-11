import { describe, expect, it } from "vitest";
import {
  allowMapGestures,
  shouldAutoFitPinsOnMount,
} from "../lib/talismaps/map-engine/mount-flags";

describe("map engine mount flags", () => {
  it("keeps pan/zoom enabled by default", () => {
    expect(allowMapGestures(undefined)).toBe(true);
    expect(allowMapGestures(true)).toBe(true);
    expect(allowMapGestures(false)).toBe(false);
  });

  it("skips auto fit-to-pins when the published viewport must stay at build zoom", () => {
    expect(shouldAutoFitPinsOnMount({})).toBe(true);
    expect(shouldAutoFitPinsOnMount({ preserveViewport: true })).toBe(false);
    expect(shouldAutoFitPinsOnMount({ interactive: false })).toBe(false);
    expect(
      shouldAutoFitPinsOnMount({ preserveViewport: true, interactive: true }),
    ).toBe(false);
  });
});
