import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROUTES } from "@/lib/routes";
import { mapsiteBackFromScheduleHref, mapsiteScheduleHref } from "@/lib/mapsite-layout";
import { TALISTV_LAUNCH_HEADLINE, TALISTV_LAUNCH_NOTICE } from "@/lib/talistv/guide-schedule";

/**
 * Mirrors MapSitePropertyPopup TEB™ href resolution.
 */
function resolveTebHref(site: {
  teb_url?: string | null;
  fast_code?: string | null;
}): string {
  const custom = site.teb_url?.trim() || "";
  const code = site.fast_code?.trim();
  if (custom && /^https?:\/\//i.test(custom)) return custom;
  if (code) {
    return `${ROUTES.TALISBOOKS}/fast/${encodeURIComponent(code.toLowerCase())}`;
  }
  if (custom.startsWith("/")) return custom;
  return ROUTES.TALISBOOKS;
}

describe("Mapsite™ TEB™ shelf href", () => {
  it("ignores a viewer URL in favor of the FAST-code bookshelf", () => {
    expect(
      resolveTebHref({
        fast_code: "rd02",
        teb_url: "/talisbooks/viewer/rd02-rd02-talisbook-sezg",
      }),
    ).toBe("/talisbooks/fast/rd02");
  });

  it("keeps absolute custom TEB overrides", () => {
    expect(
      resolveTebHref({
        fast_code: "lg01",
        teb_url: "https://example.com/custom-teb",
      })
    ).toBe("https://example.com/custom-teb");
  });

  it("falls back to the public bookshelf without FAST code", () => {
    expect(resolveTebHref({})).toBe("/talisbooks");
  });
});

describe("Mapsite™ TTV™ schedule href", () => {
  it("opens the FAST-code TV schedule, not a custom TTV override", () => {
    expect(mapsiteScheduleHref("rd02")).toBe("/talistv?fastCode=rd02");
  });

  it("returns to the demo Mapsite™ overlay from the schedule", () => {
    expect(mapsiteBackFromScheduleHref("demo-d697325b")).toBe(
      "/talispros/mapsite/listings/demo-d697325b",
    );
    expect(mapsiteBackFromScheduleHref("")).toBe("/talispros/mapsite");
  });
});

describe("TalisTV™ library return", () => {
  it("passes the FAST code so the bookshelf can return to Mapsite™", () => {
    const source = readFileSync(join(process.cwd(), "app/talistv/page.tsx"), "utf8");
    expect(source).toContain(
      "`${ROUTES.TALISBOOKS_LIBRARY}?from=${encodeURIComponent(fastCode.trim())}`",
    );
  });
});

describe("TalisTV™ launch notice", () => {
  it("tells the first 20 registrants they will be upgraded when launched", () => {
    expect(TALISTV_LAUNCH_HEADLINE).toBe("EARLY BIRD SPECIAL!");
    expect(TALISTV_LAUNCH_NOTICE).toBe(
      "The first 20 Talispros™ will receive our TTV ‘Text to Video’ functionality FREE OF CHARGE when we launch it in late 2026 or early 2027.",
    );
  });
});
