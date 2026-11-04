import "server-only";

import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { ROUTES } from "@/lib/routes";

/**
 * TEB™ on a Mapsite whose FAST Code has exactly one eBook of its own opens
 * that eBook straight in the viewer (no shelf, no shared sample books).
 * Codes with several own books keep the FAST Code shelf.
 */
export async function loadOwnTebViewerHref(
  fastCode: string | null | undefined,
): Promise<string | null> {
  const code = fastCode?.trim().toLowerCase() || "";
  if (!code || !isSupabaseAdminConfigured()) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("talisbooks_books")
    .select("slug")
    .ilike("fast_code", code)
    .limit(2);
  if (error || !data || data.length !== 1) return null;
  const slug = data[0]?.slug?.trim();
  return slug ? `${ROUTES.TALISBOOKS_VIEWER}/${encodeURIComponent(slug)}` : null;
}
