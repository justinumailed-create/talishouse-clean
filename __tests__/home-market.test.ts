import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/dictionaries/en";
import { de } from "@/lib/i18n/dictionaries/de";
import { TALISU_MKTS_PINS } from "@/lib/talisu/markets-pins";
import { TALISU_US_MKTS_FLAG } from "@/lib/talisu/us-markets-pins";
import {
  HOME_MARKET_MAP_PINS,
  HOME_MARKET_MARKETS,
  HOME_MARKET_PATH,
  HOME_MARKET_TALISHOUSE_PIN,
  HOME_MARKET_US_ROWS,
  homeMarketById,
  homeMarketDisplayName,
  homeMarketEnginePins,
} from "@/lib/talisu/north-america-markets";
import {
  EMPTY_HOME_MARKET_DRAFT,
  HOME_MARKET_AGENT_CODE,
  HOME_MARKET_AISHA_VARIABLES_ENABLED,
  HOME_MARKET_PREVIEW_MIN_OPACITY,
  homeMarketAishaDynamicVariables,
  homeMarketGoodJob,
  homeMarketPreviewOpacity,
  homeMarketRegisterHref,
  homeMarketStage,
  homeMarketStepsDone,
} from "@/lib/talispros/home-market-flow";
import { TALISPROS_HOME_SYSTEM_DEMO_HREF } from "@/lib/talispros/start-content";
import {
  CENTREFOLD_BOOK_HREF,
  CENTREFOLD_SLIDE_COUNT,
  centrefoldSlideHref,
  createCentrefoldViewerBook,
} from "@/lib/talispros/centrefold-book";
import pages from "@/lib/seo/pages.json";

const read = (p: string) => readFileSync(resolve(p), "utf8");

describe("Home Market map (Ralf, Nov 22)", () => {
  it("has 15 Canada + 30 US market PINs and one Talishouse™ PIN in Canada", () => {
    const canada = HOME_MARKET_MARKETS.filter((pin) => pin.country === "CA");
    const usa = HOME_MARKET_MARKETS.filter((pin) => pin.country === "US");
    expect(canada).toHaveLength(15);
    expect(usa).toHaveLength(30);
    expect(HOME_MARKET_MARKETS).toHaveLength(45);
    const talishouse = HOME_MARKET_MAP_PINS.filter((pin) => pin.kind === "talishouse");
    expect(talishouse).toHaveLength(1);
    const source = TALISU_MKTS_PINS.find((pin) => pin.id === "modular-spaces");
    expect(HOME_MARKET_TALISHOUSE_PIN?.latitude).toBe(source?.latitude);
    expect(HOME_MARKET_TALISHOUSE_PIN?.longitude).toBe(source?.longitude);
    expect(homeMarketEnginePins()).toHaveLength(46);
    expect(new Set(HOME_MARKET_MAP_PINS.map((pin) => pin.id)).size).toBe(46);
  });

  it("uses Arun's 30 rural US anchors with US-flag pins", () => {
    expect(HOME_MARKET_US_ROWS[0]).toMatchObject({
      id: "us01",
      name: "Pacific Northwest & Alaska",
      anchor: "Ellensburg, WA",
      latitude: 46.996,
      longitude: -120.547,
    });
    expect(HOME_MARKET_US_ROWS[29]).toMatchObject({ anchor: "Brooksville, FL" });
    for (const row of HOME_MARKET_US_ROWS) {
      expect(row.latitude).toBeGreaterThan(24);
      expect(row.latitude).toBeLessThan(50);
      expect(row.longitude).toBeLessThan(-66);
      expect(row.longitude).toBeGreaterThan(-125);
    }
    const us = homeMarketById("us07");
    expect(us?.flagUrl).toBe(TALISU_US_MKTS_FLAG);
    expect(us && homeMarketDisplayName(us)).toBe("Rocky Mountain Region (Laramie, WY)");
    expect(homeMarketById("ca-nl")?.name).toBe("Newfoundland & Labrador");
    expect(homeMarketById("talishouse")).toBeNull();
  });

  it("shows no population figures in the data or the page copy", () => {
    expect(JSON.stringify(HOME_MARKET_MAP_PINS)).not.toMatch(/population|million/i);
    for (const dict of [en, de]) {
      expect(JSON.stringify(dict.homeMarket)).not.toMatch(/million|Millionen|Einwohner|population/i);
      expect(JSON.stringify(dict.markets)).not.toMatch(/\d+ (to|bis) \d+ (million|Millionen)/i);
    }
    expect(read("lib/talisu/north-america-markets.ts")).not.toMatch(/population:\s*\d/);
  });

  it("is public, linked from the homepage Build Mapsite button, with SEO", () => {
    expect(HOME_MARKET_PATH).toBe("/home-market");
    expect(TALISPROS_HOME_SYSTEM_DEMO_HREF).toBe(HOME_MARKET_PATH);
    const page = read("app/home-market/page.tsx");
    expect(page).not.toContain("MarketsMapOrGate");
    expect(page).not.toContain("getAdminSessionAccount");
    expect(page).toContain('pageMetadata("/home-market")');
    const entry = (pages as unknown as { pages: Record<string, { en: { title: string } }> }).pages["/home-market"];
    expect(entry.en.title).toContain("Home Market");
    expect(en.homeMarket.selectPin).toBe("Select the PIN nearest you to claim your Home Market");
  });

  it("opens Personalize straight from a market PIN, without Aisha's script", () => {
    const map = read("components/talispros/home-market/HomeMarketMap.tsx");
    expect(map).toContain("onPersonalize(selected)");
    expect(map).not.toContain("AishaConvaiWidget");
    expect(read("components/talispros/home-market/HomeMarketPage.tsx")).not.toContain("AishaConvaiWidget");
  });

  it("keeps site copy free of internal notes and em dashes", () => {
    for (const dict of [en, de]) {
      const values: string[] = [];
      const walk = (node: unknown) => {
        if (typeof node === "string") values.push(node);
        else if (node && typeof node === "object") Object.values(node).forEach(walk);
      };
      walk(dict.homeMarket);
      for (const value of values) expect(value).not.toMatch(/TODO|PLACEHOLDER|lorem|\u2014/i);
    }
  });
});

