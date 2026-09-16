/** Path helpers for Global Admin (`/admin/*`). Safe for Edge middleware. */

export function normalizeAppPath(pathname: string | null | undefined): string {
  const path = (pathname || "/").split("?")[0].trim() || "/";
  if (path.length > 1 && path.endsWith("/")) {
    return path.replace(/\/+$/, "") || "/";
  }
  return path;
}

export function isAdminAppPath(pathname: string | null | undefined): boolean {
  const path = normalizeAppPath(pathname);
  return path === "/admin" || path.startsWith("/admin/");
}

export function isPublicAdminPath(pathname: string | null | undefined): boolean {
  const path = normalizeAppPath(pathname);
  return path === "/admin/login" || path.startsWith("/admin/login/");
}

export function isProtectedAdminPath(pathname: string | null | undefined): boolean {
  return isAdminAppPath(pathname) && !isPublicAdminPath(pathname);
}

/** Talismaps admin keeps a standalone chrome but is not a public route. */
export function isStandaloneAdminPath(pathname: string | null | undefined): boolean {
  const path = normalizeAppPath(pathname);
  return path === "/admin/talismaps" || path.startsWith("/admin/talismaps/");
}

/**
 * Public Talishouse storefront chrome (logo / Home / Catalogue / cart / Talisbot)
 * must never wrap Global Admin.
 */
export function shouldHidePublicStorefrontChrome(pathname: string | null | undefined): boolean {
  return isAdminAppPath(pathname);
}
