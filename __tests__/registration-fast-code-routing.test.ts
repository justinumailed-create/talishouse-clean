import { describe, expect, it } from "vitest";
import {
  isValidSponsorTier,
  tierFromAccountType,
} from "@/lib/registration-fast-code-routing";

describe("tierFromAccountType", () => {
  it("recognizes root account labels", () => {
    expect(tierFromAccountType("root")).toBe("root");
    expect(tierFromAccountType("ROOT_ACCOUNT")).toBe("root");
    expect(tierFromAccountType("Root Account™")).toBe("root");
  });

  it("recognizes derivative and adpro labels", () => {
    expect(tierFromAccountType("derivative")).toBe("derivative");
    expect(tierFromAccountType("Derivative Account™")).toBe("derivative");
    expect(tierFromAccountType("ADPRO")).toBe("adpro");
  });

  it("returns null for empty values", () => {
    expect(tierFromAccountType(null)).toBeNull();
    expect(tierFromAccountType("")).toBeNull();
  });
});

describe("isValidSponsorTier", () => {
  it("allows root sponsors on root and derivative registration pages", () => {
    expect(isValidSponsorTier("root", "root")).toBe(true);
    expect(isValidSponsorTier("derivative", "root")).toBe(true);
  });

  it("allows derivative sponsors only on derivative registration pages", () => {
    expect(isValidSponsorTier("derivative", "derivative")).toBe(true);
    expect(isValidSponsorTier("root", "derivative")).toBe(false);
  });
});
