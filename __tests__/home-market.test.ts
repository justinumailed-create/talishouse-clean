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
  HOME_MARKET_PHOTO_FALLBACK,
  HOME_MARKET_REQUIRED_STEPS,
  HOME_MARKET_AISHA_ENTRY_CONTEXT,
  HOME_MARKET_PREVIEW_MIN_OPACITY,
  homeMarketAishaDynamicVariables,
  homeMarketAishaFirstMessage,
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
    expect(us && homeMarketDisplayName(us)).toBe("Rocky Mountain Region");
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
    expect(en.homeMarket.selectPin).toBe("Place your PIN to claim a Home Market of 100,000 people (+/-)");
  });

  it("opens Personalize straight from the visitor's own PIN, without Aisha's script", () => {
    const map = read("components/talispros/home-market/HomeMarketMap.tsx");
    expect(map).toContain("onPersonalize(selectedPlaced)");
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

  it("passes Aisha's v9 Build Mapsite variables and opening line", () => {
    expect(HOME_MARKET_AISHA_ENTRY_CONTEXT).toBe("build_complete");
    const vars = JSON.parse(homeMarketAishaDynamicVariables("  Sam ", market, "agent"));
    expect(vars).toEqual({
      signed_in: "no",
      first_name: "Sam",
      home_market: homeMarketDisplayName(market),
      account_type: "agent",
      entry_context: "build_complete",
    });
    expect(JSON.parse(homeMarketAishaDynamicVariables("", market, null)).account_type).toBe("");
    expect(homeMarketAishaDynamicVariables("<Sam>", market, null)).not.toContain("<");
    expect(homeMarketAishaFirstMessage("Sam")).toBe(
      "Good job, Sam. Your market is available. We look forward to working with you. Would you like me to explain pricing?",
    );
    expect(homeMarketAishaFirstMessage("  ")).toMatch(/^Good job\. Your market is available\./);
    expect(homeMarketAishaFirstMessage("Sam")).not.toMatch(/[—–]/);
  });

  it("starts the live call from the Build Mapsite click and keeps the text", () => {
    const flow = read("components/talispros/home-market/HomeMarketPersonalize.tsx");
    expect(flow).not.toContain("home-market-hear-aisha");
    expect(flow).toMatch(/setBuilt\(true\);[\s\S]{0,160}setAishaLive\(true\);/);
    expect(flow.match(/setAishaLive\(true\)/g)).toHaveLength(1);
    expect(flow).toMatch(/aishaLive \? \(/);
    expect(flow).toContain("firstMessage={homeMarketAishaFirstMessage(firstName)}");
    expect(flow).toContain('data-testid="home-market-good-job-text"');
    const widget = read("components/talispros/AishaConvaiWidget.tsx");
    expect(widget.match(/override-first-message=\{firstMessage \|\| undefined\}/g)).toHaveLength(2);
    expect("hearAisha" in en.homeMarket).toBe(false);
  });

  it("keeps the start and end call controls fully visible", () => {
    const flow = read("components/talispros/home-market/HomeMarketPersonalize.tsx");
    const live = flow.slice(
      flow.indexOf('data-testid="home-market-aisha-live"') - 180,
      flow.indexOf('data-testid="home-market-aisha-live"') + 80,
    );
    expect(live).toContain("h-[36rem]");
    expect(live).toContain("min-h-[36rem]");
    expect(live).toContain("overflow-visible");
    expect(live).not.toContain("h-[26rem]");
    expect(live).not.toContain("overflow-hidden");
    const banner = read("lib/talispros/hide-elevenlabs-banner.ts");
    const inline = banner.slice(
      banner.indexOf("POWERED_BY_INLINE_STYLE"),
      banner.indexOf("const OPEN_LABEL"),
    );
    expect(inline).toContain('div:has(> [data-pane="speech"]) .sheet');
    expect(inline).toContain("padding-bottom: 6rem");
    expect(inline).toContain("min-height: 5.5rem");
    expect(inline).toContain('data-pane="speech"');
    expect(inline).not.toContain("right: 4.5rem");
    expect(inline).not.toContain("bottom: 1.15rem");
    expect(inline).not.toContain("width: 3.25rem");
    expect(inline).not.toContain("height: 3.25rem");
  });

  it("builds their Mapsite preview with the Home PIN card open", () => {
    const preview = read("components/talispros/home-market/HomePagePreview.tsx");
    const flow = read("components/talispros/home-market/HomeMarketPersonalize.tsx");
    expect(preview).toContain("DemoHeroMap");
    expect(preview).toContain('testId="home-market-preview"');
    expect(preview).toContain("accountLabel={account}");
    expect(preview).not.toContain("TALISU_MKTS_MARKET_HERO");
    expect(preview).not.toContain("previewBookshelf");
    expect(preview).not.toContain("previewManager");
    expect(flow).toContain("pin={pin}");
    expect(preview).not.toMatch(/TODO|PLACEHOLDER|lorem/i);
    expect(HOME_MARKET_PHOTO_FALLBACK).toBe("/talisbooks/centrefold/pages/page-08.webp");
    expect(existsSync(resolve("public", HOME_MARKET_PHOTO_FALLBACK.slice(1)))).toBe(true);
    expect(preview).toContain("HOME_MARKET_PHOTO_FALLBACK");
    expect(preview).toContain('data-testid="home-market-preview-photo"');
    expect(preview).toContain('data-testid="home-market-preview-brokerage"');
    expect(preview).toContain('data-testid="home-market-update-picture"');
    expect(flow).toContain('data-testid="home-market-photo"');
    expect(flow).toContain("onUpdatePicture");
    expect(homeMarketStepsDone({ ...EMPTY_HOME_MARKET_DRAFT, photoUrl: "/tmp/photo.jpg" })).toBe(0);
    expect(HOME_MARKET_REQUIRED_STEPS).toBe(3);
    expect(en.homeMarket.photoLabel.toLowerCase()).toContain("optional");
    expect(de.homeMarket.photoLabel.toLowerCase()).toContain("optional");
    const hero = read("components/talispros/demo-mapsite/DemoHeroMap.tsx");
    expect(hero).toContain("gm-err-container");
    expect(hero).toContain("map-idle-backdrop");
    expect(hero).toContain("map-idle-pin");
    expect(en.homeMarket.previewLabel).toBe("Your Mapsite");
    expect(de.homeMarket.previewLabel).toBe("Ihre Mapsite");
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

describe("Ralf, Nov 23: place your own PIN, zoom, Webster book, celebration, Mapsites Built", () => {
  it("shows no fixed market PINs on the public map, only the Talishouse™ PIN", async () => {
    const mod = await import("@/lib/talisu/north-america-markets");
    expect(mod.HOME_MARKET_PUBLIC_PINS.map((pin) => pin.id)).toEqual(["talishouse"]);
    expect(mod.homeMarketPublicEnginePins(null).map((pin) => pin.id)).toEqual(["talishouse"]);
    const map = read("components/talispros/home-market/HomeMarketMap.tsx");
    expect(map).toContain("homeMarketPublicEnginePins");
    expect(map).not.toContain("HOME_MARKET_MAP_PINS");
  });

  it("turns a placed PIN into the visitor's Home Market and back from the URL", async () => {
    const mod = await import("@/lib/talisu/north-america-markets");
    const placed = mod.placedHomeMarket({
      latitude: 46.0878123,
      longitude: -64.7782456,
      address: "123 Main St, Moncton, NB E1C 1A1, Canada",
    })!;
    expect(placed.id).toBe("pin-46.08781_-64.77825");
    expect(placed.country).toBe("CA");
    expect(placed.name).toBe("Moncton, NB E1C 1A1");
    expect(mod.isPlacedHomeMarket(placed)).toBe(true);
    const back = mod.homeMarketFromParams(placed.id, placed.address);
    expect(back?.latitude).toBe(46.08781);
    expect(back?.name).toBe("Moncton, NB E1C 1A1");
    expect(mod.homeMarketFromParams("pin-99_-500", "")).toBeNull();
    expect(mod.homeMarketFromParams("us07", null)?.name).toBe("Rocky Mountain Region");
    expect(mod.placedHomeMarket({ latitude: 40.7, longitude: -74, address: "Newark, NJ 07102, USA" })?.country).toBe("US");
    const href = new URL(homeMarketRegisterHref("broker", placed), "https://x.invalid");
    expect(href.searchParams.get("market")).toBe(placed.id);
  });

  it("counts the placed PIN as a done step in Personalize", () => {
    const flow = read("components/talispros/home-market/HomeMarketPersonalize.tsx");
    expect(flow).toContain("if (isPlacedHomeMarket(market)) return true;");
    expect(flow).toContain('streetAddress: market.address ?? ""');
  });

  it("has always-visible zoom in, zoom out and reset buttons", () => {
    const map = read("components/talispros/home-market/HomeMarketMap.tsx");
    for (const id of ["home-market-zoom-in", "home-market-zoom-out", "home-market-zoom-reset"]) {
      expect(map).toContain(`data-testid="${id}"`);
    }
    expect(en.homeMarket.zoomOut).toBe("Zoom out");
    expect(de.homeMarket.zoomOut).toBe("Verkleinern");
  });

  it("keeps one headline, the Tsplits™ Mapsites header, and drops the old left line", () => {
    const page = read("components/talispros/home-market/HomeMarketPage.tsx");
    expect(page).not.toContain("aishaLine");
    expect("aishaLine" in en.homeMarket).toBe(false);
    expect(en.homeMarket.kicker).toBe("Tsplits™ Mapsites");
    expect(en.homeMarket.selectPin).toContain("Home Market of 100,000 people (+/-)");
    expect(de.homeMarket.selectPin).toContain("100.000 Menschen (+/-)");
    for (const dict of [en, de]) {
      expect(dict.homeMarket.intro).not.toMatch(/Each PIN is one market|Jeder PIN ist ein Markt/);
    }
  });

  it("draws the visitor's own PIN as solid red with a white circular centre", async () => {
    const mod = await import("@/lib/talisu/north-america-markets");
    const placed = mod.placedHomeMarket({
      latitude: 46.08,
      longitude: -64.78,
      address: "Moncton, NB, Canada",
    })!;
    const engine = mod.homeMarketPlacedEnginePin(placed);
    expect(mod.HOME_MARKET_OWN_PIN_COLOR).toBe("#E53935");
    expect(engine.color).toBe(mod.HOME_MARKET_OWN_PIN_COLOR);
    expect(engine.metadata).not.toHaveProperty("customLogoUrl");
    expect(engine.metadata?.icon).toBe("none");
    expect(engine.metadata?.whiteCenter).toBe(true);
    expect(read("components/talisu/MarketsMapsitesMap.tsx")).toContain("HOME_MARKET_OWN_PIN_COLOR");
    expect(read("components/talispros/home-market/HomePagePreview.tsx")).toContain("HOME_MARKET_OWN_PIN_COLOR");
  });

  it("opens Webster's Income Units book from the Talishouse™ PIN, Catalogue next", async () => {
    const book = await import("@/lib/talispros/webster-book");
    expect(book.WEBSTER_BOOK_HREF).toBe("/income-units");
    expect(book.websterBookPages()).toHaveLength(8);
    for (const page of book.websterBookPages()) {
      expect(existsSync(resolve("public", page.src.slice(1)))).toBe(true);
    }
    const map = read("components/talispros/home-market/HomeMarketMap.tsx");
    expect(map).toContain("WEBSTER_BOOK_HREF");
    expect(map).toContain('href="/catalogue"');
    const viewer = read("components/talispros/webster-book/WebsterBook.tsx");
    expect(viewer).toContain("CATALOGUE_HREF");
    expect(viewer).toContain("WEBSTER_CALL_HREF");
    expect(viewer).toContain("IncomeLostBand");
    expect(viewer).toContain("100cqh");
    expect(viewer).toContain('aspectRatio: "792 / 612"');
    expect(viewer).not.toContain("100dvh-15rem");
    expect(en.homeMarket.bookLossTitle).not.toMatch(/\d/);
    expect(en.homeMarket.bookLossBody).not.toMatch(/\$\s?\d/);
    expect(en.homeMarket.seeCatalogue).toBe("See the Catalogue");
  });

  it("celebrates Build Mapsite and invites them to register and add PINs", () => {
    const flow = read("components/talispros/home-market/HomeMarketPersonalize.tsx");
    expect(flow).toMatch(/setAishaLive\(true\);\s*setCelebrate\(true\);/);
    expect(flow).toContain("<HomeMarketCelebration");
    const preview = read("components/talispros/home-market/HomePagePreview.tsx");
    expect(preview).toContain('data-testid="home-market-add-pins"');
    expect(en.homeMarket.congratsTitleName).toBe("Congratulations, {name}!");
  });

  it("removes US anchor-city names from public market names and map cards", () => {
    expect(read("lib/talisu/us-markets-pins.ts")).not.toContain("copy.us.anchorsLabel}: ${pin.anchors");
  });
});
