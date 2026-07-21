import { describe, expect, it } from "vitest";
import {
  clampViewerIntervalMs,
  convertViewerNavIndex,
  createEmptyNarrationController,
  getNarrationCueForPage,
  intervalMsToSpeedPercent,
  nextPageIndex,
  previousPageIndex,
  resolveViewerIntervalMs,
  shouldAutoAdvance,
  speedPercentToIntervalMs,
  TALISBOOKS_VIEWER_SPEED_DEFAULT_MS,
  TALISBOOKS_VIEWER_SPEED_MAX_MS,
  TALISBOOKS_VIEWER_SPEED_MIN_MS,
} from "../lib/talisbooks/viewer";

describe("TalisBooks viewer auto page-turn helpers", () => {
  it("clamps interval within supported speed bounds", () => {
    expect(clampViewerIntervalMs(100)).toBe(TALISBOOKS_VIEWER_SPEED_MIN_MS);
    expect(clampViewerIntervalMs(99999)).toBe(TALISBOOKS_VIEWER_SPEED_MAX_MS);
    expect(clampViewerIntervalMs(Number.NaN)).toBe(TALISBOOKS_VIEWER_SPEED_DEFAULT_MS);
  });

  it("resolves preset and custom intervals", () => {
    expect(resolveViewerIntervalMs("fast")).toBe(2800);
    expect(resolveViewerIntervalMs("slow")).toBe(8000);
    expect(resolveViewerIntervalMs(null, 5000)).toBe(5000);
  });

  it("only auto-advances when playing, not hovered, and multi-page", () => {
    expect(
      shouldAutoAdvance({ autoPlaying: true, pausedByHover: false, pageCount: 4 }),
    ).toBe(true);
    expect(
      shouldAutoAdvance({ autoPlaying: true, pausedByHover: true, pageCount: 4 }),
    ).toBe(false);
    expect(
      shouldAutoAdvance({ autoPlaying: false, pausedByHover: false, pageCount: 4 }),
    ).toBe(false);
    expect(
      shouldAutoAdvance({ autoPlaying: true, pausedByHover: false, pageCount: 1 }),
    ).toBe(false);
  });

  it("wraps page indexes for forward and backward navigation", () => {
    expect(nextPageIndex(0, 3)).toBe(1);
    expect(nextPageIndex(2, 3)).toBe(0);
    expect(previousPageIndex(0, 3)).toBe(2);
    expect(previousPageIndex(1, 3)).toBe(0);
  });

  it("maps speed percent inversely to interval", () => {
    const slow = speedPercentToIntervalMs(0);
    const fast = speedPercentToIntervalMs(100);
    expect(slow).toBeGreaterThan(fast);
    expect(intervalMsToSpeedPercent(slow)).toBe(0);
    expect(intervalMsToSpeedPercent(fast)).toBe(100);
  });
});

describe("TalisBooks viewer view-mode navigation", () => {
  it("converts spread indexes to primary page indexes", () => {
    expect(convertViewerNavIndex("spread", "single", 0, 10)).toBe(0);
    expect(convertViewerNavIndex("spread", "single", 1, 10)).toBe(1);
    expect(convertViewerNavIndex("spread", "single", 4, 10)).toBe(7);
  });

  it("converts page indexes back to spread indexes", () => {
    expect(convertViewerNavIndex("single", "spread", 0, 10)).toBe(0);
    expect(convertViewerNavIndex("single", "spread", 1, 10)).toBe(1);
    expect(convertViewerNavIndex("single", "spread", 7, 10)).toBe(4);
  });

  it("keeps index when mode is unchanged", () => {
    expect(convertViewerNavIndex("single", "single", 3, 10)).toBe(3);
    expect(convertViewerNavIndex("spread", "spread", 2, 10)).toBe(2);
  });
});

describe("TalisBooks viewer narration stubs", () => {
  it("starts with narration disabled and no track", () => {
    const controller = createEmptyNarrationController();
    expect(controller.enabled).toBe(false);
    expect(controller.track).toBeNull();
    expect(controller.syncWithAutoTurn).toBe(false);
  });

  it("looks up cues by page without requiring audio integration", () => {
    const cue = getNarrationCueForPage(
      {
        id: "track-1",
        label: "EN",
        locale: "en-CA",
        cues: [{ pageNumber: 2, text: "Meet your agent" }],
      },
      2,
    );
    expect(cue?.text).toBe("Meet your agent");
    expect(getNarrationCueForPage(null, 1)).toBeNull();
  });
});
