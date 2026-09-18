import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { ROUTES } from "@/lib/routes";
import {
  canAdminDeleteLibraryBook,
  type TalisBooksAdminLibraryScope,
} from "./admin-scope";

export type DeleteTalisBooksLibraryBookResult =
  | { success: true; slug: string; fastCode: string | null; title: string }
  | { success: false; error: string };

function tebUrlPointsAtBook(tebUrl: string | null | undefined, slug: string): boolean {
  const url = tebUrl?.trim() || "";
  if (!url || !slug) return false;
  return url.includes(`/talisbooks/viewer/${slug}`) || url.endsWith(`/${slug}`);
}

async function detachMapSiteTebUrl(input: {
  mapsiteId: string | null;
  fastCode: string | null;
  slug: string;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const ids = new Set<string>();

  if (input.mapsiteId) {
    const { data } = await supabase
      .from("mapsites")
      .select("id, teb_url")
      .eq("id", input.mapsiteId)
      .maybeSingle();
    if (data?.id && tebUrlPointsAtBook(data.teb_url, input.slug)) {
      ids.add(data.id);
    }
  }

  if (input.fastCode) {
    const { data } = await supabase
      .from("mapsites")
      .select("id, teb_url")
      .ilike("fast_code", input.fastCode)
      .maybeSingle();
    if (data?.id && tebUrlPointsAtBook(data.teb_url, input.slug)) {
      ids.add(data.id);
    }
  }

  for (const id of ids) {
    await supabase
      .from("mapsites")
      .update({ teb_url: null, updated_at: now })
      .eq("id", id);
  }
}

export async function deleteTalisBooksLibraryBook(input: {
  bookId: string;
  scope: TalisBooksAdminLibraryScope;
}): Promise<DeleteTalisBooksLibraryBookResult> {
  const bookId = input.bookId.trim();
  if (!bookId) {
    return { success: false, error: "Book id is required." };
  }
  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Database is not configured." };
  }

  const supabase = getSupabaseAdmin();
  const { data: book, error: loadError } = await supabase
    .from("talisbooks_books")
    .select("id, slug, title, fast_code, mapsite_id")
    .eq("id", bookId)
    .maybeSingle();

  if (loadError) {
    return { success: false, error: loadError.message };
  }
  if (!book) {
    return { success: false, error: "Ebook not found." };
  }

  const allowed = canAdminDeleteLibraryBook(
    {
      id: book.id,
      slug: book.slug,
      title: book.title,
      fastCode: book.fast_code,
    },
    input.scope,
  );
  if (!allowed) {
    return { success: false, error: "Unauthorized." };
  }

  await detachMapSiteTebUrl({
    mapsiteId: book.mapsite_id,
    fastCode: book.fast_code,
    slug: book.slug,
  });

  const { error: clearCoverError } = await supabase
    .from("talisbooks_books")
    .update({ cover_image_id: null, updated_at: new Date().toISOString() })
    .eq("id", book.id);

  if (clearCoverError) {
    return { success: false, error: clearCoverError.message };
  }

  const { error: deleteError } = await supabase
    .from("talisbooks_books")
    .delete()
    .eq("id", book.id);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  return {
    success: true,
    slug: book.slug,
    fastCode: book.fast_code,
    title: book.title,
  };
}

export function libraryEbookViewerPath(slug: string): string {
  return `${ROUTES.TALISBOOKS_VIEWER}/${slug}`;
}
