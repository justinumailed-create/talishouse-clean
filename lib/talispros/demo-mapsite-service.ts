import { clampMapZoom } from "@/lib/home-pin-coordinates";
import {
  getSupabaseAdmin,
  isSupabaseAdminConfigured,
} from "@/lib/supabaseAdmin";
import {
  createDemoMapSiteCode,
  DEMO_PINNED_COVER_IMAGE,
  DEMO_PINNED_EBOOK_HREF,
  isDemoMapSiteCode,
  isProtectedPlatformDemoMapSite,
} from "@/lib/talispros/demo-mapsite";
import { MAPSITE_APP_PATH, publishedMapSitePath } from "@/lib/talispros/mapsite-state";

export type DemoMapSiteRecord = {
  id: string;
  fastCode: string;
  propertyTitle: string;
  propertyAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  mapZoom: number | null;
  status: string;
  tebUrl: string | null;
  createdAt: string | null;
  isPlatformSeed: boolean;
};

export type CreateDemoMapSiteInput = {
  propertyTitle?: string | null;
  streetAddress?: string | null;
  latitude: number;
  longitude: number;
  mapZoom?: number | null;
  description?: string | null;
};

export type CreateDemoMapSiteResult =
  | {
      ok: true;
      mapsiteId: string;
      code: string;
      mapsiteHref: string;
      publishedHref: string;
      ebookHref: string;
    }
  | { ok: false; error: string };

function demoApplicationHref(mapsiteId: string): string {
  const params = new URLSearchParams({
    view: "pin",
    mapsiteId,
  });
  return `${MAPSITE_APP_PATH}?${params.toString()}`;
}

export async function createDemoMapSiteWithPinnedEbook(
  input: CreateDemoMapSiteInput,
): Promise<CreateDemoMapSiteResult> {
  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      error: "Demo Mapsite™ creation is unavailable until storage is configured.",
    };
  }

  if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) {
    return { ok: false, error: "Place a pin on the map to continue." };
  }

  const title =
    input.propertyTitle?.trim() || "Demo Mapsite™";
  const address = input.streetAddress?.trim() || null;
  const description =
    input.description?.trim() ||
    "Demonstration Mapsite™ with the pinned Talispros eBook. No FAST Code is issued.";
  const mapZoom = clampMapZoom(input.mapZoom ?? 12);

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  let code = createDemoMapSiteCode();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data: existing } = await supabase
      .from("mapsites")
      .select("id")
      .ilike("fast_code", code)
      .maybeSingle();
    if (!existing) break;
    code = createDemoMapSiteCode();
  }

  const insert = {
    fast_code: code,
    slug: code,
    account_type: "root",
    owner_first_name: "Demo",
    owner_last_name: "Mapsite",
    agent_name: "Demo Mapsite™",
    email: "demo@talispros.com",
    phone: "",
    status: "active",
    property_title: title,
    property_address: address,
    property_description: description,
    latitude: input.latitude,
    longitude: input.longitude,
    map_zoom: mapZoom,
    cover_image: DEMO_PINNED_COVER_IMAGE,
    header_image_url: DEMO_PINNED_COVER_IMAGE,
    gallery_images: [DEMO_PINNED_COVER_IMAGE],
    teb_url: DEMO_PINNED_EBOOK_HREF,
    is_demonstration: true,
    interest_form_enabled: false,
    offered_subscription_tier: "root",
    updated_at: now,
  };

  const { data: created, error } = await supabase
    .from("mapsites")
    .insert(insert)
    .select("id, fast_code")
    .single();

  if (error || !created) {
    return {
      ok: false,
      error: error?.message || "Could not create the demo Mapsite™.",
    };
  }

  const savedCode = created.fast_code?.trim().toLowerCase() || code;

  return {
    ok: true,
    mapsiteId: created.id,
    code: savedCode,
    mapsiteHref: demoApplicationHref(created.id),
    publishedHref: publishedMapSitePath(savedCode),
    ebookHref: DEMO_PINNED_EBOOK_HREF,
  };
}

export async function listDemoMapSites(): Promise<DemoMapSiteRecord[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mapsites")
    .select(
      "id, fast_code, property_title, property_address, latitude, longitude, map_zoom, status, teb_url, created_at",
    )
    .eq("is_demonstration", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    fastCode: row.fast_code,
    propertyTitle: row.property_title || "Demo Mapsite™",
    propertyAddress: row.property_address,
    latitude: row.latitude,
    longitude: row.longitude,
    mapZoom: row.map_zoom,
    status: row.status,
    tebUrl: row.teb_url,
    createdAt: row.created_at,
    isPlatformSeed: isProtectedPlatformDemoMapSite(row.id),
  }));
}

export async function updateDemoMapSite(input: {
  mapsiteId: string;
  propertyTitle?: string;
  propertyAddress?: string;
  latitude?: number;
  longitude?: number;
  mapZoom?: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Storage is not configured." };
  }

  const mapsiteId = input.mapsiteId.trim();
  if (!mapsiteId) return { ok: false, error: "Missing Mapsite™ ID." };

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    teb_url: DEMO_PINNED_EBOOK_HREF,
  };
  if (input.propertyTitle !== undefined) {
    patch.property_title = input.propertyTitle.trim() || "Demo Mapsite™";
  }
  if (input.propertyAddress !== undefined) {
    patch.property_address = input.propertyAddress.trim() || null;
  }
  if (input.latitude !== undefined && Number.isFinite(input.latitude)) {
    patch.latitude = input.latitude;
  }
  if (input.longitude !== undefined && Number.isFinite(input.longitude)) {
    patch.longitude = input.longitude;
  }
  if (input.mapZoom !== undefined) {
    patch.map_zoom = clampMapZoom(input.mapZoom);
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("mapsites")
    .update(patch)
    .eq("id", mapsiteId)
    .eq("is_demonstration", true);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteDemoMapSite(
  mapsiteId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Storage is not configured." };
  }

  const id = mapsiteId.trim();
  if (!id) return { ok: false, error: "Missing Mapsite™ ID." };
  if (isProtectedPlatformDemoMapSite(id)) {
    return {
      ok: false,
      error: "The platform demonstration pin cannot be deleted.",
    };
  }

  const supabase = getSupabaseAdmin();
  const { data: row, error: loadError } = await supabase
    .from("mapsites")
    .select("id, fast_code, is_demonstration")
    .eq("id", id)
    .maybeSingle();

  if (loadError) return { ok: false, error: loadError.message };
  if (!row?.is_demonstration) {
    return { ok: false, error: "That Mapsite™ is not a demonstration listing." };
  }
  if (!isDemoMapSiteCode(row.fast_code) && row.fast_code?.toUpperCase() !== "DEMO") {
    return { ok: false, error: "That listing is not a demo Mapsite™." };
  }
  if (row.fast_code?.toUpperCase() === "DEMO") {
    return {
      ok: false,
      error: "The platform demonstration pin cannot be deleted.",
    };
  }

  const { error } = await supabase.from("mapsites").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
