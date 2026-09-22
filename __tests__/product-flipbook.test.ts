import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  topBoundRotateX,
  topBoundSheetAngle,
  TOP_BOUND_ROTATE_AXIS,
  TOP_BOUND_TRANSFORM_ORIGIN,
} from "../lib/product-flipbook/geometry";
import { loadProductFlipbookPages } from "../lib/product-flipbook/load-pages";
import {
  pagesFromFlipbookFiles,
  PRODUCT_FLIPBOOK_ASSET_TODO,
  PRODUCT_FLIPBOOK_PLACEHOLDER_PAGES,
  selectProductFlipbookFiles,
} from "../lib/product-flipbook/manifest";
import { isProductCataloguePath } from "../lib/product-flipbook/paths";

function readSource(relativePath: string) {
  return readFileSync(resolve(relativePath), "utf8");
}

describe("top-bound catalogue geometry", () => {
  it("turns a single sheet over the top edge, not a centerfold gutter", () => {
    expect(TOP_BOUND_ROTATE_AXIS).toBe("x");
    expect(TOP_BOUND_TRANSFORM_ORIGIN).toBe("top center");
    expect(topBoundRotateX(0)).toBe(0);
    expect(topBoundRotateX(0.5)).toBe(-90);
    expect(topBoundRotateX(1)).toBe(-180);
    expect(topBoundRotateX(-2)).toBe(0);
    expect(topBoundRotateX(Number.NaN)).toBe(0);
    expect(topBoundSheetAngle("next", "rest")).toBe(0);
    expect(topBoundSheetAngle("next", "turned")).toBe(-180);
    expect(topBoundSheetAngle("prev", "rest")).toBe(-180);
    expect(topBoundSheetAngle("prev", "turned")).toBe(0);
  });
});

describe("T-All page manifest", () => {
  it("keeps image rasters in natural order and drops the source pdf", () => {
    expect(
      selectProductFlipbookFiles([
        ".gitkeep",
        "page-10.webp",
        "notes.pdf",
        "page-2.jpg",
        "page-01.PNG",
      ]),
    ).toEqual(["page-01.PNG", "page-2.jpg", "page-10.webp"]);
  });

  it("maps files to one public page each", () => {
    expect(pagesFromFlipbookFiles(["page-02.webp", "page-01.webp"])).toEqual([
      {
        id: "page-01.webp",
        number: 1,
        src: "/product-flipbook/page-01.webp",
        alt: "T-All catalogue page 1",
      },
      {
        id: "page-02.webp",
        number: 2,
        src: "/product-flipbook/page-02.webp",
        alt: "T-All catalogue page 2",
      },
    ]);
  });

  it("reads a directory of page images", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "product-flipbook-"));
    fs.writeFileSync(path.join(dir, ".gitkeep"), "");
    fs.writeFileSync(path.join(dir, "T-All-Final.pdf"), "");
    fs.writeFileSync(path.join(dir, "page-03.webp"), "");
    fs.writeFileSync(path.join(dir, "page-01.webp"), "");
    expect(loadProductFlipbookPages(dir).map((page) => page.number)).toEqual([1, 2]);
    expect(loadProductFlipbookPages(dir).map((page) => page.src)).toEqual([
      "/product-flipbook/page-01.webp",
      "/product-flipbook/page-03.webp",
    ]);
  });

  it("ships placeholders and a TODO until T-All rasters are added", () => {
    expect(loadProductFlipbookPages()).toEqual([]);
    expect(PRODUCT_FLIPBOOK_PLACEHOLDER_PAGES.length).toBeGreaterThan(1);
    expect(PRODUCT_FLIPBOOK_PLACEHOLDER_PAGES.every((page) => page.src === null)).toBe(true);
    expect(PRODUCT_FLIPBOOK_ASSET_TODO).toContain("public/product-flipbook/page-01.webp");
    expect(PRODUCT_FLIPBOOK_ASSET_TODO).toContain("uploads/T-All-Final.pdf");
  });
});

describe("product catalogue route", () => {
  it("treats /catalogue and /catalog as the product flipbook", () => {
    expect(isProductCataloguePath("/catalogue")).toBe(true);
    expect(isProductCataloguePath("/catalogue/")).toBe(true);
    expect(isProductCataloguePath("/catalog")).toBe(true);
    expect(isProductCataloguePath("/catalog?product=glasshouse")).toBe(true);
    expect(isProductCataloguePath("/talishouse")).toBe(false);
    expect(isProductCataloguePath("/catalogue/extra")).toBe(false);
  });

  it("replaces the Talishouse product grid with the top-bound flipbook", () => {
    const catalogue = readSource("app/catalogue/page.tsx");
    const catalog = readSource("app/catalog/page.tsx");
    const viewer = readSource("components/product-flipbook/TopBoundFlipbook.tsx");
    expect(catalogue).toContain("TopBoundFlipbook");
    expect(catalogue).toContain("loadProductFlipbookPages");
    expect(catalogue).not.toContain("catalog-grid");
    expect(catalogue).not.toContain("Glasshouse");
    expect(catalogue).not.toContain("$58.50");
    expect(catalogue).not.toContain("talishouse-400");
    expect(catalog).toContain('redirect("/catalogue")');
    expect(catalog).not.toContain("catalog-grid");
    expect(viewer).toContain('data-binding="top"');
    expect(viewer).toContain("PRODUCT_FLIPBOOK_ASSET_TODO");
    expect(viewer).not.toContain("rotateY");
    expect(viewer).not.toContain("Glasshouse");
    expect(viewer).not.toContain("$58.50");
  });

  it("animates a top-edge rotateX and not a center fold", () => {
    const css = readSource("app/globals.css");
    const block = css.split("/* product-flipbook")[1] ?? "";
    expect(block.length).toBeGreaterThan(0);
    expect(block).toContain("transform-origin: top center");
    expect(block).toContain("rotateX(-180deg)");
    expect(block).toContain("product-flipbook-turn-next");
    expect(block).toContain("perspective-origin: 50% 0%");
    expect(block).not.toContain("rotateY");
  });

  it("drops Talishouse header, cart, and Talisbot on the product routes", () => {
    const shell = readSource("components/RootShell.tsx");
    expect(shell).toContain("isProductCataloguePath");
    expect(shell).toContain("productCatalogue");
    expect(shell).toMatch(/isEmbed[\s\S]*productCatalogue/);
    expect(shell).toMatch(/hideTalisBot[\s\S]*productCatalogue/);
  });

  it("keeps the sample viewer Product button on /catalogue", () => {
    const viewer = readSource("components/talisbooks/viewer/TalisBooksViewerShell.tsx");
    expect(viewer).toContain("ROUTES.CATALOG");
    expect(viewer).toMatch(/\n\s*Product\n/);
  });
});
