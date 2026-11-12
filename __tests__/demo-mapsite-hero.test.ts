import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";
import {
  DEMO_ADDRESS_INPUT_ID,
  DEMO_ADDRESS_INPUT_NAME,
  DEMO_DISPLAY_PIN,
  DEMO_PIN_CARD_ACTIONS,
  demoBuilderStartsOpen,
  demoHeroPinScreenOffset,
  demoInitialPinFromParams,
} from "../lib/talispros/demo-builder";

const read = (p: string) => readFileSync(resolve(p), "utf8");
const builder = read("components/talispros/demo-mapsite/DemoMapSiteBuilderClient.tsx");
const map = read("components/talispros/demo-mapsite/DemoHeroMap.tsx");
const address = read("components/build-mapsite/GoogleAddressInput.tsx");
const section = read("components/build-mapsite/HomePinLocationSection.tsx");
const demoBranch = section.slice(section.indexOf("if (isDemo) {"), section.indexOf('<div className="space-y-6">'));

describe("Mapsites page hero + hidden builder card (Ralf, Oct 26)", () => {
  it("has no top strip line and no 'Build your Mapsite' pill (Ralf, Nov 3)", () => {
    expect(builder).not.toContain("headline={t.catalogueUi.mapsitesHeadline}");
    expect(builder).not.toContain("headlineAction=");
    expect(builder).not.toContain("d.buildYourMapsite");
    expect(builder).not.toContain('testId="mapsites-build-demo-link"');
    expect(builder).not.toContain("revealBuilder");
  });

  it("shows the hero first; deep links still open the step 1-3 card", () => {
    expect(builder).toContain("useState(initialOpen)");
    expect(builder).toContain("{!showCard ? (");
    expect(builder).toContain('data-testid="demo-hero"');
    expect(builder).not.toContain('data-testid="demo-hero-build"');
    expect(builder).not.toContain("d.hero.cta");
    expect(builder).toContain('addEventListener("popstate"');
    // Back from the eBook step (client router cache) re-reads ?build=1 on mount.
    expect(builder).toContain("if (demoBuilderStartsOpen(searchParamsObject())) syncFromUrl();");
  });

  it("puts the FAST Codes inside the write-up, with no side card (Arun, Nov 4)", () => {
    expect(builder).toContain("<FastCodeSlotsPanel data={slotsPanel} />");
    expect(builder).not.toContain("lg:grid-cols-[minmax(0,1fr)_19rem]");
    expect(builder).not.toContain("d.hero.body1");
    expect(builder).not.toContain("d.hero.body2");
    expect(builder.indexOf("{d.hero.headline}")).toBeLessThan(builder.indexOf("<FastCodeSlotsPanel"));
    expect(builder.indexOf("<FastCodeSlotsPanel")).toBeLessThan(builder.indexOf("</section>"));
    const page = read("app/talispros/demo-mapsite/page.tsx");
    expect(page).toContain("await loadFastCodeSlotsPanel()");
    expect(page).toContain("slotsPanel={slotsPanel}");
  });

  it("opens the card directly for deep links or Back that carry build/address/PIN state", () => {
    expect(demoBuilderStartsOpen({})).toBe(false);
    expect(demoBuilderStartsOpen({ utm_source: "x" })).toBe(false);
    expect(demoBuilderStartsOpen({ build: "1" })).toBe(true);
    expect(demoBuilderStartsOpen({ address: "1 Queen St W" })).toBe(true);
    expect(demoBuilderStartsOpen({ lat: "43.6", lng: "-79.4" })).toBe(true);
    expect(demoInitialPinFromParams({ address: " 1 Queen St W ", lat: "43.6", lng: "-79.4" })).toEqual({
      streetAddress: "1 Queen St W",
      latitude: "43.6",
      longitude: "-79.4",
      manualPlacement: true,
    });
    expect(demoInitialPinFromParams({ lat: "999", lng: "0" })).toEqual({});
    const page = read("app/talispros/demo-mapsite/page.tsx");
    expect(page).toContain("initialOpen={demoBuilderStartsOpen(params)}");
    expect(page).toContain('pageMetadata("/talispros/demo-mapsite")');
    expect(read("components/talispros/demo-mapsite/DemoEbookGenerateClient.tsx")).toContain(
      "href={`${DEMO_MAPSITE_BUILD_PATH}?build=1`}",
    );
  });

  it("shows one Mapsite display map and an open PIN card, with no slider or feature links", () => {
    expect(builder).toContain("<DemoHeroMap />");
    expect(builder).not.toContain("DemoMapsiteSlides");
    expect(builder).not.toContain("demo-hero-feature");
    expect(builder).not.toContain("<nav");
    const writeup = builder.slice(builder.indexOf('id="demo-hero-title"'), builder.indexOf("</section>"));
    expect(writeup).not.toContain("<a");
    expect(existsSync(resolve("components/talispros/demo-mapsite/DemoMapsiteSlides.tsx"))).toBe(false);
    for (const name of ["mapsite", "ebooks", "bookshelf", "knowledge", "pins"]) {
      expect(existsSync(resolve(`public/talispros/demo-slides/feature-${name}.webp`))).toBe(false);
    }

    expect(map).toContain('basemapView="satellite"');
    expect(map).toContain("MapEngineProvider");
    expect(map).toContain("interactive={false}");
    expect(map).toContain("selectedPinId={DEMO_DISPLAY_PIN.id}");
    expect(map).toContain('data-testid="demo-hero-pin-card"');
    // The open card hangs from the top of the map so its photo stays inside
    // the panel. The PIN is offset down to sit under the pointer.
    expect(map).toContain("top-4");
    expect(map).toContain("demoHeroPinScreenOffset");
    // The PIN, its photo and its TEB™ button open the North Shore Nature
    // Centre eBook; the other actions stay display only.
    expect(map).toContain('data-testid="demo-hero-pin-link"');
    expect(map).toContain("calc(50% + ${pinOffsetY}px)");
    expect(map.match(/href={NSNC_BOOK_HREF}/g)).toHaveLength(3);
    expect(map).toContain("src={NSNC_PIN_IMAGE}");
    expect(map).not.toContain("img-11-1280x720");
    expect(map).toContain("pointer-events-none");
    expect(map).toContain("bg-[#046BD9]");
    expect(map).toContain("rounded-full");
    expect(map).toContain("shadow-[0_6px_14px_rgba(4,107,217,0.3)]");
    expect(DEMO_PIN_CARD_ACTIONS).toEqual(["URL 1", "URL 2", "TEB™", "TTV™"]);
    expect(map.match(/data-testid="demo-hero-pin-action"/g)).toHaveLength(2);
    // Bay St. Lawrence, Nova Scotia B0C 1R0 (near the North Shore Nature Centre).
    expect(DEMO_DISPLAY_PIN.latitude).toBeCloseTo(46.993, 2);
    expect(DEMO_DISPLAY_PIN.longitude).toBeCloseTo(-60.465, 2);
    expect(map).not.toMatch(/FAST Code|@[a-z]/i);
  });

  it("drops the sample PIN under the open card without leaving the panel", () => {
    expect(demoHeroPinScreenOffset(0, 200)).toBe(0);
    expect(demoHeroPinScreenOffset(672, 0)).toBe(0);
    const offset = demoHeroPinScreenOffset(672, 300);
    const pinCenter = 672 / 2 + offset;
    expect(pinCenter).toBeGreaterThan(300 + 39);
    expect(pinCenter + 39).toBeLessThan(672);
    const short = demoHeroPinScreenOffset(480, 300);
    expect(480 / 2 + short + 39).toBeLessThanOrEqual(480 - 16);
  });

  it("stacks the map above the write-up on mobile, a wider rail on desktop", () => {
    expect(builder).not.toContain("lg:grid-cols-2");
    expect(builder.indexOf("<DemoHeroMap")).toBeLessThan(builder.indexOf("{d.hero.headline}"));
    const css = read("app/globals.css");
    expect(css).toContain(".demo-hero__media {\n  height: 32rem;");
    expect(css).toContain("grid-template-columns: minmax(0, 0.9fr) minmax(26rem, 1.15fr);");
    expect(css).toContain(".demo-hero__list");
  });

  it("does not look like a login field to Safari / iCloud Keychain", () => {
    expect(DEMO_ADDRESS_INPUT_ID).not.toMatch(/pin|pass|code|user|login|email/i);
    expect(DEMO_ADDRESS_INPUT_NAME).not.toMatch(/pin|pass|code|user|login|email/i);
    expect(builder).not.toContain("<form");
    expect(builder).toContain("addressLabel: d.addressFieldLabel");
    expect(en.demo.addressFieldLabel).toBe("Street address");
    expect(de.demo.addressFieldLabel).toBe("Straßenadresse");
    expect(demoBranch).toContain('autoComplete="off"');
    expect(demoBranch).toContain("ignorePasswordManagers");
    expect(address).toContain('data-1p-ignore={ignorePasswordManagers ? "true" : undefined}');
    expect(address).toContain('data-lpignore={ignorePasswordManagers ? "true" : undefined}');
    expect(address).toContain('data-form-type={ignorePasswordManagers ? "other" : undefined}');
    // Other build-mapsite pages keep the street-address token.
    expect(address).toContain('autoComplete = "street-address"');
    expect(address).toContain('type="text"');
  });

  it("has EN + DE hero copy; Mapsite never carries ™", () => {
    function strings(value: unknown, out: string[] = []): string[] {
      if (typeof value === "string") out.push(value);
      else if (value && typeof value === "object") {
        for (const nested of Object.values(value)) strings(nested, out);
      }
      return out;
    }
    for (const dict of [en, de]) {
      const hero = dict.demo.hero;
      for (const value of strings(hero)) {
        expect(value).toBeTruthy();
        expect(value).not.toMatch(/Mapsite™/);
      }
      expect(hero.headline).not.toMatch(/\bkm\b|kilomet|Mapsite™|FAST Code™|USD|\$|miles?\b|TODO|TBD/i);
      expect(hero.pinCard.body).not.toMatch(/FAST Code|USD|\$|miles?\b/i);
    }
    expect(en.demo.hero.headline).toBe("Demo Mapsites");
    expect(de.demo.hero.headline).toBe("Demo-Mapsites");
    expect(en.demo.hero.headline).not.toBe(de.demo.hero.headline);
    expect("body1" in en.demo.hero).toBe(false);
    expect("body2" in de.demo.hero).toBe(false);
    expect(en.demo.hero.pinCard.body).toBe("Bay St. Lawrence, Nova Scotia");
    expect(de.demo.hero.pinCard.body).toBe("Bay St. Lawrence, Neuschottland");
    expect(en.demo.hero.pinCard.openEbook).toContain("TEB™");
    expect(de.demo.hero.pinCard.openEbook).toContain("TEB™");
  });
});
