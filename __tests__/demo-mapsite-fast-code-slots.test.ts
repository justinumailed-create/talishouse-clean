import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";
import {
  FAST_CODE_SLOT_LIMIT,
  SALES_ASSOCIATE_LOGINS,
  demoMapsiteSlotOpenHref,
  formatSlotAddedDate,
  sortSlotEntriesNewestFirst,
  mapsiteHrefForSlot,
  mapsiteProvinceFromAddress,
  mapsiteTownFromAddress,
  normalizeSlotFastCode,
  slotPlaceLabel,
} from "../lib/talispros/fast-code-slots";
import { NSNC_BOOK_HREF, NSNC_BOOK_SLUG, createNsncViewerBook } from "../lib/talispros/nsnc-book";

const read = (p: string) => readFileSync(resolve(p), "utf8");

describe("FAST Code slots on the Mapsites page (Ralf, Nov 3)", () => {
  it("keeps one list of up to 15 per sales associate", () => {
    expect(FAST_CODE_SLOT_LIMIT).toBe(15);
    expect([...SALES_ASSOCIATE_LOGINS]).toEqual(["aritri", "enanko"]);
  });

  it("validates codes before any lookup", () => {
    expect(normalizeSlotFastCode("  ab-12 ")).toBe("ab-12");
    expect(normalizeSlotFastCode("a")).toBeNull();
    expect(normalizeSlotFastCode("x'; drop")).toBeNull();
    expect(normalizeSlotFastCode(42)).toBeNull();
  });

  it("shows towns, not addresses, on the public list", () => {
    expect(mapsiteTownFromAddress("8 Plessis Rd #1783, Winnipeg, MB R2C 2Y6, Canada")).toBe("Winnipeg");
    expect(mapsiteTownFromAddress("Lot 8, South Head Rd., Homeville, Nova Scotia, Canada")).toBe("Homeville");
    expect(mapsiteTownFromAddress("Halifax, NS B3H 1A1")).toBe("Halifax");
    expect(mapsiteTownFromAddress("", "Sample")).toBe("Sample");
  });

  it("labels each code with town and province", () => {
    expect(mapsiteProvinceFromAddress("6 Main St, Corner Brook, NL A2H 2Z3, Canada")).toBe("NL");
    expect(mapsiteProvinceFromAddress("Lot 8, South Head Rd., Homeville, Nova Scotia, Canada")).toBe("NS");
    expect(mapsiteProvinceFromAddress("Boulevard de la Rivière, Rimouski, QC G5L 4N3, Canada")).toBe("QC");
    expect(mapsiteProvinceFromAddress("Somewhere")).toBe("");
    expect(slotPlaceLabel("Corner Brook", "NL")).toBe("Corner Brook, NL");
    expect(slotPlaceLabel("Sample", "")).toBe("Sample");
  });

  it("lists codes under the write-up and never says who prepared them (Arun, Nov 4)", () => {
    expect(demoMapsiteSlotOpenHref("abc")).toBe("/talispros/demo-mapsite/open/abc");
    expect(mapsiteHrefForSlot(null, " AB-12 ")).toMatch(/^\/talispros\/mapsite\/[^/]+\/ab-12$/);
    const server = read("lib/talispros/fast-code-slots-server.ts");
    const publicLoader = server.slice(server.indexOf("async function loadPublicLists"), server.indexOf("export async function loadSlotListForAgentId"));
    expect(publicLoader).toContain('.select("id, login_id")');
    expect(publicLoader).not.toMatch(/\bname\b/);
    const panel = read("components/talispros/demo-mapsite/FastCodeSlotsPanel.tsx");
    expect(panel).toContain("entry.fastCode");
    expect(panel).toContain("slotPlaceLabel(entry.town, entry.province)");
    expect(panel).not.toMatch(/\.name\b|<aside/);
    const builder = read("components/talispros/demo-mapsite/DemoMapSiteBuilderClient.tsx");
    expect(builder).not.toContain("_19rem]");
    expect(builder.indexOf("{d.hero.body2}")).toBeLessThan(builder.indexOf("<FastCodeSlotsPanel"));
    const route = read("app/talispros/demo-mapsite/open/[slotId]/route.ts");
    expect(route).toContain("noindex");
    const actions = read("app/talispros/demo-mapsite/slots-actions.ts");
    expect(actions.match(/getCurrentAgent\(\)/g)?.length).toBeGreaterThanOrEqual(2);
    const dashboard = read("components/admin/agents/AgentDashboard.tsx");
    expect(dashboard).toContain("loadSlotListForAgentId(agent.id)");
  });

  it("shows Aisha's four buttons on prepared Mapsites, same links as /talisu/reg", () => {
    const page = read("app/talispros/mapsite/[accountType]/[fastCode]/page.tsx");
    expect(page).toContain("isPreparedSlotMapsite(mapsite.id)");
    expect(page).toContain("url1_opens_broker_url: preparedSlotMapsite");
    expect(page).toContain("propose: talisuHref(TALISU_DISCUSS_PATH)");
    expect(page).toContain("claim: DEMO_MAPSITE_BUILD_PATH");
    expect(page).toContain("terms: PMC_PATHS.contract");
    expect(page).toContain('register: "/talisu/reg?step=choose"');
    expect(page).toContain("entryGranted={await hasRegisterEntry()}");
  });

  it("has EN + DE panel copy without dev text", () => {
    for (const dict of [en, de]) {
      const s = dict.demo.slots;
      for (const value of Object.values(s)) {
        expect(value).toBeTruthy();
        expect(String(value)).not.toMatch(/TODO|placeholder|lorem|Mapsite™/i);
      }
      expect(s.used).toContain("{limit}");
    }
  });
});

describe("North Shore Nature Centre TEB™ on the demo PIN", () => {
  it("is a 12-slide book with covers and the PDF", () => {
    expect(NSNC_BOOK_HREF).toBe(`/talisbooks/viewer/${NSNC_BOOK_SLUG}`);
    const book = createNsncViewerBook("de");
    expect(book.title).toBe("North Shore Nature Centre");
    expect(JSON.stringify(book)).toContain("/talisbooks/nsnc/pages/page-12.webp");
    expect(JSON.stringify(book)).toContain("North-Shore-Nature-Centre.pdf");
    expect(read("lib/talisbooks/viewer/load-book.ts")).toContain("createNsncViewerBook(locale)");
  });
});

describe("Recently added Mapsites list (Nov 4)", () => {
  it("names the list in EN and DE without a mark on Mapsite", () => {
    expect(en.demo.slots.title).toBe("Recently added Mapsites");
    expect(de.demo.slots.title).toBe("Kürzlich hinzugefügte Mapsites");
  });

  it("formats the added date for each locale", () => {
    expect(formatSlotAddedDate("2026-11-04T00:15:30Z", "en")).toBe("Nov 4, 2026");
    expect(formatSlotAddedDate("2026-11-04T00:15:30Z", "de")).toBe("4. Nov. 2026");
    expect(formatSlotAddedDate(null, "en")).toBe("");
    expect(formatSlotAddedDate("not a date", "de")).toBe("");
  });

  it("sorts newest first and puts undated entries last", () => {
    const sorted = sortSlotEntriesNewestFirst([
      { code: "a1", addedAt: "2026-11-01T00:00:00Z" },
      { code: "b1", addedAt: null },
      { code: "c1", addedAt: "2026-11-04T00:16:00Z" },
      { code: "d1", addedAt: "2026-11-04T00:15:00Z" },
    ]);
    expect(sorted.map((e) => e.code)).toEqual(["c1", "d1", "a1", "b1"]);
  });
});
