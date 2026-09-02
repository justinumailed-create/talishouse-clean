import {
  PINNED_TALISBOOK_ASSET_ROOT,
  PINNED_TALISBOOK_SLUG,
} from "@/lib/talisbooks/library/pinned-catalog";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";
import { isIssuedFastCode } from "@/lib/talispros/fast-code-shape";
import { DEMO_MAPSITE_ID } from "@/lib/talispros/mapsite-state";

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
