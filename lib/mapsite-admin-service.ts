"use server";

import type { Database } from "./database.types";
import type { MapSiteGalleryItem } from "./mapsite-gallery";
import {
  galleryItemsToLegacyUrls,
  normalizeGalleryItemsForSave,
} from "./mapsite-gallery";
import { requireMapSiteEditAccess } from "./mapsite-edit-auth";
import { isTalisprosAdminAuthenticated } from "./talispros-admin-auth";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "./supabaseAdmin";
import { getMapSiteByFastCode } from "./mapsite-service";
import {
  isLogoUploadField,
  stripLogoBackground,
} from "./media/strip-logo-background";

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
  galleryItems?: MapSiteGalleryItem[];
  agentName?: string;
  email?: string;
  phone?: string;
  website?: string;
  mapZoom?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  atlistMapUrl?: string;
  offeredSubscriptionTier?: string;
  interestFormEnabled?: boolean;
  mlsUrl?: string;
  brokerUrl?: string;
  tebUrl?: string;
  ttvUrl?: string;
}

export interface MapSiteAdminActionResult {
  success: boolean;
  error?: string;
}

const SERVICE_ROLE_ERROR =
  "SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to .env.local and restart the dev server.";

function requireServiceRoleClient(): ReturnType<typeof getSupabaseAdmin> | MapSiteAdminActionResult {
  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: SERVICE_ROLE_ERROR };
  }

  return getSupabaseAdmin();
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
  const client = requireServiceRoleClient();
  if ("success" in client) {
    return null;
  }

  const supabase = client;
  let uploadBody: Buffer | File = file;
  let contentType = file.type;
  let ext = file.name.split(".").pop() || "bin";

  if (isLogoUploadField(fieldName)) {
    try {
      const stripped = await stripLogoBackground(
        Buffer.from(await file.arrayBuffer())
      );
      uploadBody = stripped.buffer;
      contentType = stripped.mimeType;
      ext = "png";
    } catch (err) {
      console.error(`[mapsite-admin] Logo background strip failed:`, err);
    }
  }

  const path = `mapsites/${fastCode.toLowerCase()}/${fieldName}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("mapsite-assets")
    .upload(path, uploadBody, {
      contentType,
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
): Promise<MapSiteAdminActionResult | void> {
  const client = requireServiceRoleClient();
  if ("success" in client) {
    return client;
  }

  const supabase = client;
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
    await requireMapSiteEditAccess(input.fastCode);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const mapsite = await getMapSiteByFastCode(input.fastCode);
  if (!mapsite) {
    return { success: false, error: "Mapsite™ not found" };
  }

  const client = requireServiceRoleClient();
  if ("success" in client) {
    return client;
  }

  const supabase = client;
  const canManageVisitorSubscription = await isTalisprosAdminAuthenticated();
  const galleryItems = normalizeGalleryItemsForSave(
    input.galleryItems ??
      mapsite.galleryItems ??
      (input.galleryImages ?? mapsite.galleryImages).map((url, index) => ({
        url,
        description: "",
        sortOrder: index,
        visible: true,
      }))
  );

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
    gallery_items: galleryItems,
    gallery_images: galleryItemsToLegacyUrls(galleryItems),
    agent_name: input.agentName?.trim() || null,
    email: input.email?.trim() || mapsite.email,
    phone: input.phone?.trim() || "",
    website: input.website?.trim() || null,
    map_zoom: parseZoom(input.mapZoom),
    meta_title: input.metaTitle?.trim() || null,
    meta_description: input.metaDescription?.trim() || null,
    og_image_url: input.ogImageUrl?.trim() || null,
    atlist_map_url: input.atlistMapUrl?.trim() || null,
    offered_subscription_tier: canManageVisitorSubscription
      ? input.offeredSubscriptionTier || "root"
      : mapsite.offeredSubscriptionTier || "root",
    interest_form_enabled: canManageVisitorSubscription
      ? (input.interestFormEnabled ?? true)
      : (mapsite.interestFormEnabled ?? true),
    mls_url: input.mlsUrl?.trim() || null,
    broker_url: input.brokerUrl?.trim() || null,
    teb_url: input.tebUrl?.trim() || null,
    ttv_url: input.ttvUrl?.trim() || null,
  };

  const { error } = await supabase
    .from("mapsites")
    .update(update)
    .eq("id", mapsite.id);

  if (error) {
    return { success: false, error: error.message };
  }

  const pinResult = await upsertPrimaryPin(mapsite.id, input);
  if (pinResult && "success" in pinResult && !pinResult.success) {
    return pinResult;
  }

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
    await requireMapSiteEditAccess(fastCode);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const mapsite = await getMapSiteByFastCode(fastCode);
  if (!mapsite) {
    return { success: false, error: "Mapsite™ not found" };
  }

  const client = requireServiceRoleClient();
  if ("success" in client) {
    return client;
  }

  const { error } = await client
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
  const fastCode = (formData.get("fastCode") as string) || "";

  try {
    await requireMapSiteEditAccess(fastCode);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const fieldName = (formData.get("fieldName") as string) || "";
  const file = formData.get("file") as File | null;

  if (!fastCode || !fieldName || !file || file.size === 0) {
    return { success: false, error: "Missing upload data" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: SERVICE_ROLE_ERROR };
  }

  const url = await uploadMapSiteFile(fastCode, fieldName, file);
  if (!url) {
    return { success: false, error: "Upload failed" };
  }

  return { success: true, url };
}

export async function updateMapSiteGallery(
  fastCode: string,
  galleryItems: MapSiteGalleryItem[]
): Promise<MapSiteAdminActionResult> {
  try {
    await requireMapSiteEditAccess(fastCode);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const mapsite = await getMapSiteByFastCode(fastCode);
  if (!mapsite) {
    return { success: false, error: "Mapsite™ not found" };
  }

  const client = requireServiceRoleClient();
  if ("success" in client) {
    return client;
  }

  const normalized = normalizeGalleryItemsForSave(galleryItems);

  const { error } = await client
    .from("mapsites")
    .update({
      gallery_items: normalized,
      gallery_images: galleryItemsToLegacyUrls(normalized),
    })
    .eq("id", mapsite.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
