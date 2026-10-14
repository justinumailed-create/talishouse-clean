import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  emptyMapSiteOwnerCustomizations,
  normalizeBookshelfOrder,
  type MapSiteOwnerCustomizations,
} from "@/lib/talispros/mapsite-owner-customizations";

export const MAPSITE_OWNER_CUSTOMIZATIONS_MIGRATION_HINT =
  "Dashboard storage is not ready. Apply supabase/migrations/093_mapsite_owner_customizations.sql.";

const TABLE = "mapsite_owner_customizations";

type Row = {
  mapsite_id: string;
  fast_code: string;
  logo_url: string | null;
  partner_image_url: string | null;
  partner_name?: string | null;
  partner_tagline?: string | null;
  card_title?: string | null;
  card_address?: string | null;
  card_phone?: string | null;
  contract_text?: string | null;
  bookshelf_order: unknown;
  updated_at?: string | null;
};

const COLUMNS_V2 =
  "mapsite_id, fast_code, logo_url, partner_image_url, partner_name, partner_tagline, card_title, card_address, card_phone, contract_text, bookshelf_order, updated_at";
const COLUMNS_V1 =
  "mapsite_id, fast_code, logo_url, partner_image_url, partner_name, partner_tagline, bookshelf_order, updated_at";
/** Falls back to the pre-107 column list if migration 107 is not applied yet. */
let COLUMNS = COLUMNS_V2;
function downgradeColumns(message: string | undefined): boolean {
  if (COLUMNS === COLUMNS_V2 && /card_|contract_text|column/i.test(message || "")) {
    COLUMNS = COLUMNS_V1;
    return true;
  }
  return false;
}

function rowToCustomizations(row: Row | null | undefined): MapSiteOwnerCustomizations {
  if (!row) return emptyMapSiteOwnerCustomizations();
  return {
    logoUrl: row.logo_url?.trim() || null,
    partnerImageUrl: row.partner_image_url?.trim() || null,
    partnerName: row.partner_name?.trim() || null,
    partnerTagline: row.partner_tagline?.trim() || null,
    cardTitle: row.card_title?.trim() || null,
    cardAddress: row.card_address?.trim() || null,
    cardPhone: row.card_phone?.trim() || null,
    contractText: row.contract_text?.trim() || null,
    bookshelfOrder: normalizeBookshelfOrder(row.bookshelf_order),
    updatedAt: row.updated_at ?? null,
  };
}

/** Read overrides by Mapsite id. Never throws — a missing table reads as empty. */
export async function loadMapSiteOwnerCustomizations(
  mapsiteId: string | null | undefined,
): Promise<MapSiteOwnerCustomizations> {
  const id = mapsiteId?.trim() || "";
  if (!id || !isSupabaseAdminConfigured()) return emptyMapSiteOwnerCustomizations();
  try {
    const read = () =>
      getSupabaseAdmin().from(TABLE).select(COLUMNS).eq("mapsite_id", id).maybeSingle();
    let { data, error } = await read();
    if (error && downgradeColumns(error.message)) ({ data, error } = await read());
    if (error) return emptyMapSiteOwnerCustomizations();
    return rowToCustomizations(data as Row | null);
  } catch {
    return emptyMapSiteOwnerCustomizations();
  }
}

/** Overrides by FAST Code (public surfaces that only know the code). Never throws. */
export async function loadMapSiteOwnerCustomizationsByFastCode(
  fastCode: string | null | undefined,
): Promise<MapSiteOwnerCustomizations> {
  const code = fastCode?.trim().toLowerCase() || "";
  if (!code || !isSupabaseAdminConfigured()) return emptyMapSiteOwnerCustomizations();
  try {
    const read = () =>
      getSupabaseAdmin()
        .from(TABLE)
        .select(COLUMNS)
        .ilike("fast_code", code)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
    let { data, error } = await read();
    if (error && downgradeColumns(error.message)) ({ data, error } = await read());
    if (error) return emptyMapSiteOwnerCustomizations();
    return rowToCustomizations(data as Row | null);
  } catch {
    return emptyMapSiteOwnerCustomizations();
  }
}

/** Saved shelf order for a FAST Code (used by every FAST-scoped bookshelf). */
export async function loadBookshelfOrderForFastCode(
  fastCode: string | null | undefined,
): Promise<string[]> {
  const code = fastCode?.trim().toLowerCase() || "";
  if (!code || !isSupabaseAdminConfigured()) return [];
  try {
    const { data, error } = await getSupabaseAdmin()
      .from(TABLE)
      .select("bookshelf_order, fast_code")
      .ilike("fast_code", code)
      .limit(1)
      .maybeSingle();
    if (error || !data) return [];
    return normalizeBookshelfOrder((data as Row).bookshelf_order);
  } catch {
    return [];
  }
}

/** Upsert a partial patch. Callers must authorize first (requireMapSiteEditAccess). */
export async function saveMapSiteOwnerCustomizations(input: {
  mapsiteId: string;
  fastCode: string;
  patch: Partial<{
    logo_url: string | null;
    partner_image_url: string | null;
    partner_name: string | null;
    partner_tagline: string | null;
    card_title: string | null;
    card_address: string | null;
    card_phone: string | null;
    contract_text: string | null;
    bookshelf_order: string[];
  }>;
}): Promise<{ customizations?: MapSiteOwnerCustomizations; error?: string }> {
  if (!isSupabaseAdminConfigured()) return { error: "Database is not configured." };
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        mapsite_id: input.mapsiteId,
        fast_code: input.fastCode.trim().toLowerCase(),
        ...input.patch,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "mapsite_id" },
    )
    .select(COLUMNS)
    .maybeSingle();
  if (error) {
    const missing = /relation|does not exist|schema cache/i.test(error.message || "");
    console.error("[mapsite-owner-customizations] save failed:", error.message);
    return {
      error: missing ? MAPSITE_OWNER_CUSTOMIZATIONS_MIGRATION_HINT : "Could not save changes.",
    };
  }
  return { customizations: rowToCustomizations(data as Row | null) };
}

/** Mapsite id + FAST Code pairing check (never trust the client pairing). */
export async function readMapSiteIdentity(
  mapsiteId: string,
): Promise<{ id: string; fastCode: string; isDemonstration: boolean } | null> {
  if (!mapsiteId.trim() || !isSupabaseAdminConfigured()) return null;
  const { data } = await getSupabaseAdmin()
    .from("mapsites")
    .select("id, fast_code, is_demonstration")
    .eq("id", mapsiteId.trim())
    .maybeSingle();
  if (!data?.id || !data.fast_code) return null;
  return {
    id: data.id,
    fastCode: data.fast_code.trim().toLowerCase(),
    isDemonstration: Boolean(data.is_demonstration),
  };
}
