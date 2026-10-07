/** Public URL prefix. Files live in `public/product-flipbook/`. */
export const PRODUCT_FLIPBOOK_PUBLIC_PREFIX = "/product-flipbook";

/** Directory Next serves. Drop optimized page rasters here. */
export const PRODUCT_FLIPBOOK_ASSET_DIR = "public/product-flipbook";

/** Source catalogue. Each PDF page is one image in this folder. */
export const PRODUCT_FLIPBOOK_SOURCE_PDF = "T-All Final.pdf";

/**
 * Page rasters from T-All Final.pdf, one image per PDF page:
 *   public/product-flipbook/page-01.webp
 *   public/product-flipbook/page-02.webp
 *   …
 * One image is one top-bound page — do not split them into centerfold leaves.
 */
export const PRODUCT_FLIPBOOK_PAGE_COUNT = 38;

/**
 * Filenames bundled into the server module. `/catalogue` renders on each
 * request (the root layout reads the locale cookie), and Vercel serves
 * `public/` from the CDN — that folder is not on the serverless filesystem.
 * Reading it with `fs.readdir` at request time throws and used to yield an
 * empty book ("Page 1 of 0").
 *
 * These names are the runtime page list. The image bytes stay in
 * `public/product-flipbook/` and are deployed as static files. A directory
 * read (tests, or an explicit override) still accepts webp, jpg, and png.
 */
export const PRODUCT_FLIPBOOK_PAGE_FILES: readonly string[] = Array.from(
  { length: PRODUCT_FLIPBOOK_PAGE_COUNT },
  (_, index) => `page-${String(index + 1).padStart(2, "0")}.webp`,
);

/** Clickable product block on a page (percent of the page image). */
export interface ProductFlipbookHotspot {
  code: string;
  href: string;
  label: string;
  rect: { x: number; y: number; w: number; h: number };
}

/**
 * `raster` paints `src`. `webster` is an optional HTML face (unused by the
 * current catalogue closing page, which uses the uploaded back-cover raster).
 */
export type ProductFlipbookFace = "raster" | "webster";

/** Cover leaves are unnumbered; content pages use `number` (T-Dome = 1). */
export type ProductFlipbookLeafRole = "front" | "back" | "content";

export interface ProductFlipbookPage {
  id: string;
  /**
   * 1-based content page number for `role: "content"`. Front/back covers use 0.
   */
  number: number;
  /**
   * 1-based page number in the source PDF (T-All Final.pdf).
   * 0 for synthetic leaves (e.g. T-Dome) that are not in the PDF.
   */
  sourcePage: number;
  /** Public image URL. Null while the T-All rasters are not in public/. */
  src: string | null;
  alt: string;
  hotspots?: ProductFlipbookHotspot[];
  /** Omitted pages are rasters. */
  face?: ProductFlipbookFace;
  /** Omitted pages are treated as content. */
  role?: ProductFlipbookLeafRole;
}

export type ProductFlipbookPageOptions = {
  /**
   * 1-based source page the book opens on. Pages before it are dropped from
   * the data (not hidden in CSS), and `number` restarts at 1.
   */
  startPage?: number;
};

const IMAGE_FILE = /\.(webp|jpe?g|png)$/i;

export function productFlipbookPublicSrc(fileName: string): string {
  return `${PRODUCT_FLIPBOOK_PUBLIC_PREFIX}/${fileName}`;
}

/** Keep page images only, in natural order (page-2 before page-10). */
export function selectProductFlipbookFiles(fileNames: readonly string[]): string[] {
  return fileNames
    .filter((name) => {
      const base = name.split("/").pop() || name;
      return !base.startsWith(".") && IMAGE_FILE.test(base);
    })
    .sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
}

export function pagesFromFlipbookFiles(
  fileNames: readonly string[],
  options: ProductFlipbookPageOptions = {},
): ProductFlipbookPage[] {
  const startPage = Math.max(1, Math.floor(options.startPage ?? 1));
  return selectProductFlipbookFiles(fileNames)
    .map((fileName, index) => ({ fileName, sourcePage: index + 1 }))
    .filter(({ sourcePage }) => sourcePage >= startPage)
    .map(({ fileName, sourcePage }, index) => {
      const number = index + 1;
      return {
        id: fileName,
        number,
        sourcePage,
        src: productFlipbookPublicSrc(fileName),
        alt: `T-All catalogue page ${number}`,
      };
    });
}
