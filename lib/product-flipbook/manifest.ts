import { PINNED_TALISBOOK_SLUG } from "@/lib/talisbooks/library/pinned-catalog";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";

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

export const PRODUCT_FLIPBOOK_SAMPLE_HREF = `${TALISBOOKS_ROUTES.VIEWER}/${PINNED_TALISBOOK_SLUG}`;

export interface ProductFlipbookPage {
  id: string;
  number: number;
  /** Public image URL. Null while the T-All rasters are not in public/. */
  src: string | null;
  alt: string;
}

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

export function pagesFromFlipbookFiles(fileNames: string[]): ProductFlipbookPage[] {
  return selectProductFlipbookFiles(fileNames).map((fileName, index) => {
    const number = index + 1;
    return {
      id: fileName,
      number,
      src: productFlipbookPublicSrc(fileName),
      alt: `T-All catalogue page ${number}`,
    };
  });
}
