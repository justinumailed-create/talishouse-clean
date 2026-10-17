import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  MANDATORY_PIN_CATEGORIES,
  filterPinsByCategory,
  normalizeCustomPinCategories,
  parsePinCategory,
  pinCategoryLabel,
  pinCategoryOptions,
} from "@/lib/talispros/mapsite-pin-categories";
import {
  derivativeNeedsRoot,
  partnerRelation,
  rootOfDerivative,
  rootPartnerAddError,
} from "@/lib/talispros/mapsite-root-partners";
import { MAPSITE_DASHBOARD_MENU_ITEMS } from "@/lib/talispros/mapsite-owner-customizations";
import { en } from "@/lib/i18n/dictionaries/en";
import { de } from "@/lib/i18n/dictionaries/de";

const read = (p: string) => readFileSync(p, "utf8");

describe("PIN categories (Ralf, Oct 17)", () => {
  it("has the five mandatory categories with Ralf's descriptions", () => {
    expect(MANDATORY_PIN_CATEGORIES.map((c) => c.label.en)).toEqual([
      "Residential",
      "Vacant Land",
      "Investment",
      "Commercial",
      "Luxury",
    ]);
    expect(MANDATORY_PIN_CATEGORIES[0].description.en).toBe("For detached, standalone houses.");
    expect(MANDATORY_PIN_CATEGORIES[2].description.en).toBe(
      "For multi-family units, fixer-uppers, or properties expected to increase in value through subdivision.",
    );
    expect(MANDATORY_PIN_CATEGORIES[4].description.en).toBe(
      "For high-end properties featuring premium price tags and elite amenities.",
    );
  });

  it("caps custom categories at five, dedupes and drops mandatory clashes", () => {
    expect(
      normalizeCustomPinCategories([" Waterfront ", "waterfront", "Luxury", "A", "B", "C", "D", "E"]),
    ).toEqual(["Waterfront", "A", "B", "C", "D"]);
  });

  it("builds options and validates values", () => {
    const options = pinCategoryOptions(["Waterfront"], "de");
    expect(options).toHaveLength(6);
    expect(options[0].label).toBe("Wohnimmobilien");
    expect(options[5]).toMatchObject({ value: "custom:Waterfront", custom: true });
    expect(parsePinCategory("luxury", [])).toBe("luxury");
    expect(parsePinCategory("custom:waterfront", ["Waterfront"])).toBe("custom:Waterfront");
    expect(parsePinCategory("custom:Nope", ["Waterfront"])).toBeUndefined();
    expect(parsePinCategory("", [])).toBeNull();
    expect(pinCategoryLabel("vacant-land")).toBe("Vacant Land");
  });

  it("filters PINs: empty selection shows every PIN", () => {
    const pins = [
      { id: "a", category: "luxury" },
      { id: "b", category: null },
      { id: "c", category: "commercial" },
    ];
    expect(filterPinsByCategory(pins, "")).toHaveLength(3);
    expect(filterPinsByCategory(pins, "luxury").map((p) => p.id)).toEqual(["a"]);
  });
});

describe("Root ↔ Derivative Partner Mapsites", () => {
  const link = { id: "1", fastCodeA: "dc05", fastCodeB: "dc06", rootFastCode: "dc06" };

  it("knows each side of a Root link", () => {
    expect(partnerRelation(link, "dc06")).toBe("derivative");
    expect(partnerRelation(link, "dc05")).toBe("root");
    expect(partnerRelation({ ...link, rootFastCode: null }, "dc05")).toBe("partner");
    expect(rootOfDerivative([link], "DC05")).toBe("dc06");
    expect(rootOfDerivative([link], "dc06")).toBeNull();
  });

  it("rejects Roots, unknown codes and Derivatives of another Root", () => {
    const base = {
      rootFastCode: "dc06",
      candidateFastCode: "dc05",
      candidateExists: true,
      candidateRole: "other" as const,
      candidateRoot: null,
      alreadyLinked: false,
    };
    expect(rootPartnerAddError(base)).toBeNull();
    expect(rootPartnerAddError({ ...base, candidateExists: false })).toMatch(/No Mapsite/);
    expect(rootPartnerAddError({ ...base, candidateRole: "root" })).toMatch(/Root Account/);
    expect(rootPartnerAddError({ ...base, candidateRoot: "lrg1" })).toMatch(/another Root/);
    expect(rootPartnerAddError({ ...base, candidateFastCode: "DC06" })).toMatch(/own partner/);
    expect(derivativeNeedsRoot("derivative", null)).toBe(true);
    expect(derivativeNeedsRoot("derivative", "dc06")).toBe(false);
    expect(derivativeNeedsRoot("other", null)).toBe(false);
  });

  it("adds PIN Categories + Partner Mapsites to the owner dashboard (EN + DE)", () => {
    expect(MAPSITE_DASHBOARD_MENU_ITEMS.map((i) => i.id)).toEqual(
      expect.arrayContaining(["categories", "partners"]),
    );
    expect(en.mapsite.dashboardMenu.partners).toBe("Partner Mapsites");
    expect(de.mapsite.dashboardMenu.partners).toBe("Partner-Mapsites");
    expect(en.mapsite.leftCard.selectCategory).toBe("Select Category");
    expect(de.mapsite.leftCard.selectCategory).toBe("Kategorie wählen");
    expect(JSON.stringify(en.mapsite)).not.toMatch(/Show all PINs/);
  });

  it("migration 109 enforces one Root per Derivative and backfills DC06", () => {
    const sql = read("supabase/migrations/109_pin_categories_root_partners.sql");
    expect(sql).toMatch(/derivative_fast_code/);
    expect(sql).toMatch(/create unique index if not exists mapsite_partner_links_one_root_per_derivative/);
    expect(sql).toMatch(/set root_fast_code = 'dc06'/);
    expect(sql).toMatch(/cardinality\(custom_categories\) <= 5/);
  });

  it("left card renders the category filter and no 'all' PIN option", () => {
    const card = read("components/talispros/mapsite/MapSiteMarketPartnerCard.tsx");
    expect(card).toContain('data-testid="mapsite-category-filter"');
    const app = read("components/talispros/mapsite/MapSiteApplication.tsx");
    expect(app).not.toContain('id: "all"');
    expect(app).toContain("rootContext.partnerPins");
  });
});
