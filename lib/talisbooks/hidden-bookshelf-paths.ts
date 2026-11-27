/**
 * Hidden bookshelf paths. Kept apart from the book registry so the root
 * shell can recognise these routes without bundling any book copy.
 * Never link these paths from a nav bar, footer, dropdown or sitemap.
 */
export const HIDDEN_BOOKSHELF_PATH = "/private-shelf";

/** True on the hidden shelf and its books (no storefront chrome there). */
export function isHiddenBookshelfPath(pathname: string | null | undefined): boolean {
  const path = (pathname || "").toLowerCase();
  return path === HIDDEN_BOOKSHELF_PATH || path.startsWith(`${HIDDEN_BOOKSHELF_PATH}/`);
}
