import type { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * `talisbooks_book_pages` has UNIQUE (book_id, page_number), so renumbering
 * page-by-page in one pass collides (e.g. swapping 2 ↔ 3). Move every page to
 * a temporary range first, then to its final number.
 */
export const PAGE_RENUMBER_TEMP_OFFSET = 100000;

export type PageRenumberStep = {
  id: string;
  pageNumber: number;
  final: boolean;
};

/** Pure plan: temp numbers for all pages, then final 1..n. */
export function planTwoPassPageRenumber(orderedIds: readonly string[]): PageRenumberStep[] {
  return [
    ...orderedIds.map((id, index) => ({
      id,
      pageNumber: PAGE_RENUMBER_TEMP_OFFSET + index + 1,
      final: false,
    })),
    ...orderedIds.map((id, index) => ({ id, pageNumber: index + 1, final: true })),
  ];
}

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export async function renumberBookPagesTwoPass(
  supabase: AdminClient,
  bookId: string,
  orderedIds: readonly string[],
  now = new Date().toISOString(),
): Promise<{ success: true } | { success: false; error: string }> {
  for (const step of planTwoPassPageRenumber(orderedIds)) {
    const patch = step.final
      ? { page_number: step.pageNumber, sort_order: step.pageNumber, updated_at: now }
      : { page_number: step.pageNumber };
    const { error } = await supabase
      .from("talisbooks_book_pages")
      .update(patch)
      .eq("id", step.id)
      .eq("book_id", bookId);
    if (error) return { success: false, error: error.message };
  }
  return { success: true };
}
