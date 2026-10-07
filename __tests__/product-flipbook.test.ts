import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import {
  topBoundRotateX,
  topBoundSheetAngle,
  TOP_BOUND_ROTATE_AXIS,
  TOP_BOUND_TRANSFORM_ORIGIN,
} from "../lib/product-flipbook/geometry";
import { loadProductFlipbookPages } from "../lib/product-flipbook/load-pages";
import {
  pagesFromFlipbookFiles,
  PRODUCT_FLIPBOOK_ASSET_DIR,
  PRODUCT_FLIPBOOK_PAGE_COUNT,
  PRODUCT_FLIPBOOK_PAGE_FILES,
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
        sourcePage: 1,
        src: "/product-flipbook/page-01.webp",
        alt: "T-All catalogue page 1",
      },
      {
        id: "page-02.webp",
        number: 2,
        sourcePage: 2,
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

  it("loads every T-All Final page raster in order", () => {
    const pages = loadProductFlipbookPages();
    expect(pages).toHaveLength(PRODUCT_FLIPBOOK_PAGE_COUNT);
    expect(pages[0]).toMatchObject({
      id: "page-01.webp",
      number: 1,
      src: "/product-flipbook/page-01.webp",
      alt: "T-All catalogue page 1",
    });
    expect(pages.map((page) => page.src)).toEqual(
      Array.from({ length: PRODUCT_FLIPBOOK_PAGE_COUNT }, (_, index) => {
        const number = String(index + 1).padStart(2, "0");
        return `/product-flipbook/page-${number}.webp`;
      }),
    );
    expect(pages.every((page) => page.src)).toBe(true);
    const onDisk = selectProductFlipbookFiles(
      fs.readdirSync(path.join(process.cwd(), PRODUCT_FLIPBOOK_ASSET_DIR)),
    );
    expect([...PRODUCT_FLIPBOOK_PAGE_FILES]).toEqual(onDisk);
    expect(pages.map((page) => page.id)).toEqual(onDisk);
  });
});

