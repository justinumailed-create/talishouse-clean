import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/database.types";
import {
  DEFAULT_EDITOR_MAP_SLUG,
  DEFAULT_PIN_CATEGORIES,
  PIN_KIND_CONFIG,
} from "./constants";
import type {
  CreateTalisMapsPinInput,
  TalisMapsEditorBootstrap,
  TalisMapsPinCategoryRecord,
  TalisMapsPinMediaRecord,
  TalisMapsPinRecord,
  UpdateTalisMapsPinInput,
} from "./types";

type PinRow = Database["public"]["Tables"]["talismaps_map_pins"]["Row"];
type CategoryRow = Database["public"]["Tables"]["talismaps_pin_categories"]["Row"];
type MediaRow = Database["public"]["Tables"]["talismaps_pin_media"]["Row"];
type MapRow = Database["public"]["Tables"]["talismaps_maps"]["Row"];

function mapMedia(row: MediaRow): TalisMapsPinMediaRecord {
  return {
    id: row.id,
    pinId: row.pin_id,
    mediaType: row.media_type as TalisMapsPinMediaRecord["mediaType"],
    url: row.url,
    altText: row.alt_text,
    caption: row.caption,
    sortOrder: row.sort_order,
    isPrimary: row.is_primary,
  };
}

function mapCategory(row: CategoryRow): TalisMapsPinCategoryRecord {
  return {
    id: row.id,
    mapId: row.map_id,
    name: row.name,
    slug: row.slug,
    color: row.color,
    icon: row.icon,
    description: row.description,
    sortOrder: row.sort_order,
    isVisible: row.is_visible,
  };
}

function mapPin(
  row: PinRow & {
    talismaps_pin_categories?: { name: string; slug: string; color: string } | null;
    talismaps_map_themes?: { name: string } | null;
    accounts?: { first_name: string; last_name: string } | null;
    talismaps_pin_media?: MediaRow[];
  }
): TalisMapsPinRecord {
  const category = row.talismaps_pin_categories;
  const theme = row.talismaps_map_themes;
  const owner = row.accounts;
  const media = (row.talismaps_pin_media ?? []).map(mapMedia).sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: row.id,
    mapId: row.map_id,
    name: row.name,
    description: row.description,
    pinType: row.pin_type as TalisMapsPinRecord["pinType"],
    latitude: row.latitude,
    longitude: row.longitude,
    categoryId: row.category_id,
    categoryName: category?.name ?? null,
    categorySlug: category?.slug ?? null,
    categoryColor: category?.color ?? PIN_KIND_CONFIG[row.pin_type as keyof typeof PIN_KIND_CONFIG]?.color ?? "#6B7280",
    ownerId: row.owner_id ?? null,
    ownerName: owner ? `${owner.first_name} ${owner.last_name}`.trim() : null,
    visibility: row.visibility as TalisMapsPinRecord["visibility"],
    themeId: row.theme_id ?? null,
    themeName: theme?.name ?? null,
    status: row.status as TalisMapsPinRecord["status"],
    featured: row.featured,
    address: row.address,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
    country: row.country,
    website: row.website,
    phone: row.phone,
    email: row.email,
    sortOrder: row.sort_order,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    media,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const PIN_SELECT = `
  *,
  talismaps_pin_categories(name, slug, color),
  talismaps_map_themes(name),
  accounts(first_name, last_name),
  talismaps_pin_media(*)
`;

async function ensureDefaultCategories(mapId: string): Promise<TalisMapsPinCategoryRecord[]> {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("talismaps_pin_categories")
    .select("*")
    .eq("map_id", mapId)
    .order("sort_order");

  if (existing && existing.length > 0) {
    return existing.map(mapCategory);
  }

  const inserts = DEFAULT_PIN_CATEGORIES.map((category, index) => ({
    map_id: mapId,
    name: category.name,
    slug: category.slug,
    color: category.color,
    sort_order: index,
  }));

  const { data, error } = await supabase
    .from("talismaps_pin_categories")
    .insert(inserts)
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapCategory);
}

