import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  DEMO_MAPSITE_FAST_CODE,
  DEMO_MAPSITE_ID,
  toDbStatus,
  toPlatformStatus,
  type MapSitePlatformStatus,
  assertTransition,
} from "@/lib/talispros/mapsite-state";

export type MapSitePlatformRecord = {
  id: string;
  fast_code: string | null;
  status: MapSitePlatformStatus;
  lat: number;
  lng: number;
  property_title: string;
  property_address: string | null;
  property_description: string | null;
  cover_image: string | null;
  gallery_images: string[];
  mls_url: string | null;
  broker_url: string | null;
  teb_url: string | null;
  ttv_url: string | null;
  assigned_marketing_manager: string | null;
  is_demonstration: boolean;
  created_at: string | null;
  updated_at: string | null;
  /** From the linked Build Request when MapSite row is still on demo coordinates. */
  pin_icon?: string | null;
  pin_color?: string | null;
  pin_white_center?: boolean;
};

export type MapSiteBuildRequestLocation = {
  latitude?: number;
  longitude?: number;
  propertyAddress: string | null;
  propertyTitle: string | null;
  propertyDescription: string | null;
  coverImage: string | null;
  galleryImages: string[];
  pinIcon: string | null;
  pinColor: string | null;
  pinWhiteCenter: boolean;
};

export const DEMO_MAPSITE_COORDINATES = {
  lat: 46.088287,
  lng: -59.882749,
} as const;

export const DEMO_MAPSITE_ADDRESS =
  "Lot 8, South Head Road, Homeville, Nova Scotia, Canada.";

type MapSiteRow = {
  id: string;
  fast_code: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  property_title: string | null;
  property_address?: string | null;
  property_description?: string | null;
  cover_image?: string | null;
  header_image_url?: string | null;
  gallery_images?: string[] | null;
  mls_url?: string | null;
  broker_url?: string | null;
  website?: string | null;
  teb_url?: string | null;
  ttv_url?: string | null;
  assigned_marketing_manager?: string | null;
  is_demonstration?: boolean | null;
  created_at: string | null;
  updated_at?: string | null;
};

import {
  getMapSiteListingHeroImage,
  getMapSiteListingPhotoCount,
  MAPSITE_DEMO_GALLERY,
  MAPSITE_DEMO_LISTING_IMAGE,
  MAPSITE_LISTING_IMAGE_CLASS,
} from "@/lib/talispros/mapsite-listing-media";

const DEMO_DESCRIPTION =
  "It's a million dollar neighbourhood. A driveway and building site were prepared some years ago. May come with a Tiny Home guest house to stay in, while you build your dream home.";

const DEMO_SIDEBAR_BLURB =
  "Register with Talispros to have Rahul manage your exposure globally...!";

