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
    return `${ROUTES.TALISBOOKS}/fast/${encodeURIComponent(code.toLowerCase())}`;
  }
  if (custom.startsWith("/")) return custom;
  return ROUTES.TALISBOOKS;
}

describe("Mapsite™ TEB™ shelf href", () => {
  it("scopes library to FAST code by default", () => {
    expect(resolveTebHref({ fast_code: "lg01" })).toBe(
      "/talisbooks/fast/lg01"
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

  it("falls back to the public bookshelf without FAST code", () => {
    expect(resolveTebHref({})).toBe("/talisbooks");
  });
});
