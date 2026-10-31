import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/dictionaries/en";
import { de } from "@/lib/i18n/dictionaries/de";
import pages from "@/lib/seo/pages.json";
import {
  TALISU_MKTS_HEADER_DROPDOWN,
  TALISU_MKTS_HEADER_DROPDOWN_DIVIDER_AFTER,
} from "@/lib/talisu/markets-pins";
import { TALISPROS_HOME_SYSTEM_DEMO_HREF } from "@/lib/talispros/start-content";

const root = join(__dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("TalisU Value-Added (Webster) page", () => {
  it("is a public TalisU dropdown row above the divider", () => {
    const labels = TALISU_MKTS_HEADER_DROPDOWN.map((i) => i.label);
    const i = labels.indexOf("Value-Added");
    expect(i).toBeGreaterThan(-1);
    expect(TALISU_MKTS_HEADER_DROPDOWN[i].href).toBe("/talisu/value-added");
    expect(i).toBeLessThan(labels.indexOf(TALISU_MKTS_HEADER_DROPDOWN_DIVIDER_AFTER));
    expect(en.nav.talisuMenu.valueAdded).toBe("Value-Added");
    expect(de.nav.talisuMenu.valueAdded).toBe("Mehrwert");
  });

  it("is native: no redirect or link to the Taliswebs adviser page", () => {
    const page = read("app/talisu/value-added/page.tsx");
    expect(page).not.toMatch(/redirect|taliswebs/i);
    expect(page).toContain("/talisu/webster-banker-v3.jpg");
    expect(TALISPROS_HOME_SYSTEM_DEMO_HREF).not.toMatch(/taliswebs|adviser/i);
  });

  it("uses Canada / CAD and Tsplits™ copy in EN and DE, without placeholders", () => {
    for (const d of [en, de]) {
      const v = d.talisu.valueAdded;
      expect(v.canada).toContain("CAD");
      expect(v.leaseToOwnBody).toContain("Tsplits™");
      expect(v.title).toContain("Webster");
      const all = Object.values(v).join(" ");
      expect(all).not.toMatch(/TODO|lorem|placeholder|TBD|USD|\$/i);
    }
    expect(en.talisu.valueAdded.leaseToOwnBody).toContain("Income Tracking System");
    expect(de.talisu.valueAdded.leaseToOwnBody).toContain("Einnahmen");
  });

  it("has EN/DE SEO with the Webster share card", () => {
    const e = pages.pages["/talisu/value-added"];
    expect(e.noindex).toBe(false);
    expect(e.image).toBe("/og/pages/talisu-value-added");
    expect(e.en.title).toMatch(/Value-Added/);
    expect(e.de.title).toMatch(/Mehrwert/);
    for (const l of ["en", "de"]) {
      expect(readFileSync(join(root, `public/og/pages/talisu-value-added-${l}.jpg`)).length).toBeGreaterThan(10_000);
    }
  });
});