async function ensureEditorDraftMap(): Promise<MapRow> {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("talismaps_maps")
    .select("*")
    .eq("slug", DEFAULT_EDITOR_MAP_SLUG)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("talismaps_maps")
    .insert({
      slug: DEFAULT_EDITOR_MAP_SLUG,
      name: "Editor Draft Map",
      description: "Default Talismaps™ editor workspace",
      status: "draft",
      account_type: "root",
      default_latitude: 43.6532,
      default_longitude: -79.3832,
      default_zoom: 11,
      is_public: false,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create editor draft map");
  }

  return data;
}

export async function getEditorBootstrap(): Promise<TalisMapsEditorBootstrap> {
  const map = await ensureEditorDraftMap();
  const categories = await ensureDefaultCategories(map.id);
  const pins = await listPinsForMap(map.id);

  return {
    map: {
      id: map.id,
      slug: map.slug,
      name: map.name,
      status: map.status,
      defaultLatitude: map.default_latitude,
      defaultLongitude: map.default_longitude,
      defaultZoom: map.default_zoom,
    },
    categories,
    pins,
  };
}

export async function listPinsForMap(mapId: string): Promise<TalisMapsPinRecord[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("talismaps_map_pins")
    .select(PIN_SELECT)
    .eq("map_id", mapId)
    .order("sort_order")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapPin(row as Parameters<typeof mapPin>[0]));
}

export async function createPinForMap(
  mapId: string,
  input: CreateTalisMapsPinInput
): Promise<TalisMapsPinRecord> {
  const supabase = getSupabaseAdmin();
  const config = PIN_KIND_CONFIG[input.pinType];
  const categories = await ensureDefaultCategories(mapId);
  const category =
    categories.find((item) => item.slug === input.pinType) ??
    categories.find((item) => item.id === input.categoryId) ??
    categories[0];

  const latitude = input.latitude ?? 43.6532;
  const longitude = input.longitude ?? -79.3832;

  const { data, error } = await supabase
    .from("talismaps_map_pins")
    .insert({
      map_id: mapId,
      name: input.name ?? config.label,
      description: "",
      pin_type: input.pinType,
      latitude,
      longitude,
      category_id: input.categoryId ?? category?.id ?? null,
      visibility: "network",
      status: "draft",
      featured: input.pinType === "property",
      metadata: {},
    })
    .select(PIN_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create pin");
  }

  return mapPin(data as Parameters<typeof mapPin>[0]);
}

export async function updatePinForMap(
  mapId: string,
  pinId: string,
  input: UpdateTalisMapsPinInput
): Promise<TalisMapsPinRecord> {
  const supabase = getSupabaseAdmin();

  const patch: Database["public"]["Tables"]["talismaps_map_pins"]["Update"] = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.pinType !== undefined) patch.pin_type = input.pinType;
  if (input.latitude !== undefined) patch.latitude = input.latitude;
  if (input.longitude !== undefined) patch.longitude = input.longitude;
  if (input.categoryId !== undefined) patch.category_id = input.categoryId;
  if (input.ownerId !== undefined) patch.owner_id = input.ownerId;
  if (input.visibility !== undefined) patch.visibility = input.visibility;
  if (input.themeId !== undefined) patch.theme_id = input.themeId;
  if (input.status !== undefined) patch.status = input.status;
  if (input.featured !== undefined) patch.featured = input.featured;
  if (input.address !== undefined) patch.address = input.address;
  if (input.city !== undefined) patch.city = input.city;
  if (input.province !== undefined) patch.province = input.province;
  if (input.postalCode !== undefined) patch.postal_code = input.postalCode;
  if (input.country !== undefined) patch.country = input.country;
  if (input.website !== undefined) patch.website = input.website;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.email !== undefined) patch.email = input.email;

  const { data, error } = await supabase
    .from("talismaps_map_pins")
    .update(patch)
    .eq("map_id", mapId)
    .eq("id", pinId)
    .select(PIN_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update pin");
  }

  if (input.media) {
    await supabase.from("talismaps_pin_media").delete().eq("pin_id", pinId);
    if (input.media.length > 0) {
      await supabase.from("talismaps_pin_media").insert(
        input.media.map((item, index) => ({
          pin_id: pinId,
          url: item.url,
          media_type: item.mediaType ?? "image",
          alt_text: item.altText ?? "",
          caption: item.caption ?? "",
          is_primary: item.isPrimary ?? index === 0,
          sort_order: item.sortOrder ?? index,
        }))
      );
    }

    const refreshed = await supabase
      .from("talismaps_map_pins")
      .select(PIN_SELECT)
      .eq("id", pinId)
      .single();

    if (refreshed.data) {
      return mapPin(refreshed.data as Parameters<typeof mapPin>[0]);
    }
  }

  return mapPin(data as Parameters<typeof mapPin>[0]);
}

export async function deletePinForMap(mapId: string, pinId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("talismaps_map_pins")
    .delete()
    .eq("map_id", mapId)
    .eq("id", pinId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getPinForMap(
  mapId: string,
  pinId: string
): Promise<TalisMapsPinRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("talismaps_map_pins")
    .select(PIN_SELECT)
    .eq("map_id", mapId)
    .eq("id", pinId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapPin(data as Parameters<typeof mapPin>[0]) : null;
}
