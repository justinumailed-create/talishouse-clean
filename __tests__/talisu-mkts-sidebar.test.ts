import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/dictionaries/en";
import { de } from "@/lib/i18n/dictionaries/de";

const source = readFileSync(
  join(process.cwd(), "components/talisu/TalisUMarketsSidebar.tsx"),
  "utf8",
);

describe("Markets sidebar card", () => {
  it("shows the market buttons above the PMC bullets, stacked full width", () => {
    const nav = source.indexOf('data-testid="mkts-site-links"');
    const bullets = source.indexOf("m.pmcBullets.map");
    expect(nav).toBeGreaterThan(source.indexOf("m.pmcTagline"));
    expect(nav).toBeLessThan(bullets);
    expect(source).toContain('className="mt-3 flex flex-col gap-2"');
    expect(source).toMatch(/MARKET_BUTTON =\s*"inline-flex min-h-12 w-full/);
  });

  it("keeps Canada (primary) and USA (secondary) market links", () => {
    expect(source).toMatch(/className=\{MARKET_BUTTON_PRIMARY\}\s*data-testid="mkts-link-canada"/);
    expect(source).toMatch(/className=\{MARKET_BUTTON_SECONDARY\}\s*data-testid="mkts-link-usa"/);
  });

  it("has no Do More button or section", () => {
    expect(source).not.toContain("mkts-link-do-more");
    expect(source).not.toContain("mkts-do-more");
    expect(source).not.toMatch(/doMore/);
    expect("doMoreLink" in en.markets).toBe(false);
    expect("doMoreLink" in de.markets).toBe(false);
  });
});
