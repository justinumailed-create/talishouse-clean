import { describe, expect, it } from "vitest";
import { ROUTES } from "@/lib/routes";
import { mapsiteScheduleHref } from "@/lib/mapsite-layout";
import { TALISTV_LAUNCH_NOTICE } from "@/lib/talistv/guide-schedule";

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
});

describe("TalisTV™ launch notice", () => {
  it("tells the first 20 registrants they will be upgraded when launched", () => {
    expect(TALISTV_LAUNCH_NOTICE).toBe(
      "First 20 registrants will be upgraded free of charge when launched..!",
    );
  });
});