describe("Personalize flow", () => {
  const market = homeMarketById("us01")!;
  const full = {
    ...EMPTY_HOME_MARKET_DRAFT,
    firstName: "  Sam ",
    accountType: "agent" as const,
    pinPlaced: true,
  };

  it("builds the Home Page up from faint to fully visible", () => {
    expect(homeMarketStepsDone(EMPTY_HOME_MARKET_DRAFT)).toBe(0);
    expect(homeMarketPreviewOpacity(EMPTY_HOME_MARKET_DRAFT, false)).toBe(HOME_MARKET_PREVIEW_MIN_OPACITY);
    const half = homeMarketPreviewOpacity({ ...EMPTY_HOME_MARKET_DRAFT, firstName: "Sam" }, false);
    expect(half).toBeGreaterThan(HOME_MARKET_PREVIEW_MIN_OPACITY);
    expect(half).toBeLessThan(1);
    expect(homeMarketPreviewOpacity(full, false)).toBe(1);
    expect(homeMarketPreviewOpacity(EMPTY_HOME_MARKET_DRAFT, true)).toBe(1);
  });

  it("goes Personalize → Build Mapsite → Register this Market", () => {
    expect(homeMarketStage(EMPTY_HOME_MARKET_DRAFT, false)).toBe("personalize");
    expect(homeMarketStage(full, false)).toBe("build");
    expect(homeMarketStage(full, true)).toBe("register");
    expect(en.homeMarket.personalize).toBe("Personalize");
    expect(en.homeMarket.registerMarket).toBe("Register this Market");
  });

  it("greets by first name after Build Mapsite", () => {
    expect(homeMarketGoodJob(full.firstName, en.homeMarket.goodJob)).toBe(
      "Good job, Sam. Your market is available. We look forward to working with you.",
    );
  });

  it("opens the matching Register button with Aisha's code filled in", () => {
    for (const type of ["broker", "agent", "fsbo", "adpro"] as const) {
      const href = new URL(homeMarketRegisterHref(type, market), "https://x.invalid");
      expect(href.pathname).toBe("/register");
      expect(href.searchParams.get("product")).toBe(type);
      expect(href.searchParams.get("locked")).toBe("code");
      expect(href.searchParams.get("code")).toBe(HOME_MARKET_AGENT_CODE);
      expect(href.searchParams.get("market")).toBe("us01");
    }
    expect(HOME_MARKET_AGENT_CODE).toBe("Aishaa");
    const register = read("app/register/page.tsx");
    expect(register).toContain("initialCode={prefillCode}");
    expect(register).toContain("/^[A-Za-z0-9]{1,24}$/");
    expect(read("components/talisu/RegisterActions.tsx")).toContain("useState(initialCode)");
  });

  it("saves nothing on the server", () => {
    const flow = read("components/talispros/home-market/HomeMarketPersonalize.tsx");
    expect(flow).not.toMatch(/from "@\/app\//);
    expect(flow).not.toContain("fetch(");
    expect(flow).not.toContain("createDemoMapSiteAction");
  });

  it("keeps Aisha's widget variables off until her agent declares them", () => {
    expect(HOME_MARKET_AISHA_VARIABLES_ENABLED).toBe(false);
    expect(JSON.parse(homeMarketAishaDynamicVariables("<Sam>", market))).toEqual({
      build_event: "build_mapsite_submitted",
      builder_first_name: "<Sam>",
      market_name: "Pacific Northwest & Alaska",
    });
    expect(homeMarketAishaDynamicVariables("<Sam>", market)).not.toContain("<");
  });
});

describe("Centrefolds demo eBook (20 pages)", () => {
  it("has 20 slides on disk and opens in the viewer", () => {
    expect(CENTREFOLD_SLIDE_COUNT).toBe(20);
    for (let slide = 1; slide <= 20; slide += 1) {
      expect(existsSync(resolve("public", centrefoldSlideHref(slide).slice(1)))).toBe(true);
    }
    for (const file of ["front-cover.webp", "back-cover.webp", "pin.webp", "Centrefolds.pdf"]) {
      expect(existsSync(resolve("public/talisbooks/centrefold", file))).toBe(true);
    }
    const book = createCentrefoldViewerBook("en");
    expect(book.pages).toHaveLength(2 + 19 * 2);
    expect(CENTREFOLD_BOOK_HREF).toBe("/talisbooks/viewer/centrefolds");
    expect(read("lib/talisbooks/viewer/load-book.ts")).toContain("createCentrefoldViewerBook(locale)");
  });

  it("replaces North Shore Nature Centre on the demo Mapsite PIN", () => {
    const hero = read("components/talispros/demo-mapsite/DemoHeroMap.tsx");
    expect(hero).toContain("CENTREFOLD_BOOK_HREF");
    expect(hero).not.toContain("NSNC_");
    expect(en.demo.hero.pinCard.openEbook).toBe("Open the Centrefolds TEB™");
  });
});
