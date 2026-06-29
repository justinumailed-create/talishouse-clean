"use server";

import type { Database } from "./database.types";
import { requireAdminSession } from "./admin-auth";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { getMapSiteByFastCode } from "./mapsite-service";

export interface MapSiteAdminInput {
  fastCode: string;
  status?: string;
  propertyTitle?: string;
  propertyAddress?: string;
  propertyDescription?: string;
  latitude?: string;
  longitude?: string;
  price?: string;
  logoUrl?: string;
  headerImageUrl?: string;
  profileImageUrl?: string;
  videoUrl?: string;
  galleryImages?: string[];
  agentName?: string;
  email?: string;
  phone?: string;
  website?: string;
  mapZoom?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  atlistMapUrl?: string;
}

export interface MapSiteAdminActionResult {
  success: boolean;
  error?: string;
}

function parseCoordinate(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : null;
}

function parseZoom(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const num = Number.parseInt(value, 10);
  if (!Number.isFinite(num) || num < 1 || num > 21) return null;
  return num;
}

async function uploadMapSiteFile(
  fastCode: string,
  fieldName: string,
  file: File
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const ext = file.name.split(".").pop() || "bin";
  const path = `mapsites/${fastCode.toLowerCase()}/${fieldName}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("mapsite-assets")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error(`[mapsite-admin] Upload failed for ${fieldName}:`, error);
    return null;
  }

  const { data } = supabase.storage.from("mapsite-assets").getPublicUrl(path);
  return data?.publicUrl || null;
}

async function upsertPrimaryPin(
  mapsiteId: string,
  input: MapSiteAdminInput
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const latitude = parseCoordinate(input.latitude);
  const longitude = parseCoordinate(input.longitude);

  const { data: existingPins } = await supabase
    .from("pins")
    .select("id")
    .eq("mapsite_id", mapsiteId)
    .eq("featured", true)
    .limit(1);

  const pinPayload = {
    name: input.propertyTitle?.trim() || "Home PIN",
    description: input.propertyDescription?.trim() || "",
    latitude: latitude ?? 0,
    longitude: longitude ?? 0,
    address: input.propertyAddress?.trim() || "",
    website: input.website?.trim() || "",
    phone: input.phone?.trim() || "",
    email: input.email?.trim() || "",
    featured: true,
  };

  if (existingPins?.[0]?.id) {
    await supabase
      .from("pins")
      .update(pinPayload)
      .eq("id", existingPins[0].id);
    return;
  }

  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", "root")
    .maybeSingle();

  await supabase.from("pins").insert({
    mapsite_id: mapsiteId,
    category_id: category?.id ?? null,
    sort_order: 1,
    city: "",
    province: "",
    postal_code: "",
    country: "",
    ...pinPayload,
  });
}

export async function updateMapSiteAdmin(
  input: MapSiteAdminInput
): Promise<MapSiteAdminActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const mapsite = await getMapSiteByFastCode(input.fastCode);
  if (!mapsite) {
    return { success: false, error: "MapSite not found" };
  }

  const supabase = getSupabaseAdmin();
  const update: Database["public"]["Tables"]["mapsites"]["Update"] = {
    status: input.status,
    property_title: input.propertyTitle?.trim() || null,
    property_address: input.propertyAddress?.trim() || null,
    property_description: input.propertyDescription?.trim() || null,
    latitude: parseCoordinate(input.latitude),
    longitude: parseCoordinate(input.longitude),
    price: input.price?.trim() || null,
    logo_url: input.logoUrl?.trim() || null,
    header_image_url: input.headerImageUrl?.trim() || null,
    profile_image_url: input.profileImageUrl?.trim() || null,
    video_url: input.videoUrl?.trim() || null,
    gallery_images: input.galleryImages ?? mapsite.galleryImages,
    agent_name: input.agentName?.trim() || null,
    email: input.email?.trim() || mapsite.email,
    phone: input.phone?.trim() || "",
    website: input.website?.trim() || null,
    map_zoom: parseZoom(input.mapZoom),
    meta_title: input.metaTitle?.trim() || null,
    meta_description: input.metaDescription?.trim() || null,
    og_image_url: input.ogImageUrl?.trim() || null,
    atlist_map_url: input.atlistMapUrl?.trim() || null,
  };

  const { error } = await supabase
    .from("mapsites")
    .update(update)
    .eq("id", mapsite.id);

  if (error) {
    return { success: false, error: error.message };
  }

  await upsertPrimaryPin(mapsite.id, input);
  return { success: true };
}

export async function saveMapSiteDraft(
  input: MapSiteAdminInput
): Promise<MapSiteAdminActionResult> {
  return updateMapSiteAdmin({ ...input, status: "draft" });
}

export async function publishMapSite(
  input: MapSiteAdminInput
): Promise<MapSiteAdminActionResult> {
  return updateMapSiteAdmin({ ...input, status: "active" });
}

export async function unpublishMapSite(
  fastCode: string
): Promise<MapSiteAdminActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const mapsite = await getMapSiteByFastCode(fastCode);
  if (!mapsite) {
    return { success: false, error: "MapSite not found" };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("mapsites")
    .update({ status: "inactive" })
    .eq("id", mapsite.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function uploadMapSiteAsset(
  formData: FormData
): Promise<MapSiteAdminActionResult & { url?: string }> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const fastCode = (formData.get("fastCode") as string) || "";
  const fieldName = (formData.get("fieldName") as string) || "";
  const file = formData.get("file") as File | null;

  if (!fastCode || !fieldName || !file || file.size === 0) {
    return { success: false, error: "Missing upload data" };
  }

  const url = await uploadMapSiteFile(fastCode, fieldName, file);
  if (!url) {
    return { success: false, error: "Upload failed" };
  }

  return { success: true, url };
}

export async function updateMapSiteGallery(
  fastCode: string,
  galleryImages: string[]
): Promise<MapSiteAdminActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const mapsite = await getMapSiteByFastCode(fastCode);
  if (!mapsite) {
    return { success: false, error: "MapSite not found" };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("mapsites")
    .update({ gallery_images: galleryImages })
    .eq("id", mapsite.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
