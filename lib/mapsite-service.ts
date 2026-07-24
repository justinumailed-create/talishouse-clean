import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import {
  galleryItemsToLegacyUrls,
  resolveMapsiteGalleryItems,
  type MapSiteGalleryItem,
} from "./mapsite-gallery";
import type { CreateAccountResult } from "./account-service";
import { generateMapSiteSlug } from "./slug-generator";
import { disableSupabaseAdminClient, getSupabaseAdmin, tryGetSupabaseAdmin } from "./supabaseAdmin";
import { supabase } from "./supabaseClient";

export interface CreateMapSiteForAccountInput {
  accountId: string;
  fastCode: string;
  accountType: string;
  ownerFirstName: string;
  ownerLastName: string;
  email: string;
  phone?: string | null;
}

export interface CreateMapSiteForAccountResult {
  id: string;
  fastCode: string;
  accountId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MapSitePinView {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  website: string;
  phone: string;
  email: string;
  featured: boolean;
  sortOrder: number;
}

export interface MapSiteListItem {
  fastCode: string;
  status: string;
  propertyTitle: string | null;
}

export interface MapSiteView {
  id: string;
  fastCode: string;
  accountId: string | null;
  slug: string;
  accountType: string;
  ownerFirstName: string;
  ownerLastName: string;
  agentName: string | null;
  email: string;
  phone: string;
  website: string | null;
  status: string;
  propertyTitle: string | null;
  propertyAddress: string | null;
  propertyDescription: string | null;
  latitude: number | null;
  longitude: number | null;
  price: string | null;
  profileImageUrl: string | null;
  logoUrl: string | null;
  headerImageUrl: string | null;
  videoUrl: string | null;
  galleryImages: string[];
  galleryItems: MapSiteGalleryItem[];
  mapZoom: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
  atlistMapUrl: string | null;
  offeredSubscriptionTier: string;
  interestFormEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  pins: MapSitePinView[];
  mlsUrl: string | null;
  brokerUrl: string | null;
  tebUrl: string | null;
  ttvUrl: string | null;
  /** Build request linked to this FAST Code (for claimed MapSite URLs). */
  requestId?: string | null;
  /** Market audience from the claim form (listings, brokers, …). */
  claimAudience?: string | null;
}

function isServiceRolePermissionError(message: string): boolean {
  return message.toLowerCase().includes("permission denied for schema public");
}

async function queryWithAdminFallback<T>(
  run: (
    client: SupabaseClient<Database>
  ) => PromiseLike<{ data: T | null; error: { message: string } | null }>
): Promise<{ data: T | null; error: string | null }> {
  const admin = tryGetSupabaseAdmin();
  if (admin) {
    const adminResult = await run(admin);
    if (!adminResult.error) {
      return { data: adminResult.data, error: null };
    }
    if (isServiceRolePermissionError(adminResult.error.message)) {
      disableSupabaseAdminClient();
    }
  }

  const anonResult = await run(supabase);
  return {
    data: anonResult.data,
    error: anonResult.error?.message ?? null,
  };
}

export async function listMapSitesForAdmin(): Promise<MapSiteListItem[]> {
  const { data, error } = await queryWithAdminFallback((client) =>
    client
      .from("mapsites")
      .select("fast_code, status, property_title")
      .order("created_at", { ascending: false })
  );

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    fastCode: row.fast_code,
    status: row.status,
    propertyTitle: row.property_title,
  }));
}

export async function getMapSiteByFastCode(
  fastCode: string
): Promise<MapSiteView | null> {
  const result = await getMapSiteByFastCodeResult(fastCode);
  return result.mapsite;
}

export async function getMapSiteByFastCodeResult(
  fastCode: string
): Promise<{ mapsite: MapSiteView | null; error: string | null }> {
  const code = fastCode.trim();
  if (!code) {
    return { mapsite: null, error: null };
  }

  const admin = tryGetSupabaseAdmin();
  if (admin) {
    const adminResult = await fetchMapSiteByFastCode(admin, code);
    if (!adminResult.error || adminResult.mapsite) {
      return adminResult;
    }
    if (adminResult.error && isServiceRolePermissionError(adminResult.error)) {
      disableSupabaseAdminClient();
    }
  }

  return fetchMapSiteByFastCode(supabase, code);
}

