import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { loadProductFlipbookPages } from "../lib/product-flipbook/load-pages";
import {
  pagesFromFlipbookFiles,
  PRODUCT_FLIPBOOK_PAGE_COUNT,
} from "../lib/product-flipbook/manifest";
import {
  CATALOGUE_BACK_SOURCE_PAGE,
  CATALOGUE_FRONT_SOURCE_PAGE,
  CATALOGUE_TDOME_PAGE_ID,
  CATALOGUE_TDOME_SRC,
  loadCataloguePages,
  CATALOGUE_HIDDEN_CONTENT_PAGES,
} from "../lib/talisu/catalogue-pages";
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

describe("Catalogue start page (front cover → T-Dome page 1)", () => {
  it("keeps Design Ideas at source page 20 for hotspot layout", () => {
    expect(CATALOGUE_DESIGN_IDEAS_SOURCE_PAGE).toBe(20);
    expect(CATALOGUE_DESIGN_IDEAS_PAGE_TITLE).toBe("Design suggestions");
    expect(CATALOGUE_FRONT_SOURCE_PAGE).toBe(1);
    expect(CATALOGUE_BACK_SOURCE_PAGE).toBe(38);
  });

  it("still supports startPage trimming on the raw flipbook loader", () => {
    const files = ["page-01.webp", "page-02.webp", "page-03.webp", "page-04.webp"];
    const pages = pagesFromFlipbookFiles(files, { startPage: 3 });
    expect(pages.map((p) => [p.id, p.number, p.sourcePage])).toEqual([
      ["page-03.webp", 1, 3],
      ["page-04.webp", 2, 4],
    ]);
  });

  it("opens on the front cover with T-Dome as content page 1 and uploaded back cover", () => {
    const all = loadProductFlipbookPages();
    const pages = loadCataloguePages();
    expect(all).toHaveLength(PRODUCT_FLIPBOOK_PAGE_COUNT);
    // Front + T-Dome + source 20–37 (pages 2–19 hidden) + back = 21 leaves
    const hiddenCount =
      CATALOGUE_HIDDEN_CONTENT_PAGES.to - CATALOGUE_HIDDEN_CONTENT_PAGES.from + 1;
    expect(CATALOGUE_HIDDEN_CONTENT_PAGES).toEqual({ from: 2, to: 19 });
    expect(pages).toHaveLength(PRODUCT_FLIPBOOK_PAGE_COUNT + 1 - hiddenCount);
    expect(pages[0]).toMatchObject({
      id: "page-01.webp",
      number: 0,
      sourcePage: 1,
      role: "front",
      src: "/product-flipbook/page-01.webp",
    });
    expect(pages[1]).toMatchObject({
      id: CATALOGUE_TDOME_PAGE_ID,
      number: 1,
      sourcePage: 0,
      role: "content",
      src: CATALOGUE_TDOME_SRC,
      hotspots: [],
    });
    // Next leaf after T-Dome is Design Ideas (page 20); pages 2–19 are omitted
    expect(pages[2]).toMatchObject({
      id: "page-20.webp",
      number: 20,
      sourcePage: 20,
      role: "content",
    });
    expect(
      pages.some(
        (p) =>
          p.role === "content" &&
          p.number >= CATALOGUE_HIDDEN_CONTENT_PAGES.from &&
          p.number <= CATALOGUE_HIDDEN_CONTENT_PAGES.to,
      ),
    ).toBe(false);
    const design = pages.find((p) => p.sourcePage === 20);
    expect(design).toMatchObject({
      id: "page-20.webp",
      number: 20,
      role: "content",
      src: "/product-flipbook/page-20.webp",
    });
    expect(pages.at(-1)).toMatchObject({
      id: "page-38.webp",
      number: 0,
      sourcePage: 38,
      role: "back",
      src: "/product-flipbook/page-38.webp",
      hotspots: [],
    });
    expect(pages.at(-1)?.face).toBeUndefined();
    expect(pages.some((p) => p.face === "webster")).toBe(false);
  });

  it("renders /catalogue through the flipbook with the full-book loader and no purchase embed", () => {
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
    expect(CATALOGUE_PRODUCTS[0]).toMatchObject({ code: "P01", sourcePage: 20, cataloguePage: 20, slot: 1 });
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
    const design = pages.find((p) => p.sourcePage === 20);
    expect(design?.hotspots?.map((h) => h.code)).toEqual([
      "P01",
      "P02",
      "P03",
      "P04",
      "P05",
      "P06",
    ]);
    expect(design?.hotspots?.[0].href).toBe("/talisu/engage?product=P01");
    expect(design?.face).toBeUndefined();
    const closing = pages.at(-1);
    expect(CATALOGUE_BACK_SOURCE_PAGE).toBe(38);
    expect(closing).toMatchObject({
      id: "page-38.webp",
      number: 0,
      sourcePage: 38,
      role: "back",
      src: "/product-flipbook/page-38.webp",
      hotspots: [],
    });
    expect(closing?.face).toBeUndefined();
    const lastDesign = pages.find((p) => p.sourcePage === 37);
    expect(lastDesign?.hotspots?.map((h) => h.code)).toEqual([
      "P103",
      "P104",
      "P105",
      "P106",
      "P107",
      "P108",
    ]);
    const total = pages.reduce((n, p) => n + (p.hotspots?.length ?? 0), 0);
    expect(total).toBe(108);
    const viewer = read("components/product-flipbook/TopBoundFlipbook.tsx");
    expect(viewer).toContain("CatalogueHotspots");
    expect(viewer).toContain("left: `${spot.rect.x}%`");
    expect(viewer).toContain("event.stopPropagation()");
    // Page X of N / Front / Back indicator is hidden in the flipbook toolbar.
    expect(viewer).not.toContain("product-flipbook__count");
    expect(viewer).not.toContain("pageLabel");
    expect(en.catalogueUi.front).toBe("Front");
    expect(en.catalogueUi.back).toBe("Back");
    expect(en.catalogueUi.customizeDesign).toBe("Customize a design");
    expect(en.nav.registerMenu.product).toBe("Product Options");
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
    expect(page).toContain("t.engageCustomizing");
    expect(en.talisu.engageCustomizing).toBe("Customizing:");
    expect(page).toContain("catalogueProductCheckoutUrl");
    expect(page).toContain("src={checkoutUrl}");
  });
});
