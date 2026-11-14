import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildPageMetadata } from "../lib/seo/page-seo";
import { indexablePageRoutes } from "../lib/seo/indexable-routes";
import { en } from "../lib/i18n/dictionaries/en";
import { RALF_TERMS } from "../content/legal/ralf-terms";
import { RALF_PRIVACY } from "../content/legal/ralf-privacy";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("Ralf legal pages stay out of search results", () => {
  it("marks /terms and /privacy noindex in metadata and the response header", () => {
    for (const route of ["/terms", "/privacy"] as const) {
      const robots = buildPageMetadata(route, "en").robots as { index: boolean; follow: boolean };
      expect(robots.index).toBe(false);
      expect(robots.follow).toBe(false);
      const de = buildPageMetadata(route, "de").robots as { index: boolean };
      expect(de.index).toBe(false);
    }
    const config = read("next.config.ts");
    expect(config).toContain('source: "/terms"');
    expect(config).toContain('source: "/privacy"');
    expect(config).toContain('key: "X-Robots-Tag", value: "noindex, nofollow"');
  });

  it("leaves both pages out of the indexable sitemap routes", () => {
    const routes = indexablePageRoutes();
    expect(routes).not.toContain("/terms");
    expect(routes).not.toContain("/privacy");
  });

  it("prints from a Print Me button and keeps the source wording", () => {
    expect(en.legal.printMe).toBe("Print Me");
    expect(read("components/legal/PrintMeButton.tsx")).toContain("window.print()");
    expect(read("app/globals.css")).toContain(".legal-print-hide");
    const terms = JSON.stringify(RALF_TERMS);
    const privacy = JSON.stringify(RALF_PRIVACY);
    expect(terms).toContain("November16th, 2026");
    expect(terms).toContain("TSPLITS Inc..");
    expect(privacy).toContain("Effective Date: October 2026");
    expect(privacy).toContain("on its servers");
    expect(privacy).toContain("Personally Identifiable Information");
    expect(terms).not.toMatch(/talispros|taliswebs/i);
    expect(privacy).not.toMatch(/talispros|taliswebs/i);
  });
});
