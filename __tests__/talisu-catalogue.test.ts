import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadProductFlipbookPages } from "../lib/product-flipbook/load-pages";
import {
  pagesFromFlipbookFiles,
  PRODUCT_FLIPBOOK_PAGE_COUNT,
} from "../lib/product-flipbook/manifest";
import { loadCataloguePages } from "../lib/talisu/catalogue-pages";
import {
  buildCatalogueProducts,
  CATALOGUE_DESIGN_IDEAS_PAGE_TITLE,
  CATALOGUE_DESIGN_IDEAS_SOURCE_PAGE,
  CATALOGUE_PRODUCTS,
  catalogueProductCheckoutUrl,
  catalogueProductRegisterHref,
  findCatalogueProduct,
  formatCatalogueProductCode,
  normalizeCatalogueProductCode,
} from "../lib/talisu/catalogue-products";
import { TALISU_MKTS_HEADER_NAV } from "../lib/talisu/markets-pins";

const read = (p: string) => readFileSync(resolve(p), "utf8");

describe("Catalogue nav item", () => {
  it("sits right after Bookshelf and before Register", () => {
    const labels = TALISU_MKTS_HEADER_NAV.map((i) => i.label);
    expect(labels).toEqual(["Markets", "Bookshelf", "Catalogue", "Register"]);
    expect(TALISU_MKTS_HEADER_NAV[2]).toEqual({ href: "/catalogue", label: "Catalogue" });
    const header = read("components/talisu/TalisUMktsHeader.tsx");
    const bookshelf = header.indexOf('item.label === "Bookshelf"');
    const catalogue = header.indexOf('(item) => item.label === "Catalogue"');
    const register = header.indexOf("<RegisterNavDropdown");
    expect(catalogue).toBeGreaterThan(bookshelf);
    expect(register).toBeGreaterThan(catalogue);
  });
});

describe("Catalogue start page (Design Ideas)", () => {
  it("opens on source page 20 — the first Design suggestions page", () => {
    expect(CATALOGUE_DESIGN_IDEAS_SOURCE_PAGE).toBe(20);
    expect(CATALOGUE_DESIGN_IDEAS_PAGE_TITLE).toBe("Design suggestions");
  });

  it("trims earlier pages in data and renumbers from 1", () => {
    const files = ["page-01.webp", "page-02.webp", "page-03.webp", "page-04.webp"];
    const pages = pagesFromFlipbookFiles(files, { startPage: 3 });
    expect(pages.map((p) => [p.id, p.number, p.sourcePage])).toEqual([
      ["page-03.webp", 1, 3],
      ["page-04.webp", 2, 4],
    ]);
  });

  it("loads the real catalogue starting at page-20 with 19 pages hidden", () => {
    const all = loadProductFlipbookPages();
    const pages = loadCataloguePages();
    expect(all).toHaveLength(PRODUCT_FLIPBOOK_PAGE_COUNT);
    expect(pages).toHaveLength(PRODUCT_FLIPBOOK_PAGE_COUNT - 19);
    expect(pages[0]).toMatchObject({
      id: "page-20.webp",
      number: 1,
      sourcePage: 20,
      src: "/product-flipbook/page-20.webp",
    });
    expect(pages.some((p) => p.sourcePage < 20)).toBe(false);
    expect(pages.map((p) => p.number)).toEqual(pages.map((_, i) => i + 1));
  });

  it("renders /catalogue through the flipbook with the trimmed loader and no purchase embed", () => {
    const page = read("app/catalogue/page.tsx");
    expect(page).toContain("loadCataloguePages");
    expect(page).toContain("TopBoundFlipbook");
    expect(page).not.toContain("SamCart");
    expect(page).not.toContain("purchase");
  });
});

