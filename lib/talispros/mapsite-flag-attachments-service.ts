// Server only: imported by flag-actions.ts and the bookshelf page.
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  FLAG_ATTACHMENT_BUCKET,
  flagAttachmentFolder,
  flagAttachmentPath,
  newestFlagAttachmentName,
  type FlagAttachmentKind,
} from "@/lib/talispros/mapsite-flag-attachments";

export type MapSiteFlagAttachments = { teb: string | null; tva: string | null };

/** Public URLs of the newest TEB PDF and TVA summary for a FAST Code. */
export async function loadMapSiteFlagAttachments(
  fastCode: string | null | undefined,
): Promise<MapSiteFlagAttachments> {
  const empty = { teb: null, tva: null };
  const code = fastCode?.trim();
  if (!code || !isSupabaseAdminConfigured()) return empty;
  try {
    const storage = getSupabaseAdmin().storage.from(FLAG_ATTACHMENT_BUCKET);
    const folder = flagAttachmentFolder(code);
    const { data, error } = await storage.list(folder, { limit: 100 });
    if (error || !data) return empty;
    const names = data.map((item) => item.name);
    const url = (kind: FlagAttachmentKind) => {
      const name = newestFlagAttachmentName(names, kind);
      return name ? storage.getPublicUrl(`${folder}/${name}`).data.publicUrl || null : null;
    };
    return { teb: url("teb"), tva: url("tva") };
  } catch {
    return empty;
  }
}

/** Store a validated flag attachment and return its public URL. */
export async function storeMapSiteFlagAttachment(input: {
  fastCode: string;
  kind: FlagAttachmentKind;
  extension: string;
  body: Buffer;
  contentType: string;
}): Promise<{ url: string } | { error: string }> {
  if (!isSupabaseAdminConfigured()) return { error: "Uploads are not available right now." };
  const storage = getSupabaseAdmin().storage.from(FLAG_ATTACHMENT_BUCKET);
  const path = flagAttachmentPath(input.fastCode, input.kind, input.extension);
  const { error } = await storage.upload(path, input.body, {
    contentType: input.contentType || "application/octet-stream",
    upsert: false,
  });
  if (error) return { error: "The file could not be saved. Please try again." };
  const url = storage.getPublicUrl(path).data.publicUrl;
  return url ? { url } : { error: "The file could not be saved. Please try again." };
}
