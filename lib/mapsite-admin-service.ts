"use server";

import type { Database } from "./database.types";
import type { MapSiteGalleryItem } from "./mapsite-gallery";
import {
  galleryItemsToLegacyUrls,
  normalizeGalleryItemsForSave,
} from "./mapsite-gallery";
import { requireMapSiteEditAccess } from "./mapsite-edit-auth";
import { isAdminAuthenticated } from "./admin-auth";
import { isTalisprosAdminAuthenticated } from "./talispros-admin-auth";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "./supabaseAdmin";
import { getMapSiteByFastCode } from "./mapsite-service";
import { ensureMapSiteTalisMap } from "@/lib/talismaps/map-service";
import { buildClaimedMapSitePath } from "@/lib/talispros/mapsite-state";
import { shouldKeepPlatformDemoMapSite } from "@/lib/talispros/demo-mapsite";
import { adminMapSiteDeleteControl } from "@/lib/talispros/admin-mapsite-delete";
import { paymentProtectsMapSiteFromDelete } from "@/lib/fast-code-admin-payment";
import { unlinkAndDeleteMapSite, deleteBookshelfForFastCode } from "@/lib/talispros/fast-code-cascade-delete";
import { revalidatePath } from "next/cache";
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
  pinIcon?: string | null;
  pinColor?: string | null;
  pinBorder?: string | null;
  pinWhiteCenter?: boolean | null;
  pinAnimated?: boolean | null;
  pinCategoryBadge?: string | null;
  pinLabel?: string | null;
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
  mapHref?: string;
}

export interface MapSiteSeoInput {
  fastCode: string;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
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

  await persistBuildRequestPin(supabase, mapsite, input);

  const latitude = parseCoordinate(input.latitude);
  const longitude = parseCoordinate(input.longitude);
  const zoom = parseZoom(input.mapZoom);
  const mapResult = await ensureMapSiteTalisMap({
    mapsiteId: mapsite.id,
    fastCode: mapsite.fastCode,
    name: input.propertyTitle?.trim() || mapsite.propertyTitle || mapsite.fastCode,
    description: input.propertyDescription?.trim() || mapsite.propertyDescription,
    accountType: mapsite.accountType,
    latitude,
    longitude,
    zoom,
    pinStyle: {
      pinIcon: input.pinIcon ?? null,
      pinColor: input.pinColor ?? null,
      pinBorder: input.pinBorder ?? null,
      pinWhiteCenter: input.pinWhiteCenter ?? null,
      pinAnimated: input.pinAnimated ?? null,
      pinCategoryBadge: input.pinCategoryBadge ?? null,
      pinLabel: input.pinLabel ?? null,
    },
  });
  if (!mapResult.ok) {
    return { success: false, error: mapResult.error };
  }

  const mapHref = buildClaimedMapSitePath({
    fastCode: mapsite.fastCode,
    accountType: mapsite.claimAudience || mapsite.accountType,
  });
  await supabase
    .from("mapsites")
    .update({ atlist_map_url: mapHref })
    .eq("id", mapsite.id);

  return { success: true, mapHref };
}

async function persistBuildRequestPin(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  mapsite: { id: string; fastCode: string; requestId?: string | null },
  input: MapSiteAdminInput,
): Promise<void> {
  let id = mapsite.requestId?.trim() || "";

  if (!id) {
    const { data: byMap } = await supabase
      .from("build_requests")
      .select("id")
      .eq("linked_mapsite_id", mapsite.id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    id = byMap?.id?.trim() || "";
  }

  if (!id && mapsite.fastCode.trim()) {
    const { data: byCode } = await supabase
      .from("build_requests")
      .select("id")
      .ilike("requested_fast_code", mapsite.fastCode.trim())
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    id = byCode?.id?.trim() || "";
  }

  if (!id) return;

  await supabase
    .from("build_requests")
    .update({
      street_address: input.propertyAddress?.trim() || null,
      pin_writeup: input.propertyDescription?.trim() || null,
      latitude: parseCoordinate(input.latitude),
      longitude: parseCoordinate(input.longitude),
      future_pin_icon: input.pinIcon?.trim() || null,
      future_pin_color: input.pinColor?.trim() || null,
      future_pin_border: input.pinBorder?.trim() || null,
      future_pin_white_center: input.pinWhiteCenter ?? false,
      future_pin_animated: input.pinAnimated ?? false,
      future_pin_category_badge: input.pinCategoryBadge?.trim() || null,
      future_pin_label: input.pinLabel?.trim() || input.propertyTitle?.trim() || null,
    })
    .eq("id", id);
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

export async function saveMapSiteSeo(
  input: MapSiteSeoInput,
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

  const { error } = await client
    .from("mapsites")
    .update({
      meta_title: input.metaTitle.trim() || null,
      meta_description: input.metaDescription.trim() || null,
      og_image_url: input.ogImageUrl.trim() || null,
    })
    .eq("id", mapsite.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/seo");
  revalidatePath(`/admin/mapsites/${mapsite.fastCode}`);
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

export async function deleteAdminActiveMapSite(
  fastCode: string,
  mapsiteId?: string | null,
): Promise<MapSiteAdminActionResult> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, error: "Unauthorized" };
  }

  const code = fastCode.trim();
  if (!code) {
    return { success: false, error: "FAST code is required." };
  }

  const client = requireServiceRoleClient();
  if ("success" in client) {
    return client;
  }

  let query = client.from("mapsites").select("id, fast_code, status");
  const id = mapsiteId?.trim() || "";
  if (id) {
    query = query.eq("id", id);
  } else {
    query = query.ilike("fast_code", code);
  }
  const { data: rows, error: loadError } = await query;
  if (loadError) {
    return { success: false, error: loadError.message };
  }
  const mapsites = rows ?? [];
  if (mapsites.length === 0) {
    return { success: false, error: "Mapsite™ not found" };
  }

  for (const mapsite of mapsites) {
    if (
      shouldKeepPlatformDemoMapSite({
        mapsiteId: mapsite.id,
        fastCode: mapsite.fast_code || code,
      })
    ) {
      return {
        success: false,
        error: "The platform demonstration Mapsite™ cannot be deleted.",
      };
    }

    const [{ data: byId }, { data: byCode }] = await Promise.all([
      client
        .from("talispros_payments")
        .select("payment_status, fast_code, mapsite_id")
        .eq("mapsite_id", mapsite.id)
        .limit(50),
      client
        .from("talispros_payments")
        .select("payment_status, fast_code, mapsite_id")
        .ilike("fast_code", mapsite.fast_code || code)
        .limit(50),
    ]);

    const paymentReceived = paymentProtectsMapSiteFromDelete(
      { id: mapsite.id, fastCode: mapsite.fast_code || code },
      [...(byId ?? []), ...(byCode ?? [])],
    );
    const control = adminMapSiteDeleteControl({
      status: mapsite.status,
      paymentReceived,
    });

    if (control === "lock") {
      return {
        success: false,
        error: "Paid Mapsites™ are delete-protected.",
      };
    }
    if (control !== "delete") {
      return {
        success: false,
        error: "Only active unpaid Mapsites™ can be deleted from this list.",
      };
    }

    await deleteBookshelfForFastCode(client, mapsite.fast_code || code, mapsite.id);
    const deleted = await unlinkAndDeleteMapSite(
      client,
      mapsite.id,
      mapsite.fast_code || code,
    );
    if (!deleted.ok) {
      return { success: false, error: deleted.error };
    }
  }

  revalidatePath("/admin/mapsites");
  revalidatePath("/admin/talisbooks");
  revalidatePath("/admin/talisbooks/bookshelves");
  return { success: true };
}
