import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/dictionaries/en";
import { de } from "@/lib/i18n/dictionaries/de";
import { METAL_TAB } from "@/components/talisu/metal-tab";

const source = readFileSync(
  join(process.cwd(), "components/talisu/TalisUMarketsSidebar.tsx"),
  "utf8",
);
const tabsSource = readFileSync(
  join(process.cwd(), "components/talisu/RegisterStructureTabs.tsx"),
  "utf8",
);

describe("Markets sidebar card", () => {
  it("shows the market buttons above the PMC bullets, stacked full width", () => {
    const nav = source.indexOf('data-testid="mkts-site-links"');
    const bullets = source.indexOf("m.pmcBullets.map");
    expect(nav).toBeGreaterThan(source.indexOf("m.pmcTagline"));
    expect(nav).toBeLessThan(bullets);
    expect(source).toContain('className="mt-3 flex flex-col gap-2.5"');
    expect(METAL_TAB).toContain("w-full");
  });

  it("styles the market links as Aisha's metal structure tabs, Canada selected", () => {
    expect(tabsSource).toContain("isOpen ? METAL_TAB_SELECTED : METAL_TAB_UNSELECTED");
    expect(source).toContain("const MARKET_BUTTON_SELECTED = `${METAL_TAB} ${METAL_TAB_SELECTED}`");
    expect(source).toContain("const MARKET_BUTTON_UNSELECTED = `${METAL_TAB} ${METAL_TAB_UNSELECTED}`");
    expect(source).toMatch(
      /href=\{ROUTES\.TALISU_MARKETS\}\s*aria-current="page"\s*className=\{MARKET_BUTTON_SELECTED\}\s*style=\{\{ backgroundImage: ADVISER_METAL_BG \}\}\s*data-testid="mkts-link-canada"/,
    );
    expect(source).toMatch(
      /href=\{TALISWEBS_US_MARKETS_URL\}\s*className=\{MARKET_BUTTON_UNSELECTED\}\s*style=\{\{ backgroundImage: ADVISER_METAL_BG \}\}\s*data-testid="mkts-link-usa"/,
    );
    expect(source.match(/className=\{METAL_TAB_LABEL\}/g)).toHaveLength(2);
  });

  it("has no Do More button or section", () => {
    expect(source).not.toContain("mkts-link-do-more");
    expect(source).not.toContain("mkts-do-more");
    expect(source).not.toMatch(/doMore/);
    expect("doMoreLink" in en.markets).toBe(false);
    expect("doMoreLink" in de.markets).toBe(false);
  });
});
