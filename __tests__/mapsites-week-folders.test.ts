import { describe, expect, it } from "vitest";
import { isoWeek, isoWeekKey, startOfIsoWeek, weekKeyFromAddedAt } from "../lib/talispros/iso-week";
import { matchesMapsitesFolderCode } from "../lib/talispros/mapsites-folder-code";

describe("Mapsites week calendar", () => {
  it("uses the ISO week that contains the date, starting Monday", () => {
    const saturday = new Date(2026, 10, 14);
    expect(isoWeek(saturday)).toEqual({ year: 2026, week: 46 });
    expect(startOfIsoWeek(saturday).getDay()).toBe(1);
    expect(startOfIsoWeek(saturday).getDate()).toBe(9);
    expect(isoWeekKey(saturday)).toBe("2026-W46");
    expect(weekKeyFromAddedAt("2026-11-14T15:00:00")).toBe("2026-W46");
    expect(weekKeyFromAddedAt(null)).toBeNull();
  });
});

describe("Mapsites folder access", () => {
  it("accepts only the configured code, with case intact", () => {
    const previous = process.env.MAPSITES_FOLDER_ACCESS_CODE;
    process.env.MAPSITES_FOLDER_ACCESS_CODE = "Exact-Case";
    expect(matchesMapsitesFolderCode("exact-case")).toBe(false);
    expect(matchesMapsitesFolderCode(" Exact-Case ")).toBe(true);
    expect(matchesMapsitesFolderCode("not-the-code")).toBe(false);
    if (previous === undefined) delete process.env.MAPSITES_FOLDER_ACCESS_CODE;
    else process.env.MAPSITES_FOLDER_ACCESS_CODE = previous;
  });
});
