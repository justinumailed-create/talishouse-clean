import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/dictionaries/en";
import { de } from "@/lib/i18n/dictionaries/de";
import { ROUTES } from "@/lib/routes";
import { TALISU_MKTS_PINS, TALISU_MKTS_FLAG_CA } from "@/lib/talisu/markets-pins";
import {
  TALISU_US_MARKETS,
  TALISU_US_MKTS_FLAG,
  TALISU_US_MKTS_PINS,
  localizeTalisUUsMktsPins,
  talisuUsMktsToEnginePins,
} from "@/lib/talisu/us-markets-pins";
import pages from "@/lib/seo/pages.json";

const read = (p: string) => readFileSync(resolve(p), "utf8");

describe("USA Markets (/talisu/mkts/usa): native page, no Taliswebs redirect", () => {
  it("is a Tsplits™ route gated exactly like Canada Markets", () => {
    expect(ROUTES.TALISU_US_MARKETS).toBe("/talisu/mkts/usa");
    const page = read("app/talisu/mkts/usa/page.tsx");
    expect(page).toContain('export const dynamic = "force-dynamic"');
    expect(page).toContain("<MarketsMapOrGate region=\"us\" />");
    expect(read("components/talisu/MarketsMapOrGate.tsx")).toContain("await getAdminSessionAccount()");
    expect(page).not.toContain('redirect("/")');
    expect(page).toContain("index: false");
    expect(page).toContain('pageMetadata("/talisu/mkts/usa")');
    expect(page.toLowerCase()).not.toContain("taliswebs.com");
  });

  it("links the sidebar and header to the internal route, never Taliswebs", () => {
    for (const p of [
      "components/talisu/TalisUMarketsSidebar.tsx",
      "components/talisu/TalisUMarketsMapApp.tsx",
      "lib/talisu/talisu-links.ts",
    ]) {
      const src = read(p);
      expect(src).not.toMatch(/TALISWEBS_US_MARKETS|taliswebs-us\.vercel\.app|taliswebs\.com/);
    }
  });

  it("has the 30 US markets with US-flag pins, Canada pins unchanged", () => {
    expect(TALISU_US_MARKETS).toHaveLength(30);
    expect(TALISU_US_MARKETS.map((m) => m.code)).toEqual(
      Array.from({ length: 30 }, (_, i) => `M${String(i + 1).padStart(2, "0")}`),
    );
    expect(existsSync(resolve("public", TALISU_US_MKTS_FLAG.slice(1)))).toBe(true);
    const engine = talisuUsMktsToEnginePins();
    const markets = engine.filter((p) => p.metadata?.customLogoUrl === TALISU_US_MKTS_FLAG);
    expect(markets).toHaveLength(30);
    expect(TALISU_MKTS_PINS.some((p) => p.kind === "market")).toBe(true);
    expect(read("lib/talisu/markets-pins.ts")).toContain(TALISU_MKTS_FLAG_CA);
  });

  it("localizes the cards in EN/DE without any price (CAD-only site)", () => {
    for (const dict of [en, de]) {
      const pins = localizeTalisUUsMktsPins(TALISU_US_MKTS_PINS, dict.markets);
      for (const pin of pins) {
        expect(pin.description).not.toMatch(/\$|USD|TODO|lorem/i);
        expect(pin.description).not.toContain("Mapsite™");
        expect(pin.description.length).toBeGreaterThan(20);
      }
      expect(dict.markets.us.footer).not.toMatch(/\$|USD/);
    }
    const de1 = localizeTalisUUsMktsPins(TALISU_US_MKTS_PINS, de.markets)[0];
    expect(de1.description).toContain("8,5 Millionen");
  });

  it("has EN/DE SEO + OG cards", () => {
    const entry = (
      pages as unknown as {
        pages: Record<string, { image: string; en: { title: string }; de: { title: string } }>;
      }
    ).pages["/talisu/mkts/usa"];
    expect(entry.en.title).toContain("USA Markets");
    expect(entry.de.title).toContain("Märkte USA");
    for (const lang of ["en", "de"]) {
      expect(existsSync(resolve("public", `${entry.image.slice(1)}-${lang}.jpg`))).toBe(true);
    }
  });
});
