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
  demoInitialPinFromParams,
} from "../lib/talispros/demo-builder";

const read = (p: string) => readFileSync(resolve(p), "utf8");
const builder = read("components/talispros/demo-mapsite/DemoMapSiteBuilderClient.tsx");
const map = read("components/talispros/demo-mapsite/DemoHeroMap.tsx");
const address = read("components/build-mapsite/GoogleAddressInput.tsx");
const section = read("components/build-mapsite/HomePinLocationSection.tsx");
const demoBranch = section.slice(section.indexOf("if (isDemo) {"), section.indexOf('<div className="space-y-6">'));

describe("Mapsites page hero + hidden builder card (Ralf, Oct 26)", () => {
  it("keeps the Catalogue strip with the Market Zone line and a 'Build your Mapsite' pill", () => {
    expect(builder).toContain('headlineVariant="catalogue"');
    expect(builder).toContain("headline={t.catalogueUi.mapsitesHeadline}");
    expect(builder).toContain("label={d.buildYourMapsite}");
    expect(en.demo.buildYourMapsite).toBe("Build your Mapsite");
    expect(de.demo.buildYourMapsite).toBe("Ihre Mapsite erstellen");
  });

  it("shows the hero first and hides the step 1-3 card until Build", () => {
    expect(builder).toContain("useState(initialOpen)");
    expect(builder).toContain("{!showCard ? (");
    expect(builder).toContain('data-testid="demo-hero"');
    // The only build trigger is the top-strip pill. No button inside the card.
    expect(builder).not.toContain('data-testid="demo-hero-build"');
    expect(builder).not.toContain("d.hero.cta");
    expect(builder.match(/onClick={revealBuilder}/g)).toHaveLength(1);
    expect(builder).toContain("frame = window.requestAnimationFrame(focusAddressBox)");
    expect(builder).toContain("url.searchParams.set(DEMO_BUILD_QUERY");
    expect(builder).toContain('addEventListener("popstate"');
    // Back from the eBook step (client router cache) re-reads ?build=1 on mount.
    expect(builder).toContain("router.push(`${url.pathname}${url.search}${url.hash}`, { scroll: false })");
    expect(builder).toContain("if (demoBuilderStartsOpen(searchParamsObject())) syncFromUrl();");
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
    expect(map).not.toMatch(/href=/);
    expect(map).toContain("pointer-events-none");
    expect(map).toContain("bg-[#046BD9]");
    expect(map).toContain("rounded-full");
    expect(map).toContain("shadow-[0_6px_14px_rgba(4,107,217,0.3)]");
    expect(DEMO_PIN_CARD_ACTIONS).toEqual(["URL 1", "URL 2", "TEB™", "TTV™"]);
    expect(map.match(/data-testid="demo-hero-pin-action"/g)).toHaveLength(1);
    expect(DEMO_DISPLAY_PIN.latitude).toBeGreaterThan(41);
    expect(DEMO_DISPLAY_PIN.latitude).toBeLessThan(70);
    expect(DEMO_DISPLAY_PIN.longitude).toBeLessThan(-50);
    expect(map).not.toMatch(/FAST Code|@[a-z]/i);
  });

  it("stacks the map above the write-up on mobile, two columns on desktop", () => {
    expect(builder).toContain("lg:grid-cols-2");
    expect(builder.indexOf("<DemoHeroMap")).toBeLessThan(builder.indexOf("{d.hero.headline}"));
    const css = read("app/globals.css");
    expect(css).toContain(".demo-hero__media {\n  height: 32rem;");
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
      expect(hero.body1).toMatch(/80/);
      expect(hero.body1 + hero.body2).not.toMatch(/screen|editor|bookshelf|Knowledge Base|Bildschirm|Bücherregal|Wissensdatenbank/i);
      expect(hero.body2).not.toMatch(/open any|Öffnen Sie eines/i);
      expect(`${hero.body1} ${hero.body2} ${hero.pinCard.title} ${hero.pinCard.body}`).not.toMatch(
        /FAST Code|USD|\$|miles?\b/i,
      );
    }
    expect(en.demo.hero.body2).toBe(
      "One sample PIN in Canada sits on the map, with its card already open. Use Build your Mapsite above. It takes a couple of minutes.",
    );
    expect(de.demo.hero.body2).toBe(
      "Ein Beispiel-PIN in Kanada liegt auf der Karte, und seine Infokarte ist bereits geöffnet. Nutzen Sie oben „Ihre Mapsite erstellen“. Das dauert nur ein paar Minuten.",
    );
    expect(en.demo.hero.pinCard.title).toBe("Niagara Falls, Ontario");
    expect(de.demo.hero.pinCard.title).toBe("Niagara Falls, Ontario");
    expect(en.demo.hero.body1).toMatch(/80 km/);
    expect(de.demo.hero.body1).toMatch(/80-km/);
  });
});
