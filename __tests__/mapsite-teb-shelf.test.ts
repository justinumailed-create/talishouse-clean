import { describe, expect, it } from "vitest";
import { ROUTES } from "@/lib/routes";

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
    return `${ROUTES.TALISBOOKS_LIBRARY}?fastCode=${encodeURIComponent(code)}`;
  }
  if (custom.startsWith("/")) return custom;
  return ROUTES.TALISBOOKS_LIBRARY;
}

describe("Mapsite™ TEB™ shelf href", () => {
  it("scopes library to FAST code by default", () => {
    expect(resolveTebHref({ fast_code: "lg01" })).toBe(
      "/talisbooks/library?fastCode=lg01"
    );
  });

  it("keeps absolute custom TEB overrides", () => {
    expect(
      resolveTebHref({
        fast_code: "lg01",
        teb_url: "https://example.com/custom-teb",
      })
    ).toBe("https://example.com/custom-teb");
  });

  it("falls back to full library without FAST code", () => {
    expect(resolveTebHref({})).toBe("/talisbooks/library");
  });
});
