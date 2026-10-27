/**
 * Where a reader opened the viewer from. Only the public catalogue Bookshelf
 * tags its viewer links, so Mapsite / FAST Code owner ebook views are untouched.
 */
export const VIEWER_ORIGIN_PARAM = "from";
export const VIEWER_ORIGIN_BOOKSHELF = "bookshelf";
export const CATALOGUE_BOOKSHELF_PATH = "/catalogue/bookshelf";

export type TalisBooksViewerOrigin = typeof VIEWER_ORIGIN_BOOKSHELF;

export function isBookshelfViewerOrigin(
  value: string | string[] | null | undefined,
): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").trim().toLowerCase() === VIEWER_ORIGIN_BOOKSHELF;
}

export function viewerHrefWithOrigin(
  href: string,
  origin: TalisBooksViewerOrigin | null | undefined,
): string {
  if (!origin) {
    return href;
  }
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}${VIEWER_ORIGIN_PARAM}=${origin}`;
}
