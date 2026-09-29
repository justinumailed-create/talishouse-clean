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

  it("returns to that FAST code’s listings Mapsite™ from the schedule", () => {
    expect(mapsiteBackFromScheduleHref("lg01")).toBe(
      "/talispros/mapsite/listings/lg01",
    );
    expect(mapsiteBackFromScheduleHref("RM22")).toBe(
      "/talispros/mapsite/listings/rm22",
    );
    expect(mapsiteBackFromScheduleHref("demo-d697325b")).toBe(
      "/talispros/mapsite/listings/demo-d697325b",
    );
    expect(mapsiteBackFromScheduleHref("")).toBe("/talispros/mapsite");
    expect(mapsiteBackFromScheduleHref("demo")).toBe("/talispros/mapsite");
  });
});

describe("Mapsite™ pin resource buttons", () => {
  it("enables URL and MLS® only when Build form or Admin saved a link; gold only on TTV™", () => {
    const popup = readFileSync(
      join(process.cwd(), "components/talispros/mapsite/MapSitePropertyPopup.tsx"),
      "utf8",
    );
    expect(popup).toContain("listingResourceHref(site.mls_url)");
    expect(popup).toContain("mapsiteHasGatedUrl(site.broker_url)");
    expect(popup).not.toContain("listingResourceHref(site.broker_url)");
    expect(popup).toContain("listingResourceHref(site.mls_url)");
    expect(popup).not.toContain("listingSearchHref");
    expect(popup).not.toContain("google.com/search");
    expect(popup).not.toContain("realtor.ca/map");
    expect(popup).toContain('variant: "blue"');
    expect(popup).toContain('variant: "gold"');
    expect(popup).not.toContain("resource.key === \"ttv\"");
    expect(popup).toContain("href={resource.resolveHref(mapsite)}");

    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
    expect(css).toContain(".mapsite-paypal-btn--gold");
    expect(css).not.toContain(".mapsite-paypal-btn:nth-child(even)");
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


describe("Paid Mapsite™ TEB™ unlocks ebook admin", () => {
  it("FAST TEB shelf reuses canEditMapSite for owner/admin Manage + Edit book chrome", () => {
    const page = readFileSync(
      join(process.cwd(), "app/talisbooks/fast/[fastCode]/page.tsx"),
      "utf8",
    );
    expect(page).toContain("canEditMapSite");
    expect(page).toContain("getTalisBooksBookshelf");
    expect(page).toContain("getPublicTalisBooksBookshelf");
    expect(page).toContain("canManageEbook");
    expect(page).toContain("Manage ebook");
    expect(page).toContain("Edit book");
    expect(page).toContain("/edit#ebook-editor");
    // Public visitors keep the read-only public shelf.
    expect(page).toMatch(/canManageEbook[\s\S]*getTalisBooksBookshelf[\s\S]*getPublicTalisBooksBookshelf/);
  });

  it("viewer Live Edit sidebar unlocks for paid owner/admin canEditTools", () => {
    const shell = readFileSync(
      join(process.cwd(), "components/talisbooks/viewer/TalisBooksViewerShell.tsx"),
      "utf8",
    );
    const viewerPage = readFileSync(
      join(process.cwd(), "app/talisbooks/viewer/[slug]/page.tsx"),
      "utf8",
    );
    expect(shell).toContain("const showViewerSidebar = Boolean(canEditTools)");
    expect(shell).not.toContain("const showViewerSidebar = false");
    expect(viewerPage).toContain("canEditMapSite");
    expect(viewerPage).toContain("canLiveEdit");
    expect(viewerPage).toContain("canEditTools={canEditTools}");
    expect(viewerPage).toContain("canLiveEdit={canLiveEdit}");
  });

  it("pin TEB™ still resolves to the FAST-code shelf for every Mapsite™ class", () => {
    expect(
      resolveTebHref({
        fast_code: "rm22",
        teb_url: "/talisbooks/viewer/rm22-some-book",
      }),
    ).toBe("/talisbooks/fast/rm22");
    expect(
      resolveTebHref({
        fast_code: "lg01",
        teb_url: null,
      }),
    ).toBe("/talisbooks/fast/lg01");
  });
});
