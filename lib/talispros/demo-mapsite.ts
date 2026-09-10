import {
  PINNED_TALISBOOK_ASSET_ROOT,
  PINNED_TALISBOOK_SLUG,
} from "@/lib/talisbooks/library/pinned-catalog";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";
import { isIssuedFastCode } from "@/lib/talispros/fast-code-shape";
import { DEMO_MAPSITE_ID, MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";

/** Public demo Mapsite™ builder (no FAST Code issuance). */
export const DEMO_MAPSITE_BUILD_PATH = "/talispros/demo-mapsite";

export const DEMO_MAPSITE_CODE_PREFIX = "demo-";

export const DEMO_PINNED_EBOOK_HREF = `${TALISBOOKS_ROUTES.VIEWER}/${PINNED_TALISBOOK_SLUG}`;

export const DEMO_PINNED_COVER_IMAGE = `${PINNED_TALISBOOK_ASSET_ROOT}/front-cover.jpg`;

export function isDemoMapSiteCode(
  value: string | null | undefined,
): boolean {
  const code = value?.trim().toLowerCase() || "";
  if (!code.startsWith(DEMO_MAPSITE_CODE_PREFIX)) return false;
  if (code.length <= DEMO_MAPSITE_CODE_PREFIX.length) return false;
  return !isIssuedFastCode(code);
}

export function isProtectedPlatformDemoMapSite(id: string | null | undefined): boolean {
  return (id || "").trim() === DEMO_MAPSITE_ID;
}

export function createDemoMapSiteCode(): string {
  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `${DEMO_MAPSITE_CODE_PREFIX}${token}`;
}

export function demoMapSiteApplicationHref(
  mapsiteId: string,
  code?: string | null,
): string {
  const params = new URLSearchParams({
    view: "pin",
    mapsiteId,
  });
  const trimmedCode = code?.trim();
  if (trimmedCode) params.set("code", trimmedCode);
  return `${MAPSITE_APP_PATH}?${params.toString()}`;
}

/** Next.js revalidatePath matches route files — query strings are not valid paths. */
export function pathnameForRevalidate(href: string): string {
  const trimmed = href.trim();
  if (!trimmed) return MAPSITE_APP_PATH;
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return new URL(trimmed).pathname || MAPSITE_APP_PATH;
    }
  } catch {
    /* use the raw path below */
  }
  return trimmed.split("?")[0]?.split("#")[0] || MAPSITE_APP_PATH;
}

export function publicDemoGenerateError(
  error: unknown,
  fallback = "Could not generate the demonstration Talisbook™.",
): string {
  if (!(error instanceof Error) || !error.message.trim()) return fallback;
  if (/server components render|omitted in production|digest/i.test(error.message)) {
    return fallback;
  }
  return error.message;
}

export function demoMapSiteEbookHref(options: {
  mapsiteId: string;
  code: string;
}): string {
  const params = new URLSearchParams({
    mapsiteId: options.mapsiteId,
    code: options.code,
  });
  return `${DEMO_MAPSITE_BUILD_PATH}/ebook?${params.toString()}`;
}
