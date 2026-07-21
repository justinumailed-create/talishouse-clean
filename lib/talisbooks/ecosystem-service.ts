import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/database.types";
import type { TalisBooksEcosystemBook } from "./platform-types";

type BookRow = Database["public"]["Tables"]["talisbooks_books"]["Row"];

function toEcosystemBook(row: BookRow): TalisBooksEcosystemBook {
  return {
    bookId: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    publishStatus: row.publish_status as TalisBooksEcosystemBook["publishStatus"],
    pageCount: row.page_count,
    isPublic: row.is_public,
    mapsiteId: row.mapsite_id ?? null,
    accountId: row.account_id,
    fastCode: row.fast_code ?? null,
    accountType: (row.account_type as TalisBooksEcosystemBook["accountType"]) ?? "root",
    parentBookId: row.parent_book_id ?? null,
  };
}

/** List books linked to a MapSite™ (ecosystem reuse). */
export async function listTalisBooksByMapsiteId(
  mapsiteId: string,
): Promise<TalisBooksEcosystemBook[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("talisbooks_books")
    .select("*")
    .eq("mapsite_id", mapsiteId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[talisbooks] listTalisBooksByMapsiteId error:", error.message);
    return [];
  }

  return (data ?? []).map(toEcosystemBook);
}

/** List books for a FAST Code (client portal / ecosystem reuse). */
export async function listTalisBooksByFastCode(
  fastCode: string,
): Promise<TalisBooksEcosystemBook[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("talisbooks_books")
    .select("*")
    .eq("fast_code", fastCode.toLowerCase())
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[talisbooks] listTalisBooksByFastCode error:", error.message);
    return [];
  }

  return (data ?? []).map(toEcosystemBook);
}

/** List books for an account (admin / ecosystem reuse). */
export async function listTalisBooksByAccountId(
  accountId: string,
): Promise<TalisBooksEcosystemBook[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("talisbooks_books")
    .select("*")
    .eq("account_id", accountId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[talisbooks] listTalisBooksByAccountId error:", error.message);
    return [];
  }

  return (data ?? []).map(toEcosystemBook);
}
