import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";
import { defaultHomePinLocationValues } from "../components/build-mapsite/home-pin-types";
import {
  DEMO_ADDRESS_INPUT_ID,
  demoTitleFromAddress,
  hasDemoPinChoice,
} from "../lib/talispros/demo-builder";

const read = (p: string) => readFileSync(resolve(p), "utf8");
const builder = read("components/talispros/demo-mapsite/DemoMapSiteBuilderClient.tsx");
const section = read("components/build-mapsite/HomePinLocationSection.tsx");
const demoBranch = section.slice(section.indexOf("if (isDemo) {"), section.indexOf('<div className="space-y-6">'));

describe("Demo Mapsite builder redesign (Ralf, Oct 26)", () => {
  it("renders ONE card with numbered steps and a single Places address box", () => {
    expect(demoBranch).toContain('data-testid="demo-builder-card"');
    expect(demoBranch).toContain("step={1}");
    expect(demoBranch).toContain("step={2}");
    expect(builder).toContain(">\n                    3\n");
    expect(demoBranch).toContain("<GoogleAddressInput");
    expect(demoBranch).toContain("onPlaceSelected={handleGooglePlaceSelected}");
    expect(demoBranch.match(/<GoogleAddressInput/g)).toHaveLength(1);
    // The old separate name box is gone.
    expect(builder).not.toContain("demo-home-pin-name");
    expect(demoBranch).toContain("lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)]");
  });

  it("replaces Lat/Lng inputs with a read-only coordinates line; manual placement still works", () => {
    expect(demoBranch).not.toContain("coordinateInputs");
    expect(demoBranch).not.toContain("demo-geo-coordinates");
    expect(demoBranch).toContain('data-testid="demo-pin-coordinates"');
    expect(demoBranch).toContain("onLocationChange={handleLocationChange}");
    expect(demoBranch).toContain("values.manualPlacement");
  });

  it("never triggers native required popups; validates only on Continue", () => {
    // Oct 26: no form at all (iCloud AutoFill fix); Continue is a plain button.
    expect(builder).not.toContain("<form");
    expect(builder).toContain("onClick={handleContinue}");
    expect(demoBranch).not.toMatch(/\brequired\b/);
    expect(builder).toContain("onClick={revealBuilder}");
    expect(builder).not.toContain("form={DEMO_FORM_ID}");
    expect(builder).toContain('data-testid="demo-inline-error"');
    expect(builder).toContain("d.errPlacePin");
    const cta = read("components/talispros/WorkingPageCtaLink.tsx");
    expect(cta).toContain('type={onClick ? "button" : "submit"}');
  });

  it("the pill reveals the card, then smooth-scrolls to and focuses Step 1's address box", () => {
    expect(builder).toContain("document.getElementById(DEMO_ADDRESS_INPUT_ID)");
    expect(builder).toContain('behavior: reduceMotion ? "auto" : "smooth"');
    expect(builder).toContain("input.focus({ preventScroll: true })");
    expect(demoBranch).toContain("id={addressInputId}");
    expect(DEMO_ADDRESS_INPUT_ID).toBe("demo-home-location-street");
  });

  it("the PIN page has no Download Demo PDF and no next-step note; Continue is just Continue", () => {
    expect(builder).not.toContain("DemoDownloadMenu");
    expect(builder).not.toContain("nextNote");
    expect(builder).not.toContain("demo-next-note");
    expect(en.demo.continue).toBe("Continue");
    expect(de.demo.continue).toBe("Weiter");
    expect(JSON.stringify(en)).not.toContain("Next, build the demonstration Talisbook");
    expect(JSON.stringify(de)).not.toContain("Als Nächstes erstellen Sie das Demonstrations-Talisbook");
  });

  it("the demo eBook page carries the intro, the no-FAST-Code note and the Download Demo PDF menu", () => {
    const ebook = read("components/talispros/demo-mapsite/DemoEbookGenerateClient.tsx");
    expect(ebook).toContain("DemoDownloadMenu");
    expect(ebook).toContain('variant="secondary"');
    expect(read("components/talispros/demo-mapsite/DemoDownloadMenu.tsx")).toContain('variant === "secondary"');
    expect(ebook).toContain("demoCopy.ebookIntro}");
    expect(ebook).toContain("demoCopy.ebookIntroNote}");
    expect(ebook.indexOf('data-testid="demo-ebook-intro"')).toBeLessThan(ebook.indexOf("cardClass} space-y-3"));
    expect(en.demo.ebookIntro).toBe(
      "Just before we build your own Mapsite, let's curate your property in a demo Talisbook™. Pick the eBook pages that tell its story best, because they're what prospects will see once your Mapsite goes live.",
    );
    expect(en.demo.ebookIntroNote).toBe("This is a demo, so no FAST Code is issued.");
    expect(ebook).toContain("copy.footer}");
    expect(en.demo.ebookPage.footer).toBe(
      "Page 1 becomes the wrap cover, and the remaining pages become the inside pages.",
    );
    expect(de.demo.ebookPage.footer).toBe(
      "Seite 1 wird zum Umschlag, die übrigen Seiten werden zu den Innenseiten.",
    );
    for (const dev of ["upload-image", "Storage is used", "pinned interior assets", "Optimizing"]) {
      expect(ebook).not.toContain(dev);
    }
    for (const dev of ["upload-image", "Storage", "interior", "pinned", "Optimiz"]) {
      expect(JSON.stringify(en.demo.ebookPage)).not.toContain(dev);
    }
    expect(de.demo.ebookIntro).toContain("Demo-Talisbook™");
    expect(de.demo.ebookIntroNote).toContain("kein FAST Code");
    // SEO / OG of the eBook page are untouched: still the shared EN/DE page metadata.
    expect(read("app/talispros/demo-mapsite/ebook/page.tsx")).toContain('pageMetadata("/talispros/demo-mapsite/ebook")');
  });

  it("needs an address or a moved PIN; derives the title from the address", () => {
    expect(hasDemoPinChoice(defaultHomePinLocationValues)).toBe(false);
    expect(hasDemoPinChoice({ ...defaultHomePinLocationValues, streetAddress: "1 Queen St W, Toronto" })).toBe(true);
    expect(hasDemoPinChoice({ ...defaultHomePinLocationValues, latitude: "43.65", longitude: "-79.38" })).toBe(true);
    expect(demoTitleFromAddress("1 Queen St W, Toronto, ON, Canada")).toBe("1 Queen St W");
    expect(demoTitleFromAddress("")).toBe("");
    expect(builder).toContain("demoTitleFromAddress(streetAddress) || DEMO_FALLBACK_TITLE");
  });

  it("has EN + DE copy for every step and never marks Mapsite with ™", () => {
    const keys = [
      "addressPlaceholder",
      "addressLookupUnavailable",
      "step2Title",
      "step2Hint",
      "coordsLabel",
      "manualPlacement",
      "nearby",
      "errPlacePin",
      "ebookIntro",
      "ebookIntroNote",
    ] as const;
    for (const key of keys) {
      expect(en.demo[key]).toBeTruthy();
      expect(de.demo[key]).toBeTruthy();
      expect(en.demo[key]).not.toMatch(/Mapsite™/);
      expect(de.demo[key]).not.toMatch(/Mapsite™/);
    }
    expect(en.demo.ebookIntro).toContain("Mapsite");
  });
});
