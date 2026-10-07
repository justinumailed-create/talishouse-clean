import { loadProductFlipbookPages } from "@/lib/product-flipbook/load-pages";
import type { ProductFlipbookPage } from "@/lib/product-flipbook/manifest";
import {
  catalogueProductLabel,
  catalogueProductRegisterHref,
  catalogueProductsForSourcePage,
} from "@/lib/talisu/catalogue-products";

/** Source PDF page 1 — Talishouse™ Product Catalogue front cover. */
export const CATALOGUE_FRONT_SOURCE_PAGE = 1;

/**
 * Uploaded closing raster (`page-38.webp`). Kept as the back cover; not
 * replaced by the Webster HTML sheet.
 */
export const CATALOGUE_BACK_SOURCE_PAGE = 38;

/** Synthetic first content leaf — T-Dome product sheet (not in T-All Final.pdf). */
export const CATALOGUE_TDOME_PAGE_ID = "t-dome";

export const CATALOGUE_TDOME_SRC =
  "/talisu/catalogue/t-dome.jpg";

/**
 * Inclusive content-page range omitted from the public flipbook (toolbar +
 * navigation). T-Dome stays page 1; Design Ideas pages 20–37 keep their numbers.
 */
export const CATALOGUE_HIDDEN_CONTENT_PAGES = {
  from: 2,
  to: 19,
} as const;

/**
 * Talishouse™ Product Catalogue for /catalogue:
 *   Front cover (source page 1)
 *   → Page 1 = T-Dome
 *   → source pages 20–37 (Design Ideas / hotspots P01–P108); pages 2–19 hidden
 *   → Back cover = uploaded source page 38
 *
 * Opens on the front cover (not mid-book Design Ideas). Page list comes from
 * the bundled flipbook manifest, not a request-time read of public/.
 * Hidden pages are dropped from the leaf list (not CSS-hidden) so they are
 * not navigable.
 */
export function loadCataloguePages(directory?: string): ProductFlipbookPage[] {
  const rasters = loadProductFlipbookPages(directory);
  if (rasters.length === 0) return [];

  const frontRaster = rasters[0];
  const backRaster = rasters[rasters.length - 1];
  const middleRasters = rasters.slice(1, -1);

  const withHotspots = (page: ProductFlipbookPage): ProductFlipbookPage => ({
    ...page,
    alt: `Talishouse™ Product Catalogue page ${page.number}`,
    hotspots: catalogueProductsForSourcePage(page.sourcePage).map((product) => ({
      code: product.code,
      href: catalogueProductRegisterHref(product.code),
      label: catalogueProductLabel(product),
      rect: product.rect,
    })),
  });

  const front: ProductFlipbookPage = {
    ...frontRaster,
    number: 0,
    role: "front",
    alt: "Talishouse™ Product Catalogue front cover",
    hotspots: [],
  };

  const tDome: ProductFlipbookPage = {
    id: CATALOGUE_TDOME_PAGE_ID,
    number: 1,
    sourcePage: 0,
    src: CATALOGUE_TDOME_SRC,
    alt: "Talishouse™ T-Dome — Product Catalogue page 1",
    role: "content",
    hotspots: [],
  };

  const middle: ProductFlipbookPage[] = middleRasters
    .map((page) =>
      withHotspots({
        ...page,
        // Source page N is content page N (T-Dome occupies content page 1).
        number: page.sourcePage,
        role: "content",
      }),
    )
    .filter(
      (page) =>
        page.number < CATALOGUE_HIDDEN_CONTENT_PAGES.from ||
        page.number > CATALOGUE_HIDDEN_CONTENT_PAGES.to,
    );

  const back: ProductFlipbookPage = {
    ...backRaster,
    number: 0,
    role: "back",
    alt: "Talishouse™ Product Catalogue back cover",
    hotspots: [],
  };

  return [front, tDome, ...middle, back];
}
