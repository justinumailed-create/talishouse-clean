/**
 * Talishouse™ Product Catalogue — Design Ideas products + clickable hotspots.
 *
 * The public Catalogue (/catalogue) is a full book: front cover → T-Dome as
 * content page 1 → source pages 20–37 (pages 2–19 hidden) → uploaded back
 * cover (source page 38). Design suggestions (source pages 20–37) keep
 * P01–P108 hotspots; they are no longer the opening spread.
 *
 * Every design block is a product, numbered in reading order
 * (page by page, left→right, top→bottom): P01 … P99, P100, P101 …
 *
 * EDITING: rects are percentages of the page image (1920×1080 rasters),
 * measured from the page images (thumbnail grid detection). To move, add or
 * remove a block, edit `CATALOGUE_DESIGN_PAGES` below; codes renumber
 * automatically. Add `title` to a block to show it on the Register page.
 */

/** Source page number (1-based) of the first "Design suggestions" page. */
export const CATALOGUE_DESIGN_IDEAS_SOURCE_PAGE = 20;

/** Title printed on the Design Ideas pages of T-All Final.pdf. */
export const CATALOGUE_DESIGN_IDEAS_PAGE_TITLE = "Design suggestions";

export const CATALOGUE_PATH = "/catalogue";

/** Product registration page (Webster — Customization Partner). */
export const CATALOGUE_PRODUCT_REGISTER_PATH = "/talisu/engage";

/** Query param carrying the product code to the Register (Product) page. */
export const CATALOGUE_PRODUCT_PARAM = "product";

export type CatalogueRect = {
  /** Left edge, % of page width. */
  x: number;
  /** Top edge, % of page height. */
  y: number;
  /** Width, % of page width. */
  w: number;
  /** Height, % of page height. */
  h: number;
};

export type CatalogueBlock = CatalogueRect & { title?: string };

export type CatalogueDesignPage = {
  /** 1-based page number in T-All Final.pdf / public/product-flipbook/page-NN. */
  sourcePage: number;
  blocks: CatalogueBlock[];
};

export type CatalogueProduct = {
  code: string;
  /** 1-based page in T-All Final.pdf. */
  sourcePage: number;
  /** 1-based content page in the Catalogue (T-Dome = 1; source N → page N). */
  cataloguePage: number;
  /** 1-based block position on its page. */
  slot: number;
  rect: CatalogueRect;
  title: string;
};

/**
 * Standard Design suggestions layout: 3 columns × 2 rows.
 * Measured on pages 20–37 (px on 1920×1080): columns x=186/707/1239,
 * rows y=286/625, block ≈ 474×269.
 */
const COLS = [9.69, 36.82, 64.53] as const;
const ROWS = [26.48, 57.87] as const;
const BLOCK_W = 24.69;
const BLOCK_H = 24.91;

export const CATALOGUE_GRID_3X2: readonly CatalogueRect[] = ROWS.flatMap((y) =>
  COLS.map((x) => ({ x, y, w: BLOCK_W, h: BLOCK_H })),
);

function grid(): CatalogueBlock[] {
  return CATALOGUE_GRID_3X2.map((rect) => ({ ...rect }));
}

/**
 * Design Ideas pages with product blocks, in reading order.
 * Source page 38 (closing portrait) has no product blocks.
 */
export const CATALOGUE_DESIGN_PAGES: CatalogueDesignPage[] = [
  { sourcePage: 20, blocks: grid() },
  { sourcePage: 21, blocks: grid() },
  { sourcePage: 22, blocks: grid() },
  { sourcePage: 23, blocks: grid() },
  { sourcePage: 24, blocks: grid() },
  { sourcePage: 25, blocks: grid() },
  { sourcePage: 26, blocks: grid() },
  { sourcePage: 27, blocks: grid() },
  { sourcePage: 28, blocks: grid() },
  { sourcePage: 29, blocks: grid() },
  { sourcePage: 30, blocks: grid() },
  { sourcePage: 31, blocks: grid() },
  { sourcePage: 32, blocks: grid() },
  { sourcePage: 33, blocks: grid() },
  { sourcePage: 34, blocks: grid() },
  { sourcePage: 35, blocks: grid() },
  { sourcePage: 36, blocks: grid() },
  { sourcePage: 37, blocks: grid() },
];

/** P01 … P09, P10 … P99, P100, P101 … */
export function formatCatalogueProductCode(index: number): string {
  const n = Math.max(1, Math.floor(index));
  return `P${String(n).padStart(2, "0")}`;
}

/** Normalizes "p7", " P07 " → "P07"; null when not a P-code shape. */
export function normalizeCatalogueProductCode(
  value: string | string[] | null | undefined,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return null;
  const match = /^p0*(\d+)$/i.exec(raw.trim());
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isSafeInteger(n) || n < 1) return null;
  return formatCatalogueProductCode(n);
}

export function buildCatalogueProducts(
  pages: CatalogueDesignPage[] = CATALOGUE_DESIGN_PAGES,
  /** Content-page offset: source page N maps to catalogue page N when 1. */
  startPage = 1,
): CatalogueProduct[] {
  const products: CatalogueProduct[] = [];
  const ordered = [...pages].sort((a, b) => a.sourcePage - b.sourcePage);
  for (const page of ordered) {
    page.blocks.forEach((block, blockIndex) => {
      const code = formatCatalogueProductCode(products.length + 1);
      const { title, ...rect } = block;
      products.push({
        code,
        sourcePage: page.sourcePage,
        cataloguePage: page.sourcePage - startPage + 1,
        slot: blockIndex + 1,
        rect,
        title: title?.trim() || "Talishouse™ design suggestion",
      });
    });
  }
  return products;
}

export const CATALOGUE_PRODUCTS: readonly CatalogueProduct[] =
  buildCatalogueProducts();

/** Validated lookup — unknown / malformed codes return null. */
export function findCatalogueProduct(
  value: string | string[] | null | undefined,
): CatalogueProduct | null {
  const code = normalizeCatalogueProductCode(value);
  if (!code) return null;
  return CATALOGUE_PRODUCTS.find((product) => product.code === code) ?? null;
}

export function catalogueProductsForSourcePage(
  sourcePage: number,
): CatalogueProduct[] {
  return CATALOGUE_PRODUCTS.filter((product) => product.sourcePage === sourcePage);
}

/** /talisu/engage?product=P07 */
export function catalogueProductRegisterHref(code: string): string {
  return `${CATALOGUE_PRODUCT_REGISTER_PATH}?${CATALOGUE_PRODUCT_PARAM}=${encodeURIComponent(code)}`;
}

/**
 * SamCart only pre-fills name/email/phone/coupon, but it stores every URL
 * parameter (UTMs + custom params) with the order. Pass the product code as
 * `product` and `utm_content` so each order shows which product it was for.
 */
export function catalogueProductCheckoutUrl(
  baseUrl: string,
  product: Pick<CatalogueProduct, "code"> | null,
): string {
  if (!product) return baseUrl;
  const url = new URL(baseUrl);
  url.searchParams.set(CATALOGUE_PRODUCT_PARAM, product.code);
  url.searchParams.set("utm_content", product.code);
  return url.toString();
}

export function catalogueProductLabel(product: CatalogueProduct): string {
  return `${product.code} — ${product.title}`;
}
