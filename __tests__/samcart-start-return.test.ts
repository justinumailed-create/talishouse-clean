import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isSamCartPaymentReturn,
  parseSamCartReturnParams,
  SAMCART_SUCCESS_RETURN_PATH,
  SAMCART_SUCCESS_RETURN_URL,
  samcartExternalOrderKey,
} from "@/lib/talispros/samcart-return";
import {
  hideSecondInteriorListingUrls,
  listingHeroImageUrl,
} from "@/lib/talispros/mapsite-listing-media";

const root = process.cwd();

describe("SamCart → /start return", () => {
  it("documents the SamCart Custom URL success redirect", () => {
    expect(SAMCART_SUCCESS_RETURN_PATH).toBe("/start");
    expect(SAMCART_SUCCESS_RETURN_URL).toContain(
      "https://www.talispros.com/start?orderid=##orderid##&email=##email##",
    );
  });

  it("detects typical SamCart orderid / email query params", () => {
    const params = parseSamCartReturnParams({
      orderid: "8674655",
      email: "Buyer@Example.com",
    });
    expect(isSamCartPaymentReturn(params)).toBe(true);
    expect(params.orderId).toBe("8674655");
    expect(params.email).toBe("buyer@example.com");
    expect(
      isSamCartPaymentReturn(parseSamCartReturnParams({ foo: "bar" })),
    ).toBe(false);
  });

  it("keys unverified SamCart orders for payment rows", () => {
    expect(samcartExternalOrderKey("123")).toBe("samcart:123");
    expect(samcartExternalOrderKey("samcart:123")).toBe("samcart:123");
  });

  it("wires /start gate + return banner (not homepage)", () => {
    const startPage = readFileSync(join(root, "app/start/page.tsx"), "utf8");
    const gate = readFileSync(
      join(root, "components/talispros/TalisprosGatePage.tsx"),
      "utf8",
    );
    const home = readFileSync(
      join(root, "components/talispros/TalisprosStartPage.tsx"),
      "utf8",
    );
    expect(startPage).toContain("TalisprosGatePage");
    expect(gate).toContain("TalisprosHomeGate");
    expect(gate).not.toContain("TalisprosHomeShowcase");
    expect(gate).toContain("TalisprosSamCartReturnBanner");
    expect(home).toContain("TalisprosHomeMapPreview");
    expect(home).toContain("TalisprosStartSidebar");
    expect(home).not.toContain("TalisprosHomeGate");
  });
});

describe("paid ebook pin hero shift (hide 2nd interior)", () => {
  it("makes former page 3 the new pin hero after payment", () => {
    const urls = [
      "https://cdn.example/page-1.webp",
      "https://cdn.example/page-2.webp",
      "https://cdn.example/page-3.webp",
      "https://cdn.example/page-4.webp",
    ];
    expect(listingHeroImageUrl(urls)).toBe("https://cdn.example/page-2.webp");
    expect(listingHeroImageUrl(urls, { hideSecondInterior: true })).toBe(
      "https://cdn.example/page-3.webp",
    );
    expect(hideSecondInteriorListingUrls(urls)).toEqual([
      "https://cdn.example/page-1.webp",
      "https://cdn.example/page-3.webp",
      "https://cdn.example/page-4.webp",
    ]);
  });
});
