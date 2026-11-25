import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  contactNameFromPersonalHomeRow,
  emptyPersonalHomeContent,
  normalizePersonalHomeButtons,
  normalizePersonalHomeSideMedia,
  packPersonalHomeButtonsForContact,
  type PersonalHomeButton,
  type PersonalHomeContent,
  type PersonalHomeSideMedia,
} from "@/lib/talispros/personal-home";

/** Storage: supabase/migrations/113_mapsite_personal_home.sql */
const TABLE = "mapsite_personal_home";
const COLUMNS = "mapsite_id, fast_code, image_url, kicker, headline, write_up, buttons, updated_at";
const COLUMNS_WITH_CONTACT = COLUMNS.replace("headline,", "headline, contact_name,");
const COLUMNS_WITH_SIDE = COLUMNS_WITH_CONTACT.replace("buttons,", "buttons, side_media,");

type Row = {
  mapsite_id: string;
  fast_code: string;
  image_url: string | null;
  kicker: string | null;
  headline: string | null;
  contact_name?: string | null;
  write_up: string | null;
  buttons: unknown;
  side_media?: unknown;
  updated_at: string | null;
};

function rowToContent(row: Row | null | undefined): PersonalHomeContent {
  if (!row) return emptyPersonalHomeContent();
  return {
    imageUrl: row.image_url?.trim() || null,
    kicker: row.kicker?.trim() || null,
    headline: row.headline?.trim() || null,
    contactName: contactNameFromPersonalHomeRow(row.contact_name, row.buttons),
    writeUp: row.write_up?.trim() || null,
    buttons: normalizePersonalHomeButtons(row.buttons),
    sideMedia: normalizePersonalHomeSideMedia(row.side_media),
    updatedAt: row.updated_at ?? null,
  };
}

function isMissingTable(message: string | undefined): boolean {
  return /relation|does not exist|schema cache/i.test(message || "");
}

function isMissingContactColumn(message: string | undefined): boolean {
  return /contact_name/i.test(message || "") && isMissingTable(message);
}

function isMissingSideColumn(message: string | undefined): boolean {
  return /side_media/i.test(message || "") && isMissingTable(message);
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
    const first = await getSupabaseAdmin()
      .from(TABLE)
      .select(COLUMNS_WITH_SIDE)
      .ilike("fast_code", code)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const withContact = first.error && isMissingSideColumn(first.error.message)
      ? await getSupabaseAdmin()
          .from(TABLE)
          .select(COLUMNS_WITH_CONTACT)
          .ilike("fast_code", code)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : first;
    const query = withContact.error && isMissingContactColumn(withContact.error.message)
      ? await getSupabaseAdmin()
          .from(TABLE)
          .select(COLUMNS)
          .ilike("fast_code", code)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : withContact;
    if (query.error) {
      if (!isMissingTable(query.error.message)) {
        console.error("[personal-home] load failed:", query.error.message);
      }
      return emptyPersonalHomeContent();
    }
    return rowToContent(query.data as Row | null);
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
  contactName: string | null;
  writeUp: string | null;
  buttons: PersonalHomeButton[];
  sideMedia: PersonalHomeSideMedia | null;
}): Promise<{ content?: PersonalHomeContent; error?: "storage" | "media" | "save" }> {
  if (!isSupabaseAdminConfigured()) return { error: "storage" };
  const base = {
    mapsite_id: input.mapsiteId,
    fast_code: input.fastCode.trim().toLowerCase(),
    image_url: input.imageUrl,
    kicker: input.kicker,
    headline: input.headline,
    write_up: input.writeUp,
    buttons: input.buttons,
    updated_at: new Date().toISOString(),
  };
  const withSide = await getSupabaseAdmin()
    .from(TABLE)
    .upsert(
      { ...base, contact_name: input.contactName, side_media: input.sideMedia },
      { onConflict: "mapsite_id" },
    )
    .select(COLUMNS_WITH_SIDE)
    .maybeSingle();
  if (withSide.error && isMissingSideColumn(withSide.error.message) && input.sideMedia) {
    return { error: "media" };
  }
  const withContact = withSide.error && isMissingSideColumn(withSide.error.message)
    ? await getSupabaseAdmin()
        .from(TABLE)
        .upsert({ ...base, contact_name: input.contactName }, { onConflict: "mapsite_id" })
        .select(COLUMNS_WITH_CONTACT)
        .maybeSingle()
    : withSide;
  const saved = withContact.error && isMissingContactColumn(withContact.error.message)
    ? await getSupabaseAdmin()
        .from(TABLE)
        .upsert(
          {
            ...base,
            // buttons is jsonb. This pack is used only when contact_name is missing.
            buttons: packPersonalHomeButtonsForContact(
              normalizePersonalHomeButtons(input.buttons),
              input.contactName,
            ),
          } as unknown as typeof base,
          { onConflict: "mapsite_id" },
        )
        .select(COLUMNS)
        .maybeSingle()
    : withContact;
  if (saved.error) {
    console.error("[personal-home] save failed:", saved.error.message);
    return { error: isMissingTable(saved.error.message) ? "storage" : "save" };
  }
  const row = saved.data as Row | null;
  const content = rowToContent(row);
  return { content };
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
