import { describe, expect, it } from "vitest";
import { createDemoViewerBook } from "../lib/talisbooks/viewer";
import {
  TALISBOOKS_MAXIMUM_PAGE_COUNT,
  TALISBOOKS_MINIMUM_PAGE_COUNT,
} from "../lib/talisbooks/page-rules/constants";
import { MAPSITE_DEMO_LOCATION } from "../lib/mapsite/demo-location";

describe("Sample E-Book demo book", () => {
  const book = createDemoViewerBook();

  it("uses the sample-ebook slug and TEB title", () => {
    expect(book.slug).toBe("sample-ebook");
    expect(book.title).toBe("Sample E-Book");
  });

  it("stays within official 12–22 page bounds", () => {
    expect(book.pages.length).toBeGreaterThanOrEqual(TALISBOOKS_MINIMUM_PAGE_COUNT);
    expect(book.pages.length).toBeLessThanOrEqual(TALISBOOKS_MAXIMUM_PAGE_COUNT);
    expect(book.pages).toHaveLength(16);
  });

  it("follows cover → brokerage → property → closing structure", () => {
    expect(book.pages[0]?.pageRole).toBe("cover");
    expect(book.pages[1]?.pageRole).toBe("agent_brokerage");
    expect(book.pages[2]?.layout).toBe("maps");
    expect(book.pages[2]?.pageRole).toBe("property_content");
    expect(book.pages.slice(3, -1).every((page) => page.pageRole === "property_content")).toBe(
      true,
    );
    expect(book.pages.at(-1)?.pageRole).toBe("agent_brokerage");
  });

  it("places the demo Mapsite PIN on page 3", () => {
    const mapPage = book.pages[2]!;
    expect(mapPage.address).toBe(MAPSITE_DEMO_LOCATION.streetAddress);
    expect(mapPage.latitude).toBe(MAPSITE_DEMO_LOCATION.latitude);
    expect(mapPage.longitude).toBe(MAPSITE_DEMO_LOCATION.longitude);
  });

  it("uses the demo Mapsite address on the cover", () => {
    expect(book.pages[0]?.address).toBe(MAPSITE_DEMO_LOCATION.streetAddress);
    expect(book.subtitle).toBe(MAPSITE_DEMO_LOCATION.streetAddress);
  });

  it("wires real sample photo assets onto cover and interiors", () => {
    expect(book.pages[0]?.heroImageUrl).toContain("/talisbooks/sample/clean/cover.jpg");
    const propertyPages = book.pages.filter(
      (page) => page.pageRole === "property_content" && page.layout !== "maps",
    );
    expect(propertyPages.length).toBeGreaterThan(0);
    expect(propertyPages.every((page) => Boolean(page.heroImageUrl))).toBe(true);
  });

  it("includes Ralf Meyer contact on brokerage pages", () => {
    const intro = book.pages[1]!;
    expect(intro.agentName).toBe("Ralf Meyer");
    expect(intro.agentPhone).toBe("902-317-2223");
    expect(intro.agentEmail).toBe("remecom@mac.com");
  });

  it("joins centerfolds with one continuous spread image and one caption", () => {
    const left = book.pages.find((page) => page.layout === "centerfold_left");
    const right = book.pages.find((page) => page.layout === "centerfold_right");
    expect(left?.spreadImageUrl).toBeTruthy();
    expect(left?.spreadImageUrl).toBe(right?.spreadImageUrl);
    expect(left?.title).toBe("");
    expect(left?.body).toBeUndefined();
    expect(right?.title).toBeTruthy();
    expect(right?.body).toBeTruthy();
  });
});
