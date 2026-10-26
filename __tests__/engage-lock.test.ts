import { describe, expect, it } from "vitest";
import { catalogueProductCheckoutUrl, findCatalogueProduct } from "../lib/talisu/catalogue-products";
import {
  engageLockedHref,
  engageLockReason,
  engagePayHref,
  engageProductsCheckoutUrl,
  normalizeEngageLockReason,
  parseEngageProducts,
} from "../lib/talisu/engage-lock";

const base = "https://talispros.mysamcart.com/checkout/custom";

describe("Engage lock helpers", () => {
  it("parses comma-separated / repeated design codes, drops unknown ones, de-duplicates", () => {
    expect(parseEngageProducts("P03,P07").map((p) => p.code)).toEqual(["P03", "P07"]);
    expect(parseEngageProducts(["p07", "P03,P07", "P999", "<x>"]).map((p) => p.code)).toEqual(["P07", "P03"]);
    expect(parseEngageProducts(undefined)).toEqual([]);
    expect(parseEngageProducts("")).toEqual([]);
  });

  it("locks only on the design (Oct 26: no structure condition for Thorsten)", () => {
    expect(engageLockReason([])).toBe("design");
    expect(engageLockReason(["P999"])).toBe("design");
    // A design with no structure anywhere is enough.
    expect(engageLockReason(["P01"])).toBeNull();
    expect(engageLockReason(["P03", "P07"])).toBeNull();
    expect(normalizeEngageLockReason("Design")).toBe("design");
    expect(normalizeEngageLockReason("structure")).toBeNull();
    expect(normalizeEngageLockReason("evil")).toBeNull();
  });

  it("builds the single pay link and the bounce link without any structure", () => {
    expect(engagePayHref(["P03", "P07"])).toBe("/talisu/engage?step=pay&product=P03,P07");
    expect(engagePayHref(["P01"])).toBe("/talisu/engage?step=pay&product=P01");
    expect(engageLockedHref("design")).toBe("/talisu/engage?locked=design");
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
