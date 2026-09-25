import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/database.types";
import {
  ISOLATED_BOOKSHELF_METADATA_KEY,
  isIsolatedBookshelfBook,
} from "@/lib/talisbooks/isolated-bookshelf";
import { displayShelfBookTitle } from "@/lib/talisbooks/book-title";
import { ROUTES } from "@/lib/routes";

type BookRow = Database["public"]["Tables"]["talisbooks_books"]["Row"];

export type IsolatedBookshelfBook = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  coverImageUrl: string | null;
  publishStatus: string;
  fastCode: string | null;
  createdAt: string;
  viewerHref: string;
};

function coverFromMetadata(row: BookRow): string | null {
  const metadata = (row.metadata as Record<string, unknown>) ?? {};
  const url = metadata.coverImageUrl;
  return typeof url === "string" && url.trim() ? url.trim() : null;
}

function rowPublishStatus(row: BookRow): string {
  const record = row as Record<string, unknown>;
  const value = record.publish_status ?? record.publish_status;
  return typeof value === "string" ? value : "";
}

function rowFastCode(row: BookRow): string | null {
  const record = row as Record<string, unknown>;
  const value = record.fast_code ?? record.fast_code;
  return typeof value === "string" ? value : null;
}

/**
 * Admin-only catalogue isolated shelf: books tagged via the self-serve
 * ebook flow with metadata.isolatedBookshelf === true.
 */
export async function listIsolatedBookshelfBooks(): Promise<IsolatedBookshelfBook[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("talisbooks_books")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[talisbooks] listIsolatedBookshelfBooks:", error.message);
    return [];
  }

  const rows = ((data ?? []) as BookRow[]).filter((row) =>
    isIsolatedBookshelfBook({
      metadata: (row.metadata as Record<string, unknown>) ?? {},
    }),
  );

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: displayShelfBookTitle(row.title),
    subtitle: row.subtitle,
    coverImageUrl: coverFromMetadata(row),
    publishStatus: rowPublishStatus(row),
    fastCode: rowFastCode(row),
    createdAt: row.created_at,
    viewerHref: `${ROUTES.TALISBOOKS_VIEWER}/${row.slug}`,
  }));
}

export function isolatedBookshelfMetadataFlag(): Record<string, true> {
  return { [ISOLATED_BOOKSHELF_METADATA_KEY]: true };
}
