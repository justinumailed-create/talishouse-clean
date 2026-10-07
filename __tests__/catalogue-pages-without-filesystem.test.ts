import { describe, expect, it, vi } from "vitest";

/**
 * Vercel serves `public/` from the CDN and does not mount it inside the
 * serverless function. A request-time `fs.readdir` of that folder throws,
 * and the catalogue loader used to turn that into an empty book
 * ("Page 1 of 0"). This mock is that environment.
 */
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  const readdirSync = () => {
    const error = new Error(
      "ENOENT: public/product-flipbook is not in the serverless bundle",
    ) as NodeJS.ErrnoException;
    error.code = "ENOENT";
    throw error;
  };
  const mocked = { ...actual, readdirSync };
  return { ...mocked, default: mocked };
});

const {
  loadCataloguePages,
  CATALOGUE_TDOME_PAGE_ID,
  CATALOGUE_TDOME_SRC,
  CATALOGUE_HIDDEN_CONTENT_PAGES,
} = await import("../lib/talisu/catalogue-pages");
const { PRODUCT_FLIPBOOK_PAGE_COUNT } = await import("../lib/product-flipbook/manifest");

describe("Catalogue page list without a readable public directory", () => {
  it("is non-empty when public/ cannot be read at request time", async () => {
    const fs = await import("node:fs");
    let readdirThrew = false;
    try {
      fs.readdirSync("/tmp");
    } catch {
      readdirThrew = true;
    }
    expect(readdirThrew).toBe(true);
    const pages = loadCataloguePages();
    expect(pages.length).toBeGreaterThan(0);
    // Front + T-Dome + source 20–37 (2–19 hidden) + back
    const hiddenCount =
      CATALOGUE_HIDDEN_CONTENT_PAGES.to - CATALOGUE_HIDDEN_CONTENT_PAGES.from + 1;
    expect(pages).toHaveLength(PRODUCT_FLIPBOOK_PAGE_COUNT + 1 - hiddenCount);
    expect(pages[0]).toMatchObject({
      id: "page-01.webp",
      number: 0,
      sourcePage: 1,
      role: "front",
      src: "/product-flipbook/page-01.webp",
      alt: "Talishouse™ Product Catalogue front cover",
    });
    expect(pages[1]).toMatchObject({
      id: CATALOGUE_TDOME_PAGE_ID,
      number: 1,
      role: "content",
      src: CATALOGUE_TDOME_SRC,
    });
    expect(pages.some((page) => page.face === "webster")).toBe(false);
    expect(pages.at(-1)).toMatchObject({
      id: "page-38.webp",
      number: 0,
      sourcePage: PRODUCT_FLIPBOOK_PAGE_COUNT,
      role: "back",
      src: "/product-flipbook/page-38.webp",
      hotspots: [],
    });
    const design = pages.find((page) => page.sourcePage === 20);
    expect(design?.hotspots?.map((hotspot) => hotspot.code)).toEqual([
      "P01",
      "P02",
      "P03",
      "P04",
      "P05",
      "P06",
    ]);
    expect(design?.hotspots?.[0].href).toBe("/talisu/engage?product=P01");
  });
});
