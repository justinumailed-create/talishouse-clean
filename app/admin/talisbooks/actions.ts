"use server";

import { setCenterfoldReviewStatus } from "@/lib/talisbooks/centerfold-service";
import type { TalisBooksCenterfoldReviewStatus } from "@/lib/talisbooks/image-engine";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { requireTalisprosAdminPage } from "@/lib/talispros-admin-auth";

export async function reviewCenterfoldAction(
  originalImageId: string,
  status: Extract<TalisBooksCenterfoldReviewStatus, "approved" | "rejected">,
) {
  await requireTalisprosAdminPage();
  await setCenterfoldReviewStatus(originalImageId, status);
}

/**
 * Pin a single public TalisBook™ on /talisbooks (clears any previous pin).
 */
export async function pinTalisBookAction(bookId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  await requireTalisprosAdminPage();
  const id = bookId.trim();
  if (!id) return { ok: false, error: "Book id is required." };
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Database is not configured." };
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { error: clearError } = await supabase
    .from("talisbooks_books")
    .update({ is_pinned: false, updated_at: now })
    .eq("is_pinned", true);

  if (clearError) {
    return { ok: false, error: clearError.message };
  }

  const { data, error } = await supabase
    .from("talisbooks_books")
    .update({
      is_pinned: true,
      is_public: true,
      publish_status: "published",
      published_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .select("id, slug")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message || "Book not found." };
  }

  return { ok: true };
}
