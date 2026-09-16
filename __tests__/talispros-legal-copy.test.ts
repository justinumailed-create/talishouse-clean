import { describe, expect, it } from "vitest";
import {
  TALISPROS_HOME_PRODUCTS,
  TALISPROS_LEGAL_PRIMARY_COPY,
  TALISPROS_LEGAL_SECONDARY_COPY,
} from "../lib/talispros/start-content";
import {
  MAPSITE_FLAG_IDENTITY_DEFAULT,
  parseMapsiteFlagIdentity,
  resolveMapsiteFlagIdentity,
} from "../lib/talispros/flag-identity";

describe("Talispros legal copy and homepage products", () => {
  it("keeps the exact shared legal strings", () => {
    expect(TALISPROS_LEGAL_PRIMARY_COPY).toBe(
      "Differentiate locally and develop a real estate adjacent marketing platform by using Mapsites™️ that promote qualifying inventory.*",
    );
    expect(TALISPROS_LEGAL_SECONDARY_COPY).toBe("Some Limitations apply");
  });

  it("rotates the existing G-House, T-House, and T-Dome product images", () => {
    expect(TALISPROS_HOME_PRODUCTS.map((product) => product.label)).toEqual([
      "G-House",
      "T-House",
      "T-Dome",
    ]);
    expect(TALISPROS_HOME_PRODUCTS.map((product) => product.imageSrc)).toEqual([
      "/talisbooks/templates/rm22/products/g-house.jpg",
      "/talisbooks/templates/rm22/products/t-house.jpg",
      "/talisbooks/templates/rm22/products/t-dome.jpg",
    ]);
  });
});

describe("Choose for Flag", () => {
  it("defaults to Address and forces Address for FSBO", () => {
    expect(MAPSITE_FLAG_IDENTITY_DEFAULT).toBe("address");
    expect(parseMapsiteFlagIdentity(undefined)).toBe("address");
    expect(parseMapsiteFlagIdentity("name")).toBe("name");
    expect(
      resolveMapsiteFlagIdentity({ preference: "name", accountType: "derivative" }),
    ).toBe("name");
    expect(
      resolveMapsiteFlagIdentity({ preference: "name", accountType: "fsbo" }),
    ).toBe("address");
  });
});
