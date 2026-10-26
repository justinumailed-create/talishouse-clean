import { describe, expect, it } from "vitest";
import { catalogueProductCheckoutUrl, findCatalogueProduct } from "../lib/talisu/catalogue-products";
import {
  engageLockedHref,
  engageLockReason,
  engagePayHref,
  engageProductsCheckoutUrl,
  normalizeEngageLockReason,
  parseEngageProducts,
  resolveEngageStructure,
} from "../lib/talisu/engage-lock";
import { REGISTER_STRUCTURE_COOKIE } from "../lib/talisu/register-structure";

const base = "https://talispros.mysamcart.com/checkout/custom";

describe("Engage lock helpers", () => {
  it("reads the structure from ?structure= first, then Aisha's cookie, and validates both", () => {
    expect(REGISTER_STRUCTURE_COOKIE).toBe("talisu_reg_structure");
    expect(resolveEngageStructure("tokenization", "conventional")).toBe("tokenization");
    expect(resolveEngageStructure(undefined, "conventional")).toBe("conventional");
    expect(resolveEngageStructure("nonsense", "lease-to-own")).toBe("lease-to-own");
    expect(resolveEngageStructure("SPLITS", null)).toBe("lease-to-own");
    expect(resolveEngageStructure("https://evil.example", "<script>")).toBeNull();
    expect(resolveEngageStructure(undefined, undefined)).toBeNull();
  });

  it("parses comma-separated / repeated design codes, drops unknown ones, de-duplicates", () => {
    expect(parseEngageProducts("P03,P07").map((p) => p.code)).toEqual(["P03", "P07"]);
    expect(parseEngageProducts(["p07", "P03,P07", "P999", "<x>"]).map((p) => p.code)).toEqual(["P07", "P03"]);
    expect(parseEngageProducts(undefined)).toEqual([]);
    expect(parseEngageProducts("")).toEqual([]);
  });

  it("locks on the structure first, then on the design", () => {
    expect(engageLockReason(null, [])).toBe("structure");
    expect(engageLockReason(null, ["P07"])).toBe("structure");
    expect(engageLockReason("tokenization", [])).toBe("design");
    expect(engageLockReason("tokenization", ["P999"])).toBe("design");
    expect(engageLockReason("tokenization", ["P03", "P07"])).toBeNull();
    expect(normalizeEngageLockReason("Design")).toBe("design");
    expect(normalizeEngageLockReason("evil")).toBeNull();
  });

  it("builds the single pay link and the bounce link with readable comma-joined codes", () => {
    expect(engagePayHref(["P03", "P07"], "fractionalization")).toBe(
      "/talisu/engage?step=pay&structure=fractionalization&product=P03,P07",
    );
    expect(engagePayHref(["P07"], "splits")).toBe("/talisu/engage?step=pay&structure=lease-to-own&product=P07");
    expect(engageLockedHref("structure", ["P07"], null)).toBe("/talisu/engage?locked=structure&product=P07");
    expect(engageLockedHref("design", [], "conventional")).toBe("/talisu/engage?locked=design&structure=conventional");
  });

  it("tags SamCart with every design in the existing product / utm_content keys", () => {
    const p03 = findCatalogueProduct("P03")!;
    const p07 = findCatalogueProduct("P07")!;
    // One design: identical to the existing single-product tagging.
    expect(engageProductsCheckoutUrl(base, [p07])).toBe(catalogueProductCheckoutUrl(base, p07));
    const url = new URL(engageProductsCheckoutUrl(base, [p03, p07]));
    expect(url.searchParams.getAll("product")).toEqual(["P03,P07"]);
    expect(url.searchParams.getAll("utm_content")).toEqual(["P03,P07"]);
    expect(engageProductsCheckoutUrl(base, [])).toBe(base);
  });
});
