import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(resolve(p), "utf8");

describe("Back to Mapsite removed sitewide (blue navbar instead)", () => {
  it("full-screen Mapsite map mounts the blue navbar and fits the map below it", () => {
    const maps = read("components/mapsite/MapSiteTalisMaps.tsx");
    expect(maps).not.toContain("Back to Mapsite");
    expect(maps).not.toContain("backHref");
    expect(maps).toContain("<TalisUMktsHeader />");
    expect(maps).toContain("flex h-dvh w-screen flex-col overflow-hidden");
    // Map frame fills the remaining height under the navbar, isolated so map
    // panes / pin cards never sit over or under the navbar.
    expect(maps).toContain("relative isolate min-h-0 w-full flex-1 overflow-hidden");
    expect(maps.indexOf("<TalisUMktsHeader />")).toBeLessThan(
      maps.indexOf('data-testid="mapsite-window-map"'),
    );
    const page = read("app/mapsite/[slug]/map/page.tsx");
    expect(page).not.toContain("backHref");
    expect(page).not.toContain("mapsiteBackFromScheduleHref");
  });

  it("owner Ebook Editor pages get the blue navbar and no Back to Mapsite", () => {
    const layout = read("components/talispros/TalisprosLayoutClient.tsx");
    expect(layout).toContain("isOwnerEbookEditor");
    expect(layout).toContain("showBlueNav ? <TalisUMktsHeader />");
    expect(read("components/talispros/ebook-editor/OwnerEbookEditor.tsx")).not.toContain(
      "Back to Mapsite",
    );
    expect(read("app/talispros/mapsites/[fastCode]/ebooks/new/page.tsx")).not.toContain(
      "Back to Mapsite",
    );
  });

  it("has no EN/DE Back to Mapsite strings left", () => {
    expect(read("lib/i18n/dictionaries/en.ts")).not.toContain("Back to Mapsite");
    expect(read("lib/i18n/dictionaries/de.ts")).not.toContain("Zurück zur Mapsite");
  });
});
