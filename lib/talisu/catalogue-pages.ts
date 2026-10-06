import { loadProductFlipbookPages } from "@/lib/product-flipbook/load-pages";
import type { ProductFlipbookPage } from "@/lib/product-flipbook/manifest";
import {
  CATALOGUE_DESIGN_IDEAS_SOURCE_PAGE,
  catalogueProductLabel,
  catalogueProductRegisterHref,
  catalogueProductsForSourcePage,
} from "@/lib/talisu/catalogue-products";

/**
 * Source page 38 (`page-38.webp`) is the closing portrait. The catalogue
 * replaces that raster with Webster's HTML sheet. It stays page 19 of 19
 * and carries no product hotspots, so P01–P108 are unchanged.
 */
export const CATALOGUE_WEBSTER_SOURCE_PAGE = 38;

/**
 * Talishouse™ Product Catalogue pages for /catalogue: opens on Design Ideas
 * (source page 20); earlier source pages are trimmed in data, and each
 * design block carries its P-code hotspot → /talisu/engage?product=Pxx.
 *
 * The page image list comes from the bundled flipbook manifest, not a
 * request-time read of `public/product-flipbook`.
 */
export function loadCataloguePages(directory?: string): ProductFlipbookPage[] {
  return loadProductFlipbookPages(directory, {
    startPage: CATALOGUE_DESIGN_IDEAS_SOURCE_PAGE,
  }).map((page) => {
    const alt = `Talishouse™ Product Catalogue page ${page.number}`;
    if (page.sourcePage === CATALOGUE_WEBSTER_SOURCE_PAGE) {
      return {
        ...page,
        alt,
        face: "webster",
        src: null,
        hotspots: [],
      };
    }
    return {
      ...page,
      alt,
      hotspots: catalogueProductsForSourcePage(page.sourcePage).map((product) => ({
        code: product.code,
        href: catalogueProductRegisterHref(product.code),
        label: catalogueProductLabel(product),
        rect: product.rect,
      })),
    };
  });
}
