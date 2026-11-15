import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  neighboringLeadWeek,
  openingWeekStart,
  preferredDay,
} from "../lib/talispros/canada-calendar";
import { canadaSourcedDay, weekKeyFromAddedAt } from "../lib/talispros/iso-week";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("sourced lead days", () => {
  it("keeps a 01:00 UTC lead on the Canada evening, not the next morning in Calcutta", () => {
    expect(canadaSourcedDay("2026-11-14T01:20:00.000Z")).toBe("2026-11-13");
    expect(weekKeyFromAddedAt("2026-11-14T01:20:00.000Z")).toBe("2026-W46");
    expect(weekKeyFromAddedAt("2026-11-09T01:20:00.000Z")).toBe("2026-W45");
    expect(canadaSourcedDay(null)).toBeNull();
    expect(weekKeyFromAddedAt("not-a-date")).toBeNull();
  });

  it("opens the current week when that week has leads", () => {
    const start = openingWeekStart(["2026-11-05", "2026-11-13"], new Date(2026, 10, 14));
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(10);
    expect(start.getDate()).toBe(9);
  });

  it("opens the latest week that has leads when the current week is empty", () => {
    const start = openingWeekStart(["2026-11-05"], new Date(2026, 10, 20));
    expect(start.getMonth()).toBe(10);
    expect(start.getDate()).toBe(2);
  });

  it("skips weeks that have no sourced leads", () => {
    const days = ["2026-11-05", "2026-11-13"];
    const current = openingWeekStart(days, new Date(2026, 10, 14));
    const previous = neighboringLeadWeek(current, -1, days);
    expect(previous?.getDate()).toBe(2);
    expect(neighboringLeadWeek(current, 1, days)).toBeNull();
    expect(neighboringLeadWeek(previous!, -1, days)).toBeNull();
  });

  it("selects the latest day in the week that has leads when today has none", () => {
    const week = openingWeekStart(["2026-11-13"], new Date(2026, 10, 14));
    const day = preferredDay(week, ["2026-11-09", "2026-11-13"], new Date(2026, 10, 14));
    expect(day.getDate()).toBe(13);
  });

  it("shows the Open button, submits on Enter, and lets the rail scroll", () => {
    const panel = read("components/talispros/demo-mapsite/FastCodeSlotsPanel.tsx");
    const css = read("app/globals.css");
    expect(panel).toContain('data-testid="mapsites-folder-open"');
    expect(panel).toContain('event.key !== "Enter"');
    expect(panel).toContain("requestSubmit()");
    expect(panel).not.toContain("disabled={folderPending || !folderCode.trim()}");
    expect(css).toContain(".demo-hero__rail");
    expect(css).toMatch(/\.demo-hero__rail\s*\{[^}]*overflow:\s*hidden/);
    expect(panel).toContain("overflow-y-auto");
  });
});
