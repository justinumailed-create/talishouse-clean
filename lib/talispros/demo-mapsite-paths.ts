/** Public Build Mapsite address. The browser stays on this path. */
export const DEMO_MAPSITE_PUBLIC_PATH = "/demo";

/** File route for the builder. Requests here 301 to the public address. */
export const DEMO_MAPSITE_BUILD_PATH = "/talispros/demo-mapsite";

/**
 * Exact retired builder URL, with or without a trailing slash.
 * Child routes such as /ebook stay put.
 */
export function isRetiredDemoMapSitePath(pathname: string): boolean {
  const path = (pathname.split("?")[0]?.split("#")[0] || "").replace(/\/+$/, "") || "/";
  return path === DEMO_MAPSITE_BUILD_PATH;
}
