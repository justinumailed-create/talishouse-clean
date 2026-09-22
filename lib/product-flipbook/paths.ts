import { normalizeAppPath } from "@/lib/admin-paths";

/**
 * Product destination. `/catalog` is the old alias and redirects here.
 * These routes must not inherit Talishouse storefront chrome.
 */
export function isProductCataloguePath(pathname: string | null | undefined): boolean {
  const path = normalizeAppPath(pathname);
  return path === "/catalogue" || path === "/catalog";
}
