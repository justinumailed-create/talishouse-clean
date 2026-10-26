import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";

const read = (p: string) => readFileSync(resolve(p), "utf8");

describe("Market Zone top strip (Mapsites)", () => {
  it("states the zone in kilometres only (EN + DE)", () => {
    expect(en.catalogueUi.mapsitesHeadline).toBe(
      "Every registered Market has a semi-exclusive protected Market Zone of 80 kilometres around a home pin",
    );
    expect(de.catalogueUi.mapsitesHeadline).toBe(
      "Jeder registrierte Markt hat eine semi-exklusive, geschützte Marktzone von 80 Kilometern um einen Home-PIN",
    );
    for (const s of [en.catalogueUi.mapsitesHeadline, de.catalogueUi.mapsitesHeadline]) {
      expect(s).not.toMatch(/mile|meile|kanada|canada/i);
    }
  });

  it("uses the same shared strip + typography class as the Catalogue strip", () => {
    const strip = read("components/talispros/TopStrip.tsx");
    expect(strip).toContain("talis-top-strip__text");
    expect(read("components/product-flipbook/TopBoundFlipbook.tsx")).toContain("<TopStrip");
    expect(read("components/talispros/WorkingPageShell.tsx")).toContain("<TopStrip");
    expect(read("components/talispros/demo-mapsite/DemoMapSiteBuilderClient.tsx")).toContain('headlineVariant="catalogue"');
    const css = read("app/globals.css");
    expect(css).toMatch(/\.talis-top-strip__text \{[^}]*font-weight: 600;[^}]*color: #262626;/);
    // The flipbook class no longer sets its own typography.
    const flip = read("components/product-flipbook/top-bound-flipbook.css");
    const rule = flip.slice(flip.indexOf(".product-flipbook__headline {"), flip.indexOf("}", flip.indexOf(".product-flipbook__headline {")));
    expect(rule).not.toMatch(/font-size|font-weight|color:/);
  });
});
