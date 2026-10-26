import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";
import {
  DEMO_ADDRESS_INPUT_ID,
  DEMO_ADDRESS_INPUT_NAME,
  DEMO_HERO_SLIDES,
  demoBuilderStartsOpen,
  demoInitialPinFromParams,
} from "../lib/talispros/demo-builder";

const read = (p: string) => readFileSync(resolve(p), "utf8");
const builder = read("components/talispros/demo-mapsite/DemoMapSiteBuilderClient.tsx");
const slides = read("components/talispros/demo-mapsite/DemoMapsiteSlides.tsx");
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
    expect(builder).toContain('data-testid="demo-hero-build"');
    expect(builder.match(/onClick={revealBuilder}/g)).toHaveLength(2);
    expect(builder).toContain("frame = window.requestAnimationFrame(focusAddressBox)");
    expect(builder).toContain("url.searchParams.set(DEMO_BUILD_QUERY");
    expect(builder).toContain('addEventListener("popstate"');
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

  it("crossfades 3-5 live Mapsite screenshots (no flipbook) and respects reduced motion", () => {
    expect(DEMO_HERO_SLIDES.length).toBeGreaterThanOrEqual(3);
    expect(DEMO_HERO_SLIDES.length).toBeLessThanOrEqual(5);
    for (const src of DEMO_HERO_SLIDES) {
      expect(src).toMatch(/^\/talispros\/demo-slides\/mapsite-example-\d\.webp$/);
      const file = resolve("public" + src);
      expect(existsSync(file)).toBe(true);
      expect(statSync(file).size).toBeGreaterThan(20_000);
    }
    expect(slides).toContain("transition-opacity");
    expect(slides).toContain("prefers-reduced-motion: reduce");
    expect(slides).not.toMatch(/import .*flipbook|rotateX|rotateY/i);
    // Redaction is in the files, not CSS overlays.
    expect(slides).not.toMatch(/backdrop-blur|blur-|filter:/i);
  });

  it("stacks the slides above the write-up on mobile, two columns on desktop", () => {
    expect(builder).toContain("lg:grid-cols-2");
    expect(builder.indexOf("<DemoMapsiteSlides")).toBeLessThan(builder.indexOf("{d.hero.headline}"));
    const css = read("app/globals.css");
    expect(css).toContain(".demo-hero__media {\n  height: 15rem;");
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

  it("has EN + DE hero copy; Mapsite never carries ™, Talisbook™ always does", () => {
    for (const dict of [en, de]) {
      const hero = dict.demo.hero;
      for (const value of Object.values(hero)) {
        expect(value).toBeTruthy();
        expect(value).not.toMatch(/Mapsite™/);
      }
      expect(hero.body1).toMatch(/80/);
      expect(hero.body2).toContain("Talisbook™");
      expect(hero.slideAlt).toContain("{n}");
      expect(hero.slideAlt).toContain("{total}");
    }
    expect(en.demo.hero.body2).toContain("couple of minutes");
    expect(de.demo.hero.body2).toContain("paar Minuten");
  });
});