async function fetchMapSiteByFastCode(
  client: SupabaseClient<Database>,
  code: string
): Promise<{ mapsite: MapSiteView | null; error: string | null }> {
  const { data: fastCodeRow } = await client
    .from("fast_codes")
    .select("mapsite_id, request_id, code")
    .ilike("code", code)
    .maybeSingle();

  const { data: mapsiteByCode, error } = await client
    .from("mapsites")
    .select("*")
    .ilike("fast_code", code)
    .maybeSingle();

  if (error) {
    return { mapsite: null, error: error.message };
  }

  let linkedId = mapsiteByCode?.id ?? fastCodeRow?.mapsite_id ?? null;

  if (!linkedId && fastCodeRow?.request_id) {
    const { data: buildRequest } = await client
      .from("build_requests")
      .select("linked_mapsite_id")
      .eq("id", fastCodeRow.request_id)
      .maybeSingle();
    linkedId = buildRequest?.linked_mapsite_id ?? null;
  }

  let mapsiteRow = mapsiteByCode;

  if (!mapsiteRow && linkedId) {
    const { data: linkedMapsite, error: linkedError } = await client
      .from("mapsites")
      .select("*")
      .eq("id", linkedId)
      .maybeSingle();

    if (linkedError) {
      return { mapsite: null, error: linkedError.message };
    }
    mapsiteRow = linkedMapsite;
  }

  if (!mapsiteRow) {
    return { mapsite: null, error: null };
  }

  // Always present the looked-up FAST Code (claims can overwrite mapsites.fast_code).
  const mapsiteView = await buildMapSiteView(client, mapsiteRow, {
    displayFastCode: code,
    requestId: fastCodeRow?.request_id ?? null,
  });
  return { mapsite: mapsiteView, error: null };
}

async function buildMapSiteView(
  client: SupabaseClient<Database>,
  mapsite: Database["public"]["Tables"]["mapsites"]["Row"],
  options?: {
    displayFastCode?: string;
    requestId?: string | null;
  }
): Promise<MapSiteView> {
  const displayFastCode =
    options?.displayFastCode?.trim() || mapsite.fast_code;

  const { data: pinRows } = await client
    .from("pins")
    .select("*")
    .eq("mapsite_id", mapsite.id)
    .order("sort_order");

  let requestId = options?.requestId?.trim() || null;

  if (!requestId) {
    const { data: fastCodeRow } = await client
      .from("fast_codes")
      .select("request_id")
      .ilike("code", displayFastCode)
      .maybeSingle();
    requestId = fastCodeRow?.request_id ?? null;
  }

  if (!requestId) {
    const { data: fastCodeByMapsite } = await client
      .from("fast_codes")
      .select("request_id")
      .eq("mapsite_id", mapsite.id)
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    requestId = fastCodeByMapsite?.request_id ?? null;
  }

  let assets: {
    profile_image: string | null;
    logo_image: string | null;
    pin_image: string | null;
  } | null = null;
  let claimAudience: string | null = null;

  if (requestId) {
    const [{ data: assetRow }, { data: buildRequest }] = await Promise.all([
      client
        .from("mapsite_assets")
        .select("profile_image, logo_image, pin_image")
        .eq("request_id", requestId)
        .maybeSingle(),
      client
        .from("build_requests")
        .select("market_type, status")
        .eq("id", requestId)
        .maybeSingle(),
    ]);
    assets = assetRow;
    claimAudience = buildRequest?.market_type?.trim() || null;
  }

  const pins: MapSitePinView[] = (pinRows || []).map((pin) => ({
    id: pin.id,
    name: pin.name,
    description: pin.description || "",
    latitude: pin.latitude,
    longitude: pin.longitude,
    address: pin.address || "",
    city: pin.city || "",
    province: pin.province || "",
    postalCode: pin.postal_code || "",
    country: pin.country || "",
    website: pin.website || "",
    phone: pin.phone || "",
    email: pin.email || "",
    featured: pin.featured || false,
    sortOrder: pin.sort_order || 0,
  }));

  const galleryItems = resolveMapsiteGalleryItems(
    mapsite.gallery_items,
    mapsite.gallery_images || []
  );

  return {
    id: mapsite.id,
    fastCode: displayFastCode,
    accountId: mapsite.account_id,
    slug: mapsite.slug,
    accountType: mapsite.account_type,
    ownerFirstName: mapsite.owner_first_name,
    ownerLastName: mapsite.owner_last_name,
    agentName: mapsite.agent_name,
    email: mapsite.email,
    phone: mapsite.phone || "",
    website: mapsite.website,
    status: mapsite.status,
    propertyTitle: mapsite.property_title,
    propertyAddress: mapsite.property_address,
    propertyDescription: mapsite.property_description,
    latitude: mapsite.latitude,
    longitude: mapsite.longitude,
    price: mapsite.price,
    profileImageUrl:
      mapsite.profile_image_url || assets?.profile_image || null,
    logoUrl: mapsite.logo_url || assets?.logo_image || null,
    headerImageUrl: mapsite.header_image_url || null,
    videoUrl: mapsite.video_url,
    galleryImages: galleryItemsToLegacyUrls(galleryItems),
    galleryItems,
    mapZoom: mapsite.map_zoom,
    metaTitle: mapsite.meta_title,
    metaDescription: mapsite.meta_description,
    ogImageUrl: mapsite.og_image_url,
    atlistMapUrl: mapsite.atlist_map_url,
    offeredSubscriptionTier: mapsite.offered_subscription_tier ?? "root",
    interestFormEnabled: mapsite.interest_form_enabled ?? true,
    createdAt: mapsite.created_at,
    updatedAt: mapsite.updated_at,
    pins,
    mlsUrl: mapsite.mls_url ?? null,
    brokerUrl: mapsite.broker_url ?? null,
    tebUrl: mapsite.teb_url ?? null,
    ttvUrl: mapsite.ttv_url ?? null,
    requestId,
    claimAudience,
  };
}

