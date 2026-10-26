import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  TALISU_MKTS_HEADER_DROPDOWN,
  TALISU_MKTS_HEADER_DROPDOWN_DIVIDER_AFTER,
} from "@/lib/talisu/markets-pins";
import { TSPLITS_DE, TSPLITS_EN, TSPLITS_PATH } from "@/lib/talisu/tsplits-content";

const pageSrc = () => readFileSync(resolve("app/talisu/tsplits/page.tsx"), "utf8");
const flat = (v: unknown): string => JSON.stringify(v);

describe("TSPLITS™ page (/talisu/tsplits)", () => {
  it("is item one in the TalisU dropdown, above Bookshelf / FAQ / Media Directory and the divider", () => {
    const labels = TALISU_MKTS_HEADER_DROPDOWN.map((i) => i.label as string);
    expect(labels[0]).toBe("TSPLITS™");
    expect(TALISU_MKTS_HEADER_DROPDOWN[0]?.href).toBe(TSPLITS_PATH);
    expect(TSPLITS_PATH).toBe("/talisu/tsplits");
    expect(labels.indexOf("TSPLITS™")).toBeLessThan(labels.indexOf(TALISU_MKTS_HEADER_DROPDOWN_DIVIDER_AFTER));
    expect(labels.slice(1)).toEqual(["Bookshelf", "FAQ", "Media Directory", "Contract", "Knowledge Base"]);
    const header = readFileSync(resolve("components/talisu/TalisUMktsHeader.tsx"), "utf8");
    expect(header).toContain('case "TSPLITS™":');
    expect(header).toContain("t.nav.talisuMenu.tsplits");
    expect(getDictionary("en").nav.talisuMenu.tsplits).toBe("TSPLITS™");
    expect(getDictionary("de").nav.talisuMenu.tsplits).toBe("TSPLITS™");
  });

  it("is a registered page with EN/DE SEO metadata", () => {
    expect(existsSync(resolve("app/talisu/tsplits/page.tsx"))).toBe(true);
    expect(pageSrc()).toContain('pageMetadata("/talisu/tsplits")');
    const seo = JSON.parse(readFileSync(resolve("lib/seo/pages.json"), "utf8")) as {
      pages: Record<string, unknown>;
    };
    const entry = flat(seo.pages["/talisu/tsplits"]);
    expect(entry).toContain("TSPLITS™");
    expect(entry).toContain("\"image\":\"/og/pages/talisu-tsplits\"");
    expect(existsSync(resolve("public/og/pages/talisu-tsplits-en.jpg"))).toBe(true);
    expect(existsSync(resolve("public/og/pages/talisu-tsplits-de.jpg"))).toBe(true);
  });

  it("keeps the PDF's order: approach, quote, 4 structures, sections 1–10 with Ancillary Benefits", () => {
    expect(TSPLITS_EN.title).toBe("TSPLITS™ – from Vision to Implementation");
    expect(TSPLITS_EN.structures.rows.map((r) => r.id)).toEqual([
      "conventional",
      "lease-to-own",
      "fractionalization",
      "tokenization",
    ]);
    expect(TSPLITS_EN.sections.map((s) => s.number ?? s.id)).toEqual([
      "1", "2", "3", "4", "5", "ancillary-benefits", "6", "7", "8", "9", "10",
    ]);
    expect(TSPLITS_DE.sections.map((s) => s.id)).toEqual(TSPLITS_EN.sections.map((s) => s.id));
    expect(TSPLITS_EN.quote.name).toContain("Webster M.");
  });

  it("prices in CAD only and drops the PDF's dev artefacts", () => {
    for (const c of [TSPLITS_EN, TSPLITS_DE]) {
      const s = flat(c);
      expect(s).not.toMatch(/USD|US\$/);
      // every dollar amount carries CAD
      for (const m of s.match(/\$[\d,.]+/g) ?? []) expect(s).toContain(`${m} CAD`);
      expect(s).not.toMatch(/\[\s*fill/i);
      expect(s).not.toMatch(/\bTODO\b|\bTBD\b|placeholder/i);
      expect(s).not.toContain("tsplits.com");
      expect(s).not.toContain("FEATURE-BENEFIT");
      expect(s).not.toMatch(/Page \d of 4|Seite \d von 4/);
      expect(s).not.toMatch(/Mapsites?™/);
      expect(s).toContain("TalisBOT™");
    }
    const en = flat(TSPLITS_EN);
    expect(en).toContain("$1,000 CAD");
    expect(en).toContain("$200 CAD");
    expect(en).toContain("$100 CAD");
    expect(en).toContain("$7 CAD weekly");
    expect(en).toContain("45 markets in the USA and Canada");
    const de = flat(TSPLITS_DE);
    expect(de).toContain("1.000 CAD");
    expect(de).toContain("7 CAD");
  });

  it("renders the fill-in-the-blank as styled reader prompts, in EN and DE", () => {
    const en = flat(TSPLITS_EN);
    const de = flat(TSPLITS_DE);
    expect(en).toContain("{{your favourite destination}}");
    expect(de).toContain("{{Ihr Lieblingsreiseziel}}");
    const rich = readFileSync(resolve("components/talisu/TsplitsRichText.tsx"), "utf8");
    expect(rich).toContain('data-testid="tsplits-reader-prompt"');
    expect(rich).toContain("italic");
  });

  it("closes with the TalisBOT “Share a Project Vision” form CTA and Webster M.’s sign-off", () => {
    const src = pageSrc();
    expect(src).toContain("talisuHref(TALISU_DISCUSS_PATH)");
    expect(src).toContain('data-testid="tsplits-cta-button"');
    expect(TSPLITS_EN.cta.button).toBe("Share a Project Vision");
    expect(TSPLITS_EN.cta.signoff).toBe("Webster M. · Projects Analyst");
    expect(TSPLITS_DE.cta.button).toBe(getDictionary("de").tsplits.cta.button);
  });
});
