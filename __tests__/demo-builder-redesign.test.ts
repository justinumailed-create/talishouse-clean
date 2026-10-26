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
    expect(builder).toContain("noValidate");
    expect(demoBranch).not.toMatch(/\brequired\b/);
    expect(builder).toContain("onClick={focusAddressBox}");
    expect(builder).not.toContain("form={DEMO_FORM_ID}");
    expect(builder).toContain('data-testid="demo-inline-error"');
    expect(builder).toContain("d.errPlacePin");
    const cta = read("components/talispros/WorkingPageCtaLink.tsx");
    expect(cta).toContain('type={onClick ? "button" : "submit"}');
  });

  it("the pill smooth-scrolls to and focuses Step 1's address box", () => {
    expect(builder).toContain("document.getElementById(DEMO_ADDRESS_INPUT_ID)");
    expect(builder).toContain('behavior: reduceMotion ? "auto" : "smooth"');
    expect(builder).toContain("input.focus({ preventScroll: true })");
    expect(demoBranch).toContain("id={addressInputId}");
    expect(DEMO_ADDRESS_INPUT_ID).toBe("demo-home-pin-address");
  });

  it("Download Demo PDF is a quiet secondary button inside the card", () => {
    expect(builder).toContain('variant="secondary"');
    expect(read("components/talispros/demo-mapsite/DemoDownloadMenu.tsx")).toContain('variant === "secondary"');
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
      "nextNote",
    ] as const;
    for (const key of keys) {
      expect(en.demo[key]).toBeTruthy();
      expect(de.demo[key]).toBeTruthy();
      expect(en.demo[key]).not.toMatch(/Mapsite™/);
      expect(de.demo[key]).not.toMatch(/Mapsite™/);
    }
    expect(en.demo.nextNote).toContain("No FAST Code is issued.");
    expect(de.demo.nextNote).toContain("Es wird kein FAST Code vergeben.");
  });
});
