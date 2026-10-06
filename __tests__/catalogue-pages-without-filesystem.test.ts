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

const { loadCataloguePages } = await import("../lib/talisu/catalogue-pages");
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
    expect(pages).toHaveLength(PRODUCT_FLIPBOOK_PAGE_COUNT - 19);
    expect(pages[0]).toMatchObject({
      id: "page-20.webp",
      number: 1,
      sourcePage: 20,
      src: "/product-flipbook/page-20.webp",
      alt: "Talishouse™ Product Catalogue page 1",
    });
    expect(pages.some((page) => page.sourcePage < 20)).toBe(false);
    expect(pages.at(-1)).toMatchObject({
      id: "page-38.webp",
      number: PRODUCT_FLIPBOOK_PAGE_COUNT - 19,
      sourcePage: PRODUCT_FLIPBOOK_PAGE_COUNT,
      face: "webster",
      src: null,
      hotspots: [],
    });
    expect(pages[0].hotspots?.map((hotspot) => hotspot.code)).toEqual([
      "P01",
      "P02",
      "P03",
      "P04",
      "P05",
      "P06",
    ]);
    expect(pages[0].hotspots?.[0].href).toBe("/talisu/engage?product=P01");
  });
});
