import { describe, expect, it } from "vitest";
import { isTalisprosMarketLayoutPath } from "../lib/talispros/market-pages";

describe("isTalisprosMarketLayoutPath", () => {
  it("treats Build My Mapsite™ and Have Rahul Build It as the same chrome", () => {
    expect(isTalisprosMarketLayoutPath("/talispros/markets/claim-a-market")).toBe(
      true,
    );
    expect(
      isTalisprosMarketLayoutPath("/talispros/build-mapsite/assisted"),
    ).toBe(true);
    expect(
      isTalisprosMarketLayoutPath("/talispros/build-mapsite/assisted/"),
    ).toBe(true);
  });

  it("does not apply market chrome to the self-serve build form", () => {
    expect(isTalisprosMarketLayoutPath("/talispros/build-mapsite")).toBe(false);
    expect(isTalisprosMarketLayoutPath("/talispros")).toBe(false);
    expect(isTalisprosMarketLayoutPath("/")).toBe(false);
  });
});
