import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  canEditMapSite,
  getMapSiteOwnerSession,
  isMapSiteAdmin,
  getRegisteredMapSiteFastCode,
} from "@/lib/mapsite-edit-auth";
import { isDemoMapSiteCode } from "@/lib/talispros/demo-mapsite";
import {
  REPLACE_IMAGE_TEMPLATE_DIR,
  REPLACE_IMAGE_TEMPLATE_FILES,
  type ReplaceImageTemplateFormat,
} from "@/lib/talispros/replace-image-templates";

/**
 * Google Slides "Make a copy" link. Server-only: rendered only for registered
 * owners / admins, never shipped in client bundles or i18n dictionaries.
 * Override with TALISPROS_TEMPLATE_GOOGLE_SLIDES_COPY_URL.
 */
const DEFAULT_GOOGLE_SLIDES_COPY_URL =
  "https://docs.google.com/presentation/d/1UmNQdsJZtonuw16i54PNP16WXEfBP2f3x3TVthcb3kA/copy";

export function getReplaceImageGoogleSlidesCopyUrl(): string {
  return (
    process.env.TALISPROS_TEMPLATE_GOOGLE_SLIDES_COPY_URL?.trim() ||
    DEFAULT_GOOGLE_SLIDES_COPY_URL
  );
}

/**
 * Gate: the same check that unlocks the PIN Dashboard / Ebook Editor
 * (canEditMapSite = Mapsite admin, or this browser's owner session for the
 * FAST Code™ plus a completed activation payment). Demo / draft codes never pass
 * for owners. Without a FAST Code™ the browser's own owner session is used.
 */
export async function canDownloadReplaceImageTemplates(
  fastCode?: string | null,
): Promise<boolean> {
  const requested = fastCode?.trim().toLowerCase() || "";
  const candidates = requested
    ? [requested]
    : [await getRegisteredMapSiteFastCode(), await getMapSiteOwnerSession()].filter(
        (code): code is string => Boolean(code),
      );
  if (await isMapSiteAdmin().catch(() => false)) return true;
  for (const code of new Set(candidates)) {
    // Demo Mapsites are prospects, never registered owners.
    if (isDemoMapSiteCode(code) || code === "demo") continue;
    try {
      if (await canEditMapSite(code)) return true;
    } catch {
      /* treat lookup failures as not registered */
    }
  }
  return false;
}

export async function readReplaceImageTemplate(
  format: ReplaceImageTemplateFormat,
): Promise<Buffer> {
  const { fileName } = REPLACE_IMAGE_TEMPLATE_FILES[format];
  return readFile(join(process.cwd(), REPLACE_IMAGE_TEMPLATE_DIR, fileName));
}
