import fs from "node:fs";
import {
  PRODUCT_FLIPBOOK_PAGE_FILES,
  pagesFromFlipbookFiles,
  type ProductFlipbookPage,
  type ProductFlipbookPageOptions,
} from "@/lib/product-flipbook/manifest";

/**
 * Page list for the top-bound catalogue.
 *
 * With no `directory`, this uses the bundled `PRODUCT_FLIPBOOK_PAGE_FILES`
 * manifest. Do not discover those files with `fs.readdir` of
 * `public/product-flipbook` at request time: on Vercel that directory is not
 * inside the serverless function, the read throws, and the viewer renders
 * "Page 1 of 0".
 *
 * Pass `directory` to read a specific folder (tests). A missing directory
 * returns [] so a bad override stays an empty book instead of throwing.
 *
 * `options.startPage` trims every source page before it (the Catalogue opens
 * on Design Ideas, source page 20).
 */
export function loadProductFlipbookPages(
  directory?: string,
  options: ProductFlipbookPageOptions = {},
): ProductFlipbookPage[] {
  const fileNames = directory
    ? readFlipbookDirectory(directory)
    : PRODUCT_FLIPBOOK_PAGE_FILES;
  return pagesFromFlipbookFiles(fileNames, options);
}

function readFlipbookDirectory(directory: string): string[] {
  try {
    return fs.readdirSync(directory);
  } catch {
    return [];
  }
}
