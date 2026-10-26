import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CATALOGUE_SPECS,
  CATALOGUE_SPEC_SERVICES,
  catalogueSpecPrice,
} from "../lib/talisu/catalogue-specs";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";

describe("Ralf Oct 17 catalogue spec sheets", () => {
  it("has T-House, T-Dome and G-House with CAD prices (never a bare $)", () => {
    expect(CATALOGUE_SPECS.map((s) => s.id)).toEqual(["t-house", "t-dome", "g-house"]);
    const labels = { from: en.catalogueUi.specFrom, perSqft: en.catalogueUi.specPerSqft };
    expect(CATALOGUE_SPECS.map((s) => catalogueSpecPrice(s, labels))).toEqual([
      "From CAD 150 / sq.ft.",
      "From CAD 150 / sq.ft.",
      "From CAD 100 / sq.ft.",
    ]);
    const src = readFileSync(resolve("lib/talisu/catalogue-specs.ts"), "utf8");
    expect(src).not.toMatch(/\$\d/);
    expect(CATALOGUE_SPEC_SERVICES.en).toHaveLength(8);
    expect(CATALOGUE_SPEC_SERVICES.de).toHaveLength(8);
    for (const spec of CATALOGUE_SPECS) {
      expect(spec.rooms.de).toHaveLength(spec.rooms.en.length);
      expect(spec.notes.de).toHaveLength(spec.notes.en.length);
    }
  });

  it("Catalogue says Plan your Project (Webster → /talisu/engage); Mapsites says Register a Mapsite (Aisha → /talisu/reg)", () => {
    const catalogue = readFileSync(resolve("app/catalogue/page.tsx"), "utf8");
    expect(catalogue).toContain("ROUTES.TALISU_ENGAGE");
    expect(catalogue).toContain("WEBSTER_AVATAR_SRC");
    expect(en.catalogueUi.planProject).toBe("Plan your Project");
    expect(de.catalogueUi.planProject).toBeTruthy();
    expect(en.catalogueUi.mapsitesHeadline).toBe(
      "Every registered Market has a semi-exclusive protected Market Zone of 80 kilometres around a home pin",
    );
    const builder = readFileSync(
      resolve("components/talispros/demo-mapsite/DemoMapSiteBuilderClient.tsx"),
      "utf8",
    );
    expect(builder).toContain("AISHA_AVATAR_SRC");
    // Ralf (Oct 18): one line + "Build Mapsite Demo" (Aisha) on top; the
    // bottom "Register a Mapsite" CTA is gone.
    expect(builder).toContain('testId="mapsites-build-demo-link"');
    expect(builder).not.toContain('data-testid="mapsites-register-cta"');
  });
});