export function createFallbackDemoMapSite(
  overrides: Partial<MapSitePlatformRecord> = {}
): MapSitePlatformRecord {
  return {
    id: DEMO_MAPSITE_ID,
    fast_code: null,
    status: "UNCLAIMED",
    lat: 46.088287,
    lng: -59.882749,
    property_title: "Lot + optional Tiny Home",
    property_address: DEMO_MAPSITE_ADDRESS,
    property_description: DEMO_DESCRIPTION,
    cover_image: MAPSITE_DEMO_LISTING_IMAGE,
    gallery_images: [...MAPSITE_DEMO_GALLERY],
    mls_url: null,
    broker_url: null,
    teb_url: null,
    ttv_url: null,
    assigned_marketing_manager: null,
    is_demonstration: true,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

export const MAPSITE_DEMO_SIDEBAR_BLURB = DEMO_SIDEBAR_BLURB;

function mapRow(row: MapSiteRow): MapSitePlatformRecord {
  const gallery =
    Array.isArray(row.gallery_images) && row.gallery_images.length > 0
      ? row.gallery_images
      : [...MAPSITE_DEMO_GALLERY];

  const cover =
    row.cover_image ||
    row.header_image_url ||
    gallery[0] ||
    MAPSITE_DEMO_LISTING_IMAGE;

  return {
    id: row.id,
    fast_code: row.fast_code && row.fast_code.toUpperCase() !== "DEMO"
    ? row.fast_code
    : toPlatformStatus(row.status) === "UNCLAIMED"
      ? null
      : row.fast_code || null,
    status: toPlatformStatus(row.status),
    lat: row.latitude ?? 46.088287,
    lng: row.longitude ?? -59.882749,
    property_title: row.property_title || "Lot + optional Tiny Home",
    property_address:
      row.property_address || DEMO_MAPSITE_ADDRESS,
    property_description: row.property_description || DEMO_DESCRIPTION,
    cover_image: cover,
    gallery_images: gallery,
    mls_url: row.mls_url ?? null,
    broker_url: row.broker_url ?? row.website ?? null,
    teb_url: row.teb_url ?? null,
    ttv_url: row.ttv_url ?? null,
    assigned_marketing_manager: row.assigned_marketing_manager ?? null,
    is_demonstration: Boolean(row.is_demonstration),
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
  };
}

const BUILD_REQUEST_SUBMISSION_COLUMNS =
  "id, latitude, longitude, street_address, reverse_geocoded_address, address, property_title, future_pin_label, future_pin_icon, future_pin_color, future_pin_white_center, pin_writeup, description, gallery_images";

type BuildRequestSubmissionRow = {
  id: string;
  latitude: number | null;
  longitude: number | null;
  street_address: string | null;
  reverse_geocoded_address: string | null;
  address: string | null;
  property_title: string | null;
  future_pin_label: string | null;
  future_pin_icon: string | null;
  future_pin_color: string | null;
  future_pin_white_center: boolean | null;
  pin_writeup: string | null;
  description: string | null;
  gallery_images: string[] | null;
};

type BuildRequestAssetRow = {
  profile_image: string | null;
  pin_image: string | null;
};

async function getBuildRequestAssets(
  requestId: string
): Promise<BuildRequestAssetRow | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("mapsite_assets")
    .select("profile_image, pin_image")
    .eq("request_id", requestId)
    .maybeSingle();

  return (data as BuildRequestAssetRow | null) ?? null;
}

function mapBuildRequestSubmissionRow(
  row: BuildRequestSubmissionRow,
  assets: BuildRequestAssetRow | null
): MapSiteBuildRequestLocation | null {
  const hasLocation =
    row.latitude != null &&
    row.longitude != null &&
    Number.isFinite(row.latitude) &&
    Number.isFinite(row.longitude);

  const gallery = Array.isArray(row.gallery_images)
    ? row.gallery_images.filter((url): url is string => Boolean(url?.trim()))
    : [];

  const coverImage =
    assets?.profile_image?.trim() ||
    assets?.pin_image?.trim() ||
    gallery[0]?.trim() ||
    null;

  const propertyDescription =
    row.pin_writeup?.trim() || row.description?.trim() || null;

  if (!hasLocation && !coverImage && !propertyDescription) {
    return null;
  }

  const propertyAddress =
    row.street_address?.trim() ||
    row.reverse_geocoded_address?.trim() ||
    row.address?.trim() ||
    null;

  return {
    latitude: hasLocation ? row.latitude! : undefined,
    longitude: hasLocation ? row.longitude! : undefined,
    propertyAddress,
    propertyTitle:
      row.property_title?.trim() || row.future_pin_label?.trim() || null,
    propertyDescription,
    coverImage,
    galleryImages: gallery.length > 0 ? gallery : coverImage ? [coverImage] : [],
    pinIcon: row.future_pin_icon?.trim() || null,
    pinColor: row.future_pin_color?.trim() || null,
    pinWhiteCenter: row.future_pin_white_center !== false,
  };
}

/** @deprecated Use mapBuildRequestSubmissionRow */
function mapBuildRequestLocationRow(
  row: BuildRequestSubmissionRow,
  assets: BuildRequestAssetRow | null = null
): MapSiteBuildRequestLocation | null {
  return mapBuildRequestSubmissionRow(row, assets);
}

export function applyBuildRequestLocationToMapSite(
  mapsite: MapSitePlatformRecord,
  submission: MapSiteBuildRequestLocation
): MapSitePlatformRecord {
  const hasLocation =
    submission.latitude != null &&
    submission.longitude != null &&
    Number.isFinite(submission.latitude) &&
    Number.isFinite(submission.longitude);

  const gallery =
    submission.galleryImages.length > 0
      ? submission.galleryImages
      : submission.coverImage
        ? [submission.coverImage]
        : mapsite.gallery_images;

  return {
    ...mapsite,
    lat: hasLocation ? submission.latitude! : mapsite.lat,
    lng: hasLocation ? submission.longitude! : mapsite.lng,
    property_address: submission.propertyAddress || mapsite.property_address,
    property_title: submission.propertyTitle || mapsite.property_title,
    property_description:
      submission.propertyDescription || mapsite.property_description,
    cover_image: submission.coverImage || mapsite.cover_image,
    gallery_images: gallery,
    pin_icon: submission.pinIcon,
    pin_color: submission.pinColor,
    pin_white_center: submission.pinWhiteCenter,
  };
}

async function mapSubmissionQueryResult(
  row: BuildRequestSubmissionRow | null
): Promise<MapSiteBuildRequestLocation | null> {
  if (!row) return null;
  const assets = await getBuildRequestAssets(row.id);
  return mapBuildRequestSubmissionRow(row, assets);
}

export async function getMapSiteLocationFromBuildRequest(options: {
  mapsiteId?: string | null;
  requestId?: string | null;
  fastCode?: string | null;
}): Promise<MapSiteBuildRequestLocation | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = getSupabaseAdmin();
  const requestId = options.requestId?.trim() || null;
  const mapsiteId = options.mapsiteId?.trim() || null;
  const fastCode = options.fastCode?.trim() || null;

  if (requestId) {
    const { data } = await supabase
      .from("build_requests")
      .select(BUILD_REQUEST_SUBMISSION_COLUMNS)
      .eq("id", requestId)
      .maybeSingle();
    const mapped = await mapSubmissionQueryResult(
      data as BuildRequestSubmissionRow | null
    );
    if (mapped) return mapped;
  }

  if (mapsiteId) {
    const { data } = await supabase
      .from("build_requests")
      .select(BUILD_REQUEST_SUBMISSION_COLUMNS)
      .eq("linked_mapsite_id", mapsiteId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const mapped = await mapSubmissionQueryResult(
      data as BuildRequestSubmissionRow | null
    );
    if (mapped) return mapped;
  }

  if (fastCode) {
    const { data } = await supabase
      .from("build_requests")
      .select(BUILD_REQUEST_SUBMISSION_COLUMNS)
      .ilike("requested_fast_code", fastCode)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const mapped = await mapSubmissionQueryResult(
      data as BuildRequestSubmissionRow | null
    );
    if (mapped) return mapped;
  }

  return null;
}

export async function mergeMapSiteWithSubmittedLocation(
  mapsite: MapSitePlatformRecord,
  options: {
    requestId?: string | null;
    fastCode?: string | null;
  } = {}
): Promise<MapSitePlatformRecord> {
  const location = await getMapSiteLocationFromBuildRequest({
    mapsiteId: mapsite.id,
    requestId: options.requestId,
    fastCode: options.fastCode || mapsite.fast_code,
  });

  if (!location) return mapsite;
  return applyBuildRequestLocationToMapSite(mapsite, location);
}

const SELECT_COLUMNS =
  "id, fast_code, status, latitude, longitude, property_title, property_address, property_description, cover_image, header_image_url, gallery_images, mls_url, broker_url, website, teb_url, ttv_url, assigned_marketing_manager, is_demonstration, created_at, updated_at";

export async function getDemonstrationMapSite(): Promise<MapSitePlatformRecord> {
  if (!isSupabaseAdminConfigured()) {
    return createFallbackDemoMapSite();
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: demo } = await supabase
      .from("mapsites")
      .select(SELECT_COLUMNS)
      .eq("is_demonstration", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (demo) return mapRow(demo as MapSiteRow);

    const { data: byCode } = await supabase
      .from("mapsites")
      .select(SELECT_COLUMNS)
      .eq("fast_code", DEMO_MAPSITE_FAST_CODE)
      .maybeSingle();

    if (byCode) return mapRow(byCode as MapSiteRow);

    return createFallbackDemoMapSite();
  } catch (error) {
    console.warn("[mapsite-platform] Falling back to demo MapSite:", error);
    return createFallbackDemoMapSite();
  }
}

export async function getMapSitePlatformById(
  mapsiteId: string
): Promise<MapSitePlatformRecord | null> {
  if (!isSupabaseAdminConfigured()) {
    if (mapsiteId === DEMO_MAPSITE_ID) return createFallbackDemoMapSite();
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mapsites")
    .select(SELECT_COLUMNS)
    .eq("id", mapsiteId)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data as MapSiteRow);
}

export async function transitionMapSiteStatus(
  mapsiteId: string,
  next: MapSitePlatformStatus
): Promise<{ ok: true; mapsite: MapSitePlatformRecord } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Database is not configured." };
  }

  const current = await getMapSitePlatformById(mapsiteId);
  if (!current) return { ok: false, error: "MapSite not found." };

  try {
    assertTransition(current.status, next);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid transition",
    };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mapsites")
    .update({
      status: toDbStatus(next),
      updated_at: new Date().toISOString(),
    })
    .eq("id", mapsiteId)
    .select(SELECT_COLUMNS)
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message || "Failed to update MapSite status." };
  }

  return { ok: true, mapsite: mapRow(data as MapSiteRow) };
}

