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
 * webp, jpg, and png are picked up in natural filename order.
 * One image is one top-bound page — do not split them into centerfold leaves.
 */
export const PRODUCT_FLIPBOOK_PAGE_COUNT = 38;

/** Clickable product block on a page (percent of the page image). */
export interface ProductFlipbookHotspot {
  code: string;
  href: string;
  label: string;
  rect: { x: number; y: number; w: number; h: number };
}

export interface ProductFlipbookPage {
  id: string;
  /** 1-based page number in the (possibly trimmed) book shown to readers. */
  number: number;
  /** 1-based page number in the source PDF (T-All Final.pdf). */
  sourcePage: number;
  /** Public image URL. Null while the T-All rasters are not in public/. */
  src: string | null;
  alt: string;
  hotspots?: ProductFlipbookHotspot[];
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
export function selectProductFlipbookFiles(fileNames: string[]): string[] {
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
  fileNames: string[],
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
