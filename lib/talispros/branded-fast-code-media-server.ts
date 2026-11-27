import sharp from "sharp";
import { fetchOgImageBuffer } from "@/lib/share/fetch-og-image";
import { isAllowedOwnerImageUrl } from "@/lib/talispros/mapsite-owner-customizations";
import { loadPersonalHomeContent } from "@/lib/talispros/personal-home-service";
import { isBrandedFastCodeHomeMedia } from "@/lib/talispros/branded-fast-code-media";

export function isUsableBrandedHomeImageUrl(url: string | null | undefined): boolean {
  const value = url?.trim() || "";
  if (!value || value.length > 2048) return false;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("..")) {
    return true;
  }
  return isAllowedOwnerImageUrl(value, process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/**
 * Returns the published personal-home / profile image for RM22 and DC06 only.
 * Other FAST codes always return null so their share previews stay unchanged.
 */
export async function loadBrandedFastCodeHomeImageUrl(
  code: string | null | undefined,
): Promise<string | null> {
  if (!isBrandedFastCodeHomeMedia(code)) return null;
  const saved = await loadPersonalHomeContent(code);
  const url = saved.imageUrl?.trim() || "";
  return isUsableBrandedHomeImageUrl(url) ? url : null;
}

export async function renderBrandedFastCodeOgJpeg(
  code: string,
): Promise<Buffer | null> {
  const url = await loadBrandedFastCodeHomeImageUrl(code);
  if (!url) return null;
  const source = await fetchOgImageBuffer(url);
  if (!source) return null;
  try {
    return await sharp(source)
      .rotate()
      .resize(1200, 630, { fit: "cover", position: "centre" })
      .jpeg({ quality: 86 })
      .toBuffer();
  } catch {
    return null;
  }
}
