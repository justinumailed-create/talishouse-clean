/** Unlisted FSBO offer mockup. Not in the navbar or the public sitemap. */
export const FSBO_INTAKE_PATH = "/fsbo";
export const FSBO_SAMPLE_PATH = "/fsbo/sample";

export function isFsboMockPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === FSBO_INTAKE_PATH || pathname.startsWith(`${FSBO_INTAKE_PATH}/`);
}