describe("product catalogue route", () => {
  it("treats /catalogue as the product flipbook; /catalog is the e-commerce storefront", () => {
    expect(isProductCataloguePath("/catalogue")).toBe(true);
    expect(isProductCataloguePath("/catalogue/")).toBe(true);
    expect(isProductCataloguePath("/catalog")).toBe(false);
    expect(isProductCataloguePath("/catalog?product=glasshouse")).toBe(false);
    expect(isProductCataloguePath("/talishouse")).toBe(false);
    expect(isProductCataloguePath("/catalogue/extra")).toBe(false);
    expect(isProductCataloguePath("/catalogue/bookshelf")).toBe(true);
    expect(isProductCataloguePath("/catalogue/bookshelf/create")).toBe(true);
  });

  it("keeps the flipbook on /catalogue and the e-commerce product line on /catalog", () => {
    const catalogue = readSource("app/catalogue/page.tsx");
    const catalog = readSource("app/catalog/page.tsx");
    const viewer = readSource("components/product-flipbook/TopBoundFlipbook.tsx");
    expect(catalogue).toContain("TopBoundFlipbook");
    expect(catalogue).toContain("loadCataloguePages");
    expect(catalogue).not.toContain("catalog-grid");
    expect(catalogue).not.toContain("Glasshouse");
    expect(catalogue).not.toContain("$58.50");
    expect(catalogue).not.toContain("talishouse-400");
    expect(catalog).not.toContain('redirect("/catalogue")');
    expect(catalog).toContain("catalog-grid");
    expect(catalog).toContain("Glasshouse");
    expect(catalog).not.toContain("TopBoundFlipbook");
    expect(viewer).toContain('data-binding="top"');
    expect(viewer).not.toContain("PRODUCT_FLIPBOOK_ASSET_TODO");
    expect(viewer).not.toContain("product-flipbook__todo");
    expect(viewer).not.toContain("PRODUCT_FLIPBOOK_PLACEHOLDER_PAGES");
    expect(viewer).not.toContain("rotateY");
    expect(viewer).not.toContain("Glasshouse");
    expect(viewer).not.toContain("$58.50");
    expect(viewer).not.toContain("showSample");
    expect(viewer).not.toContain("Sample");
    expect(viewer).toContain("product-flipbook__header-tools");
    expect(viewer).toContain("showHeader");
    expect(viewer).toContain('data-header={showHeader ? "visible" : "hidden"}');
    expect(viewer).toContain('className="sr-only"');
    expect(viewer).not.toContain("product-flipbook__admin-link");
    expect(viewer).not.toContain("TalisprosMarketsDropdown");
    expect(viewer).not.toContain("Global Admin");
    expect(viewer).toContain("Bookshelf");
    expect(viewer).toContain("CATALOGUE_BOOKSHELF");
    expect(viewer).toContain("ROUTES.HOME");
    expect(viewer).not.toContain('href={ROUTES.TALISBOOKS}');
    expect(viewer).not.toContain('"/talisbooks"');
    expect(viewer).toContain('data-testid="catalogue-bookshelf-button"');
    expect(viewer).not.toContain("MAPSITE_APP_PATH");
    expect(catalogue).toContain("showHeader={false}");
    expect(catalogue).toContain('title="Catalogue"');
    expect(catalogue).not.toContain("eyebrow=");
    expect(catalogue).not.toContain("subtitle=");
    expect(catalogue).not.toContain("isAdminAuthenticated");
    expect(catalogue).not.toContain("showSample");

    const gate = readSource("components/talispros/TalisprosGatePage.tsx");
    const corner = readSource("components/talispros/TalisprosHomeCornerLinks.tsx");
    const marketsDropdown = readSource(
      "components/talispros/TalisprosMarketsDropdown.tsx",
    );
    expect(gate).toContain("TalisprosHomeCornerLinks");
    // Left column, after the gate — TalisBOT slot only (no Markets/Global Admin under it).
    expect(gate).toMatch(/TalisprosHomeGate[\s\S]*TalisprosHomeCornerLinks/);
    expect(corner).toContain('data-testid="home-corner-links"');
    expect(corner).toContain('id={HOME_TALISBOT_SLOT_ID}');
    expect(corner).toContain('data-testid="home-talisbot-slot"');
    expect(corner).not.toContain("home-markets-block");
    expect(corner).not.toContain("home-global-admin-link");
    expect(corner).not.toContain("t.home.corner.globalAdmin");
    expect(corner).not.toContain("t.home.corner.markets");
    expect(corner).not.toContain("t.home.segments");
    expect(corner).not.toContain("TALISPROS_MARKET_OPTIONS");
    expect(corner).not.toContain("ROUTES.ADMIN_DASHBOARD");
    expect(corner).not.toContain("TalisprosMarketsDropdown");
    expect(corner).not.toContain("menuDirection");
    expect(corner).not.toContain("right-4");
    expect(corner).not.toContain("fixed ");
    expect(corner).not.toContain("isAdminAuthenticated");
    // Navbar / market-page Markets dropdown still works as before.
    expect(marketsDropdown).not.toContain("menuDirection");
    expect(marketsDropdown).not.toContain("opensUp");
    expect(marketsDropdown).toContain("top-full");
    expect(marketsDropdown).toContain("TALISPROS_MARKET_OPTIONS");
    expect(marketsDropdown).toContain("t.home.corner.markets");
  });

  it("animates a top-edge rotateX and not a center fold", () => {
    const css = readSource("components/product-flipbook/top-bound-flipbook.css");
    expect(css).toContain("transform-origin: top center");
    expect(css).toContain("rotateX(-180deg)");
    expect(css).toContain("product-flipbook-turn-next");
    expect(css).toContain("perspective-origin: 50% 0%");
    expect(css).not.toContain("rotateY");
    expect(css).toContain('data-header="hidden"');
    expect(css).toContain("100dvh - 9rem");
    const viewer = readSource("components/product-flipbook/TopBoundFlipbook.tsx");
    expect(viewer).toContain("top-bound-flipbook.css");
  });

  it("drops Talishouse header, cart, and Talisbot on the product routes", () => {
    const shell = readSource("components/RootShell.tsx");
    expect(shell).toContain("isProductCataloguePath");
    expect(shell).toContain("productCatalogue");
    expect(shell).toMatch(/isEmbed[\s\S]*productCatalogue/);
    expect(shell).toMatch(/hideTalisBot[\s\S]*productCatalogue/);
    const catalogueLayout = readSource(
      "components/catalogue/CatalogueLayoutClient.tsx",
    );
    expect(catalogueLayout).toContain("TalisUMktsHeader");
    expect(catalogueLayout).toContain("/catalogue/bookshelf");
  });

  it("keeps the sample viewer Product button on /catalogue", () => {
    const viewer = readSource("components/talisbooks/viewer/TalisBooksViewerShell.tsx");
    expect(viewer).toContain("ROUTES.CATALOG");
    expect(viewer).toContain("{tv.product}");
    expect(en.viewer.product).toBe("Product");
  });
});
