import fs from "node:fs";
import path from "node:path";
import {
  PRODUCT_FLIPBOOK_ASSET_DIR,
  pagesFromFlipbookFiles,
  type ProductFlipbookPage,
  type ProductFlipbookPageOptions,
} from "@/lib/product-flipbook/manifest";

/**
 * Reads `public/product-flipbook/` at request/build time.
 * Returns [] when the directory only has the placeholder marker — the viewer
 * then shows top-bound placeholder sheets and the asset TODO.
 *
 * `options.startPage` trims every source page before it (e.g. the Catalogue
 * opens on Design Ideas, source page 20).
 */
export function loadProductFlipbookPages(
  directory = path.join(process.cwd(), PRODUCT_FLIPBOOK_ASSET_DIR),
  options: ProductFlipbookPageOptions = {},
): ProductFlipbookPage[] {
  let fileNames: string[] = [];
  try {
    fileNames = fs.readdirSync(directory);
  } catch {
    return [];
  }
  return pagesFromFlipbookFiles(fileNames, options);
}
