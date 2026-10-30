import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  emptyPersonalHomeContent,
  normalizePersonalHomeButtons,
  type PersonalHomeButton,
  type PersonalHomeContent,
} from "@/lib/talispros/personal-home";

/** Storage: supabase/migrations/113_mapsite_personal_home.sql */
const TABLE = "mapsite_personal_home";
const COLUMNS = "mapsite_id, fast_code, image_url, kicker, headline, write_up, buttons, updated_at";

type Row = {
  mapsite_id: string;
  fast_code: string;
  image_url: string | null;
  kicker: string | null;
  headline: string | null;
  write_up: string | null;
  buttons: unknown;
  updated_at: string | null;
};

function rowToContent(row: Row | null | undefined): PersonalHomeContent {
  if (!row) return emptyPersonalHomeContent();
  return {
    imageUrl: row.image_url?.trim() || null,
    kicker: row.kicker?.trim() || null,
    headline: row.headline?.trim() || null,
    writeUp: row.write_up?.trim() || null,
    buttons: normalizePersonalHomeButtons(row.buttons),
    updatedAt: row.updated_at ?? null,
  };
}

function isMissingTable(message: string | undefined): boolean {
  return /relation|does not exist|schema cache/i.test(message || "");
}

/**
 * Saved personal home content for a FAST Code. Never throws: a missing table,
 * missing row or database error reads as "no customisation" (defaults show).
 */
export async function loadPersonalHomeContent(
  fastCode: string | null | undefined,
): Promise<PersonalHomeContent> {
  const code = fastCode?.trim().toLowerCase() || "";
  if (!code || !isSupabaseAdminConfigured()) return emptyPersonalHomeContent();
  try {
    const { data, error } = await getSupabaseAdmin()
      .from(TABLE)
      .select(COLUMNS)
      .ilike("fast_code", code)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      if (!isMissingTable(error.message)) {
        console.error("[personal-home] load failed:", error.message);
      }
      return emptyPersonalHomeContent();
    }
    return rowToContent(data as Row | null);
  } catch {
    return emptyPersonalHomeContent();
  }
}

/** The mapsites row for a FAST Code (never trust a client-sent id). */
export async function findMapSiteIdentityByFastCode(
  fastCode: string,
): Promise<{ id: string; fastCode: string; isDemonstration: boolean } | null> {
  const code = fastCode.trim().toLowerCase();
  if (!code || !isSupabaseAdminConfigured()) return null;
  try {
    const { data } = await getSupabaseAdmin()
      .from("mapsites")
      .select("id, fast_code, is_demonstration")
      .ilike("fast_code", code)
      .limit(1)
      .maybeSingle();
    if (!data?.id || !data.fast_code) return null;
    return {
      id: data.id as string,
      fastCode: String(data.fast_code).trim().toLowerCase(),
      isDemonstration: Boolean(data.is_demonstration),
    };
  } catch {
    return null;
  }
}

/** Upsert the owner's content. Callers must authorize first. */
export async function savePersonalHomeContent(input: {
  mapsiteId: string;
  fastCode: string;
  imageUrl: string | null;
  kicker: string | null;
  headline: string | null;
  writeUp: string | null;
  buttons: PersonalHomeButton[];
}): Promise<{ content?: PersonalHomeContent; error?: "storage" | "save" }> {
  if (!isSupabaseAdminConfigured()) return { error: "storage" };
  const { data, error } = await getSupabaseAdmin()
    .from(TABLE)
    .upsert(
      {
        mapsite_id: input.mapsiteId,
        fast_code: input.fastCode.trim().toLowerCase(),
        image_url: input.imageUrl,
        kicker: input.kicker,
        headline: input.headline,
        write_up: input.writeUp,
        buttons: input.buttons,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "mapsite_id" },
    )
    .select(COLUMNS)
    .maybeSingle();
  if (error) {
    console.error("[personal-home] save failed:", error.message);
    return { error: isMissingTable(error.message) ? "storage" : "save" };
  }
  return { content: rowToContent(data as Row | null) };
}

/** Remove the owner's content so the Mapsite defaults show again. */
export async function resetPersonalHomeContent(
  mapsiteId: string,
): Promise<{ ok: boolean }> {
  if (!isSupabaseAdminConfigured()) return { ok: false };
  const { error } = await getSupabaseAdmin()
    .from(TABLE)
    .delete()
    .eq("mapsite_id", mapsiteId);
  if (error && !isMissingTable(error.message)) {
    console.error("[personal-home] reset failed:", error.message);
    return { ok: false };
  }
  return { ok: true };
}
