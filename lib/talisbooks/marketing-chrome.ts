/**
 * Product marketing bar for /talisbooks.
 * FAST-code shelves are the Mapsite™ pin → TEB™ destination and keep the
 * bookshelf chrome only — the "Talisbooks™" product label stays off that bar.
 */

export function isTalisbooksFastShelfPath(
  pathname: string | null | undefined,
): boolean {
  const path = pathname?.split("?")[0]?.split("#")[0] || "";
  return path === "/talisbooks/fast" || path.startsWith("/talisbooks/fast/");
}

export function shouldShowTalisbooksMarketingHeader(
  pathname: string | null | undefined,
): boolean {
  const path = pathname?.split("?")[0]?.split("#")[0] || "";
  if (
    path.startsWith("/talisbooks/dashboard") ||
    path.startsWith("/talisbooks/editor") ||
    path.startsWith("/talisbooks/viewer") ||
    isTalisbooksFastShelfPath(path)
  ) {
    return false;
  }
  return true;
}
