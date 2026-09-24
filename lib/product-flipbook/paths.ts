import { normalizeAppPath } from "@/lib/admin-paths";

/**
 * Public Product destination: Keynote / top-bound T-All flipbook.
 * `/catalog` is the Talishouse e-commerce product line (storefront) and keeps chrome.
 */
export function isProductCataloguePath(pathname: string | null | undefined): boolean {
  const path = normalizeAppPath(pathname);
  return path === "/catalogue";
}