export type MapSiteResourceUpdates = {
  fast_code?: string | null;
  cover_image?: string | null;
  mls_url?: string | null;
  broker_url?: string | null;
  teb_url?: string | null;
  ttv_url?: string | null;
  property_title?: string | null;
  assigned_marketing_manager?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export async function updateMapSiteResources(
  mapsiteId: string,
  updates: MapSiteResourceUpdates
): Promise<{ ok: true; mapsite: MapSitePlatformRecord } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Database is not configured." };
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.fast_code !== undefined) patch.fast_code = updates.fast_code;
  if (updates.cover_image !== undefined) {
    patch.cover_image = updates.cover_image;
    patch.header_image_url = updates.cover_image;
  }
  if (updates.mls_url !== undefined) patch.mls_url = updates.mls_url;
  if (updates.broker_url !== undefined) {
    patch.broker_url = updates.broker_url;
    patch.website = updates.broker_url;
  }
  if (updates.teb_url !== undefined) patch.teb_url = updates.teb_url;
  if (updates.ttv_url !== undefined) patch.ttv_url = updates.ttv_url;
  if (updates.property_title !== undefined) {
    patch.property_title = updates.property_title;
  }
  if (updates.assigned_marketing_manager !== undefined) {
    patch.assigned_marketing_manager = updates.assigned_marketing_manager;
  }
  if (updates.latitude !== undefined) patch.latitude = updates.latitude;
  if (updates.longitude !== undefined) patch.longitude = updates.longitude;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mapsites")
    .update(patch)
    .eq("id", mapsiteId)
    .select(SELECT_COLUMNS)
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message || "Failed to update MapSite." };
  }

  return { ok: true, mapsite: mapRow(data as MapSiteRow) };
}

