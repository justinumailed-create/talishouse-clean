import { normalizeAppPath } from "@/lib/admin-paths";

/**
 * Public Product destination: Keynote / top-bound T-All flipbook.
 * `/catalog` is the Talishouse e-commerce product line (storefront) and keeps chrome.
 * `/catalogue/bookshelf` is the admin-only isolated T-All bookshelf (same chrome-free shell).
 */
export function isProductCataloguePath(pathname: string | null | undefined): boolean {
  const path = normalizeAppPath(pathname);
  return path === "/catalogue" || path === "/catalogue/bookshelf" || path === "/catalogue/bookshelf/create";
}
