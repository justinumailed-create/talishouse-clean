import { describe, expect, it } from "vitest";
import {
  isTalisbooksFastShelfPath,
  shouldShowTalisbooksMarketingHeader,
} from "@/lib/talisbooks/marketing-chrome";

describe("Talisbooks™ marketing header on TEB shelves", () => {
  it("hides the Talisbooks product label on FAST-code shelves", () => {
    expect(isTalisbooksFastShelfPath("/talisbooks/fast/lg01")).toBe(true);
    expect(shouldShowTalisbooksMarketingHeader("/talisbooks/fast/lg01")).toBe(
      false,
    );
    expect(shouldShowTalisbooksMarketingHeader("/talisbooks/fast/rd02")).toBe(
      false,
    );
    expect(
      shouldShowTalisbooksMarketingHeader("/talisbooks/fast/lg01?from=pin"),
    ).toBe(false);
  });

  it("keeps the product label on unrelated Talisbooks pages", () => {
    expect(shouldShowTalisbooksMarketingHeader("/talisbooks")).toBe(true);
    expect(shouldShowTalisbooksMarketingHeader("/talisbooks/settings")).toBe(
      true,
    );
    expect(isTalisbooksFastShelfPath("/talisbooks/fastest")).toBe(false);
  });

  it("still hides viewer, editor, and dashboard chrome", () => {
    expect(
      shouldShowTalisbooksMarketingHeader(
        "/talisbooks/viewer/lg01-lg01-talisbook-ts9i",
      ),
    ).toBe(false);
    expect(shouldShowTalisbooksMarketingHeader("/talisbooks/editor")).toBe(
      false,
    );
    expect(shouldShowTalisbooksMarketingHeader("/talisbooks/dashboard")).toBe(
      false,
    );
  });
});