/**
 * After a Build Request is submitted against a MapSite, move it into the
 * pending pipeline and associate the request.
 */
export async function markMapSiteClaimedByBuildRequest(params: {
  mapsiteId: string;
  buildRequestId: string;
  fastCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  propertyTitle?: string | null;
  propertyAddress?: string | null;
  propertyDescription?: string | null;
  coverImage?: string | null;
}): Promise<MapSitePlatformRecord | null> {
  if (!isSupabaseAdminConfigured()) {
    return createFallbackDemoMapSite({
      status: "BUILD_REQUEST_SUBMITTED",
      fast_code: params.fastCode || null,
      lat: params.latitude ?? DEMO_MAPSITE_COORDINATES.lat,
      lng: params.longitude ?? DEMO_MAPSITE_COORDINATES.lng,
      property_title: params.propertyTitle || "Lot + optional Tiny Home",
      property_address: params.propertyAddress || null,
      property_description: params.propertyDescription || null,
      ...(params.coverImage
        ? {
            cover_image: params.coverImage,
            gallery_images: [params.coverImage],
          }
        : {}),
    });
  }

  const supabase = getSupabaseAdmin();
  let current = await getMapSitePlatformById(params.mapsiteId);

  if (!current && params.mapsiteId === DEMO_MAPSITE_ID) {
    const fallback = createFallbackDemoMapSite();
    const { error: seedError } = await supabase.from("mapsites").upsert(
      {
        id: DEMO_MAPSITE_ID,
        fast_code: DEMO_MAPSITE_FAST_CODE,
        slug: "demo-unclaimed",
        account_type: "demonstration",
        owner_first_name: "Talispros",
        owner_last_name: "Demonstration",
        email: "demo@talispros.com",
        phone: "",
        status: "unclaimed",
        property_title: fallback.property_title,
        property_address: fallback.property_address,
        property_description: fallback.property_description,
        latitude: fallback.lat,
        longitude: fallback.lng,
        cover_image: fallback.cover_image,
        header_image_url: fallback.cover_image,
        gallery_images: fallback.gallery_images,
        is_demonstration: true,
      },
      { onConflict: "id" }
    );
    if (seedError) {
      console.warn("[mapsite-platform] Unable to seed demo MapSite:", seedError.message);
    } else {
      current = await getMapSitePlatformById(params.mapsiteId);
    }
  }

  if (!current && params.mapsiteId === DEMO_MAPSITE_ID) {
    current = createFallbackDemoMapSite();
  }

  if (!current) return null;

  const nextStatus =
    current.status === "UNCLAIMED"
      ? "build_request_submitted"
      : toDbStatus(current.status);

  const patch: Record<string, unknown> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  };

  if (params.fastCode) {
    patch.fast_code = params.fastCode;
    patch.slug = params.fastCode.toLowerCase();
  }
  if (params.latitude != null && Number.isFinite(params.latitude)) {
    patch.latitude = params.latitude;
  }
  if (params.longitude != null && Number.isFinite(params.longitude)) {
    patch.longitude = params.longitude;
  }
  if (params.propertyTitle) patch.property_title = params.propertyTitle;
  if (params.propertyAddress) patch.property_address = params.propertyAddress;
  if (params.propertyDescription) {
    patch.property_description = params.propertyDescription;
  }
  if (params.coverImage) {
    patch.cover_image = params.coverImage;
    patch.header_image_url = params.coverImage;
  }

  const { data, error } = await supabase
    .from("mapsites")
    .update(patch)
    .eq("id", params.mapsiteId)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error) {
    console.warn("[mapsite-platform] Claim status update failed:", error.message);
  }

  await supabase
    .from("build_requests")
    .update({ linked_mapsite_id: params.mapsiteId })
    .eq("id", params.buildRequestId);

  if (data) return mapRow(data as MapSiteRow);

  return applyBuildRequestLocationToMapSite(
    {
      ...current,
      status: "BUILD_REQUEST_SUBMITTED",
      fast_code: params.fastCode || current.fast_code,
    },
    {
      latitude: params.latitude ?? current.lat,
      longitude: params.longitude ?? current.lng,
      propertyAddress: params.propertyAddress ?? current.property_address,
      propertyTitle: params.propertyTitle ?? current.property_title,
      propertyDescription: params.propertyDescription ?? null,
      coverImage: params.coverImage ?? null,
      galleryImages:
        params.coverImage != null
          ? [params.coverImage]
          : current.gallery_images,
      pinIcon: null,
      pinColor: null,
      pinWhiteCenter: true,
    }
  );
}

export async function getMapSitePlatformByFastCode(
  fastCode: string
): Promise<MapSitePlatformRecord | null> {
  if (!fastCode.trim()) return null;
  if (!isSupabaseAdminConfigured()) {
    return createFallbackDemoMapSite({
      fast_code: fastCode.trim().toUpperCase(),
      status: "BUILD_REQUEST_SUBMITTED",
    });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mapsites")
    .select(SELECT_COLUMNS)
    .ilike("fast_code", fastCode.trim())
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data as MapSiteRow);
}
