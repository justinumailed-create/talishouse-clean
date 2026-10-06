import { loadProductFlipbookPages } from "@/lib/product-flipbook/load-pages";
import type { ProductFlipbookPage } from "@/lib/product-flipbook/manifest";
import {
  CATALOGUE_DESIGN_IDEAS_SOURCE_PAGE,
  catalogueProductLabel,
  catalogueProductRegisterHref,
  catalogueProductsForSourcePage,
} from "@/lib/talisu/catalogue-products";

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
  }).map((page) => ({
    ...page,
    alt: `Talishouse™ Product Catalogue page ${page.number}`,
    hotspots: catalogueProductsForSourcePage(page.sourcePage).map((product) => ({
      code: product.code,
      href: catalogueProductRegisterHref(product.code),
      label: catalogueProductLabel(product),
      rect: product.rect,
    })),
  }));
}
