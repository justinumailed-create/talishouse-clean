import { loadProductFlipbookPages } from "@/lib/product-flipbook/load-pages";
import type { ProductFlipbookPage } from "@/lib/product-flipbook/manifest";
import {
  catalogueProductLabel,
  catalogueProductRegisterHref,
  catalogueProductsForSourcePage,
} from "@/lib/talisu/catalogue-products";
import { CATALOGUE_SPECS } from "@/lib/talisu/catalogue-specs";
import { TALISU_ENGAGE } from "@/lib/talisu/content";

/** Source PDF page 1 — Talishouse™ Product Catalogue front cover. */
export const CATALOGUE_FRONT_SOURCE_PAGE = 1;

/**
 * Source page 38 is the closing leaf. It renders as the HTML closing page
 * (`face: "webster"`): Thorsten P's photo, page buttons and the down-payment
 * CTA, instead of the uploaded raster.
 */
export const CATALOGUE_BACK_SOURCE_PAGE = 38;

/** Closing-page photo: Thorsten P (same portrait as /talisu/engage). */
export const CATALOGUE_CLOSING_PHOTO_SRC = TALISU_ENGAGE.partnerImage;

/**
 * Synthetic first content leaves (not in T-All Final.pdf): Ralf's spec sheets,
 * Oct 17 2026 — T-House, updated T-Dome (replaces the old dome raster), G-House.
 * Photo is an image; the spec panel is HTML so prices read in CAD.
 */
export const CATALOGUE_SPEC_PAGE_IDS = CATALOGUE_SPECS.map((spec) => spec.id);

/** T-Dome leaf id (kept for callers); now the HTML spec sheet. */
export const CATALOGUE_TDOME_PAGE_ID = "t-dome";

/** Updated T-Dome photo (Ralf, Oct 17 2026). */
export const CATALOGUE_TDOME_SRC = "/talisu/catalogue/spec-tdome.webp";

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
 *   → Back cover = closing page (Thorsten P + page buttons + CTA)
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

  const specSheets: ProductFlipbookPage[] = CATALOGUE_SPECS.map((spec, index) => ({
    id: spec.id,
    number: index + 1,
    sourcePage: 0,
    src: spec.photo,
    alt: `Talishouse™ ${spec.name} — Product Catalogue page ${index + 1}`,
    role: "content",
    face: "spec",
    specId: spec.id,
    hotspots: [],
  }));

  const middle: ProductFlipbookPage[] = middleRasters
    .map((page) =>
      withHotspots({
        ...page,
        // Source page N is content page N (spec sheets occupy pages 1–3; 2–19 stay hidden).
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
    src: CATALOGUE_CLOSING_PHOTO_SRC,
    alt: "Talishouse™ Product Catalogue back cover — Thorsten P",
    face: "webster",
    hotspots: [],
  };

  return [front, ...specSheets, ...middle, back];
}
