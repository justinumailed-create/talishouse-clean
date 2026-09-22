import { PINNED_TALISBOOK_SLUG } from "@/lib/talisbooks/library/pinned-catalog";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";

/** Public URL prefix. Files live in `public/product-flipbook/`. */
export const PRODUCT_FLIPBOOK_PUBLIC_PREFIX = "/product-flipbook";

/** Directory Next serves. Drop optimized page rasters here. */
export const PRODUCT_FLIPBOOK_ASSET_DIR = "public/product-flipbook";

/** Source catalogue Arun named for this Product destination. */
export const PRODUCT_FLIPBOOK_SOURCE_PDF = "T-All Final.pdf";

/** Workspace path the PDF may arrive as. */
export const PRODUCT_FLIPBOOK_UPLOAD_CANDIDATE = "uploads/T-All-Final.pdf";

/**
 * TODO: T-All Final.pdf was not in the workspace when this viewer shipped.
 * Rasterize that PDF (or uploads/T-All-Final.pdf) to optimized images:
 *   public/product-flipbook/page-01.webp
 *   public/product-flipbook/page-02.webp
 *   …
 * webp, jpg, and png are picked up in natural filename order.
 * One image is one top-bound page — do not split them into centerfold leaves.
 */
export const PRODUCT_FLIPBOOK_ASSET_TODO =
  "TODO: rasterize T-All Final.pdf (uploads/T-All-Final.pdf) into public/product-flipbook/page-01.webp, page-02.webp, and so on (webp, jpg, or png). Each file is one page and turns from the top edge.";

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

/** Shown until real page rasters are added. Still a top-bound, single-page deck. */
export const PRODUCT_FLIPBOOK_PLACEHOLDER_PAGES: ProductFlipbookPage[] = [
  1, 2, 3, 4,
].map((number) => ({
  id: `placeholder-${number}`,
  number,
  src: null,
  alt:
    number === 1
      ? "T-All catalogue cover, awaiting page images"
      : `T-All catalogue placeholder page ${number}`,
}));