import { buildClaimedMapSitePath } from "@/lib/talispros/mapsite-state";

/** Public claimed MapSite URL used after Claim a Market / from admin. */
export function buildClaimedMapSiteHref(options: {
  mapsiteId: string;
  fastCode: string;
  requestId?: string | null;
  audience?: string | null;
  accountType?: string | null;
}): string {
  return buildClaimedMapSitePath({
    fastCode: options.fastCode,
    accountType: options.accountType,
    audience: options.audience,
  });
}

export async function getPublicMapSiteByFastCode(
  fastCode: string
): Promise<MapSiteView | null> {
  const mapsite = await getMapSiteByFastCode(fastCode);
  if (!mapsite) return null;
  if (mapsite.status !== "active" && mapsite.status !== "draft") return null;
  return mapsite;
}

export async function createMapSiteForAccount(
  input: CreateMapSiteForAccountInput
): Promise<CreateMapSiteForAccountResult> {
  const fastCode = input.fastCode.trim().toLowerCase();

  if (!fastCode) {
    throw new Error("FAST Code is required to create a MapSite");
  }
  if (!input.accountId) {
    throw new Error("Account ID is required to create a MapSite");
  }

  const supabase = getSupabaseAdmin();

  const { data: existingSlugs, error: slugError } = await supabase
    .from("mapsites")
    .select("slug");

  if (slugError) {
    throw new Error(`Failed to fetch existing MapSite slugs: ${slugError.message}`);
  }

  const slug = await generateMapSiteSlug(
    (existingSlugs || []).map((row) => row.slug)
  );

  const record: Database["public"]["Tables"]["mapsites"]["Insert"] = {
    fast_code: fastCode,
    account_id: input.accountId,
    slug,
    account_type: input.accountType,
    owner_first_name: input.ownerFirstName.trim(),
    owner_last_name: input.ownerLastName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || "",
    status: "draft",
  };

  const { data, error } = await supabase
    .from("mapsites")
    .insert(record)
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create MapSite: ${error?.message || "Unknown error"}`
    );
  }

  return {
    id: data.id,
    fastCode: data.fast_code,
    accountId: data.account_id!,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function createMapSiteFromAccount(
  account: CreateAccountResult,
  options?: { phone?: string | null; accountType?: string }
): Promise<CreateMapSiteForAccountResult> {
  return createMapSiteForAccount({
    accountId: account.id,
    fastCode: account.fastCode,
    accountType: options?.accountType || account.accountType,
    ownerFirstName: account.firstName,
    ownerLastName: account.lastName,
    email: account.email || "",
    phone: options?.phone,
  });
}