describe("Catalogue product numbering", () => {
  it("formats P01…P99 then P100+", () => {
    expect(formatCatalogueProductCode(1)).toBe("P01");
    expect(formatCatalogueProductCode(9)).toBe("P09");
    expect(formatCatalogueProductCode(10)).toBe("P10");
    expect(formatCatalogueProductCode(60)).toBe("P60");
    expect(formatCatalogueProductCode(99)).toBe("P99");
    expect(formatCatalogueProductCode(100)).toBe("P100");
    expect(formatCatalogueProductCode(101)).toBe("P101");
  });

  it("numbers every design block in reading order from Design Ideas", () => {
    expect(CATALOGUE_PRODUCTS).toHaveLength(108);
    expect(CATALOGUE_PRODUCTS[0]).toMatchObject({ code: "P01", sourcePage: 20, cataloguePage: 1, slot: 1 });
    expect(CATALOGUE_PRODUCTS[6]).toMatchObject({ code: "P07", sourcePage: 21, slot: 1 });
    expect(CATALOGUE_PRODUCTS.at(-1)).toMatchObject({ code: "P108", sourcePage: 37, slot: 6 });
    CATALOGUE_PRODUCTS.forEach((p, i) => {
      expect(p.code).toBe(formatCatalogueProductCode(i + 1));
      expect(p.rect.x).toBeGreaterThanOrEqual(0);
      expect(p.rect.y).toBeGreaterThanOrEqual(0);
      expect(p.rect.x + p.rect.w).toBeLessThanOrEqual(100);
      expect(p.rect.y + p.rect.h).toBeLessThanOrEqual(100);
    });
    expect(new Set(CATALOGUE_PRODUCTS.map((p) => p.code)).size).toBe(108);
  });

  it("renumbers automatically when blocks are edited", () => {
    const rect = { x: 1, y: 1, w: 1, h: 1 };
    const products = buildCatalogueProducts(
      [
        { sourcePage: 21, blocks: [rect] },
        { sourcePage: 20, blocks: [rect, { ...rect, title: "Kiosk" }] },
      ],
      20,
    );
    expect(products.map((p) => [p.code, p.sourcePage, p.title])).toEqual([
      ["P01", 20, "Talishouse™ design suggestion"],
      ["P02", 20, "Kiosk"],
      ["P03", 21, "Talishouse™ design suggestion"],
    ]);
  });

  it("attaches clickable hotspots linking to Product registration", () => {
    const pages = loadCataloguePages();
    expect(pages[0].hotspots?.map((h) => h.code)).toEqual(["P01", "P02", "P03", "P04", "P05", "P06"]);
    expect(pages[0].hotspots?.[0].href).toBe("/talisu/engage?product=P01");
    expect(pages.at(-1)?.hotspots).toEqual([]);
    const total = pages.reduce((n, p) => n + (p.hotspots?.length ?? 0), 0);
    expect(total).toBe(108);
    const viewer = read("components/product-flipbook/TopBoundFlipbook.tsx");
    expect(viewer).toContain("CatalogueHotspots");
    expect(viewer).toContain("left: `${spot.rect.x}%`");
    expect(viewer).toContain("event.stopPropagation()");
  });
});

describe("Engage page product param", () => {
  it("validates codes against the product list", () => {
    expect(normalizeCatalogueProductCode("p7")).toBe("P07");
    expect(normalizeCatalogueProductCode(" P007 ")).toBe("P07");
    expect(normalizeCatalogueProductCode("X07")).toBeNull();
    expect(findCatalogueProduct("P07")?.code).toBe("P07");
    expect(findCatalogueProduct(["P100", "P01"])?.code).toBe("P100");
    expect(findCatalogueProduct("P999")).toBeNull();
    expect(findCatalogueProduct("P00")).toBeNull();
    expect(findCatalogueProduct("<script>")).toBeNull();
    expect(findCatalogueProduct(undefined)).toBeNull();
    expect(catalogueProductRegisterHref("P07")).toBe("/talisu/engage?product=P07");
  });

  it("passes the product code into the SamCart checkout URL", () => {
    const base = "https://talispros.mysamcart.com/checkout/custom";
    expect(catalogueProductCheckoutUrl(base, null)).toBe(base);
    expect(catalogueProductCheckoutUrl(base, { code: "P07" })).toBe(
      `${base}?product=P07&utm_content=P07`,
    );
  });

  it("shows Customizing: on /talisu/engage and embeds the product checkout", () => {
    const page = read("app/talisu/engage/page.tsx");
    expect(page).toContain("findCatalogueProduct(params.product)");
    expect(page).toContain("Customizing:");
    expect(page).toContain("catalogueProductCheckoutUrl");
    expect(page).toContain("src={checkoutUrl}");
  });
});
