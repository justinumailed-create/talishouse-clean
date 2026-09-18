import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import {
  issuedFastCodeKey,
  shouldDeleteBookshelfMissingFastCode,
  shouldDeleteMapSiteMissingFastCode,
} from "@/lib/talispros/fast-code-asset-cleanup";
import { shouldKeepPlatformDemoMapSite } from "@/lib/talispros/demo-mapsite";

type AdminClient = SupabaseClient<Database>;

async function deleteBooksByIds(
  supabase: AdminClient,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  await supabase
    .from("talisbooks_books")
    .update({ cover_image_id: null, updated_at: new Date().toISOString() })
    .in("id", ids);
  await supabase.from("talisbooks_books").delete().in("id", ids);
}

export async function deleteBookshelfForFastCode(
  supabase: AdminClient,
  fastCode: string,
  mapsiteId?: string | null,
): Promise<number> {
  const code = issuedFastCodeKey(fastCode);
  const ids = new Set<string>();

  if (code) {
    const { data } = await supabase
      .from("talisbooks_books")
      .select("id, is_pinned")
      .ilike("fast_code", code);
    for (const book of data ?? []) {
      if (!book.is_pinned) ids.add(book.id);
    }
  }

  if (mapsiteId) {
    const { data } = await supabase
      .from("talisbooks_books")
      .select("id, is_pinned")
      .eq("mapsite_id", mapsiteId);
    for (const book of data ?? []) {
      if (!book.is_pinned) ids.add(book.id);
    }
  }

  await deleteBooksByIds(supabase, [...ids]);
  return ids.size;
}

export async function unlinkAndDeleteMapSite(
  supabase: AdminClient,
  mapsiteId: string,
  fastCode?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (
    shouldKeepPlatformDemoMapSite({
      mapsiteId,
      fastCode,
    })
  ) {
    return { ok: false, error: "The platform demonstration Mapsite™ cannot be deleted." };
  }

  const code = issuedFastCodeKey(fastCode);
  await supabase
    .from("fast_codes")
    .update({ mapsite_id: null })
    .eq("mapsite_id", mapsiteId);
  if (code) {
    await supabase.from("fast_codes").update({ mapsite_id: null }).ilike("code", code);
  }
  await supabase
    .from("build_requests")
    .update({ linked_mapsite_id: null })
    .eq("linked_mapsite_id", mapsiteId);
  await supabase.from("pins").delete().eq("mapsite_id", mapsiteId);
  await supabase
    .from("talismaps_maps")
    .update({ mapsite_id: null })
    .eq("mapsite_id", mapsiteId);
  await supabase
    .from("talisbooks_books")
    .update({ mapsite_id: null, updated_at: new Date().toISOString() })
    .eq("mapsite_id", mapsiteId);
  await supabase
    .from("talispros_payments")
    .update({ mapsite_id: null })
    .eq("mapsite_id", mapsiteId);

  const { data: removed, error } = await supabase
    .from("mapsites")
    .delete()
    .eq("id", mapsiteId)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!removed?.length) {
    const { data: remaining } = await supabase
      .from("mapsites")
      .select("id")
      .eq("id", mapsiteId)
      .maybeSingle();
    if (remaining?.id) {
      return {
        ok: false,
        error: "Mapsite™ could not be deleted. A related record is still linked.",
      };
    }
  }
  return { ok: true };
}

export async function deleteMapSiteAndBookshelfForFastCode(
  supabase: AdminClient,
  fastCode: string,
): Promise<{ ok: true; booksDeleted: number } | { ok: false; error: string }> {
  const code = issuedFastCodeKey(fastCode);
  if (!code) return { ok: false, error: "FAST code is required." };

  const { data: mapsites } = await supabase
    .from("mapsites")
    .select("id, fast_code")
    .ilike("fast_code", code);

  const mapsiteIds = [...new Set((mapsites ?? []).map((row) => row.id))];
  const booksDeleted = await deleteBookshelfForFastCode(
    supabase,
    code,
    mapsiteIds[0] ?? null,
  );
  for (const extraId of mapsiteIds.slice(1)) {
    await deleteBookshelfForFastCode(supabase, code, extraId);
  }

  for (const mapsite of mapsites ?? []) {
    const deleted = await unlinkAndDeleteMapSite(
      supabase,
      mapsite.id,
      mapsite.fast_code || code,
    );
    if (!deleted.ok) return deleted;
  }

  return { ok: true, booksDeleted };
}

export async function purgeMapSitesAndBookshelvesWithoutFastCodes(
  supabase: AdminClient,
): Promise<{ mapsitesDeleted: number; booksDeleted: number }> {
  const [{ data: codeRows }, { data: mapsites }, { data: books }] =
    await Promise.all([
      supabase.from("fast_codes").select("code"),
      supabase.from("mapsites").select("id, fast_code"),
      supabase.from("talisbooks_books").select("id, fast_code, is_pinned"),
    ]);

  const issued = (codeRows ?? []).map((row) => row.code);
  const bookIds = (books ?? [])
    .filter((book) =>
      shouldDeleteBookshelfMissingFastCode({
        fastCode: book.fast_code,
        isPinned: book.is_pinned,
        issuedFastCodes: issued,
      }),
    )
    .map((book) => book.id);

  await deleteBooksByIds(supabase, bookIds);

  let mapsitesDeleted = 0;
  for (const mapsite of mapsites ?? []) {
    if (
      !shouldDeleteMapSiteMissingFastCode({
        mapsiteId: mapsite.id,
        fastCode: mapsite.fast_code,
        issuedFastCodes: issued,
      })
    ) {
      continue;
    }
    const deleted = await unlinkAndDeleteMapSite(
      supabase,
      mapsite.id,
      mapsite.fast_code,
    );
    if (deleted.ok) mapsitesDeleted += 1;
    else {
      console.warn(
        "[fast-code-cleanup] Mapsite™ delete failed:",
        mapsite.fast_code,
        deleted.error,
      );
    }
  }

  return { mapsitesDeleted, booksDeleted: bookIds.length };
}
