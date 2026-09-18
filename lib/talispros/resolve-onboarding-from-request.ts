import { canEditMapSite } from "@/lib/mapsite-edit-auth";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  logOnboardingStep,
  onboardingNow,
  type OnboardingFailureReport,
} from "@/lib/onboarding-timing";
import { isIssuedFastCode } from "@/lib/talispros/fast-code-shape";

export { isIssuedFastCode } from "@/lib/talispros/fast-code-shape";

export type OnboardingContext = {
  requestId: string | null;
  fastCode: string;
  mapsiteId: string | null;
  accountType: string | null;
  owner: {
    firstName: string;
    lastName: string;
    agentName: string;
    email: string;
    phone: string;
  };
  assets: {
    coverImage: string | null;
    galleryImages: string[];
    logo: string | null;
  };
  pin: {
    streetAddress: string | null;
    latitude: number | null;
    longitude: number | null;
    writeup: string | null;
  };
  listing: {
    title: string | null;
    address: string | null;
    price: string | null;
  };
};

export type ResolveOnboardingResult =
  | { ok: true; context: OnboardingContext }
  | { ok: false; report: OnboardingFailureReport };

/**
 * Canonical onboarding resolver.
 * Build Request (`requestId`) is the sole source of truth — no cookies,
 * localStorage, or client-supplied FAST Code / Mapsite™ IDs are trusted.
 */

/**
 * Lightweight scope check for per-image optimize uploads.
 * Avoids the full onboarding resolve (owner, mapsite, assets) on every photo.
 */
export async function resolveOnboardingUploadScope(
  requestIdRaw: string | null | undefined
): Promise<
  | { ok: true; requestId: string; fastCode: string }
  | { ok: false; error: string }
> {
  const requestId = requestIdRaw?.trim() || "";
  if (!requestId) {
    return { ok: false, error: "Build Request ID is required." };
  }
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Database is not configured." };
  }

  const supabase = getSupabaseAdmin();
  const { data: request, error } = await supabase
    .from("build_requests")
    .select("id, requested_fast_code")
    .eq("id", requestId)
    .maybeSingle();

  if (error || !request) {
    return {
      ok: false,
      error: error?.message || "Build Request not found. Restart onboarding from the Build Form.",
    };
  }

  const fastCode = request.requested_fast_code?.trim().toLowerCase() || "";
  if (!isIssuedFastCode(fastCode)) {
    return {
      ok: false,
      error: "A FAST Code was not issued for this Build Request.",
    };
  }

  return { ok: true, requestId, fastCode };
}

export async function resolveOnboardingFromRequest(
  requestIdRaw: string | null | undefined
): Promise<ResolveOnboardingResult> {
  const started = onboardingNow();
  const requestId = requestIdRaw?.trim() || "";

  if (!requestId) {
    const report: OnboardingFailureReport = {
      requestId: null,
      fastCode: null,
      mapsiteId: null,
      stage: "resolve_request",
      error: "Build Request ID is required. Restart onboarding from the Build Form.",
      durationMs: onboardingNow() - started,
    };
    return { ok: false, report };
  }

  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      report: {
        requestId,
        fastCode: null,
        mapsiteId: null,
        stage: "resolve_request",
        error: "Database is not configured.",
        durationMs: onboardingNow() - started,
      },
    };
  }

  const supabase = getSupabaseAdmin();

  const { data: request, error: requestError } = await supabase
    .from("build_requests")
    .select(
      "id, first_name, last_name, email, phone, street_address, reverse_geocoded_address, latitude, longitude, pin_writeup, requested_account_type, account_type, requested_fast_code, linked_mapsite_id, gallery_images, logo"
    )
    .eq("id", requestId)
    .maybeSingle();

  if (requestError || !request) {
    return {
      ok: false,
      report: {
        requestId,
        fastCode: null,
        mapsiteId: null,
        stage: "validate_build_request",
        error: requestError?.message || "Build Request not found. Restart onboarding from the Build Form.",
        durationMs: onboardingNow() - started,
      },
    };
  }

  const firstName = (request.first_name || "").trim();
  const lastName = (request.last_name || "").trim();
  const email = (request.email || "").trim().toLowerCase();

  if (!firstName || !lastName || !email) {
    return {
      ok: false,
      report: {
        requestId,
        fastCode: null,
        mapsiteId: request.linked_mapsite_id?.trim() || null,
        stage: "validate_owner",
        error:
          "Build Request is missing owner identity (name/email). Resubmit the Build Form.",
        durationMs: onboardingNow() - started,
      },
    };
  }

  const requestedFastCode = request.requested_fast_code?.trim().toLowerCase() || null;
  if (!isIssuedFastCode(requestedFastCode)) {
    return {
      ok: false,
      report: {
        requestId,
        fastCode: requestedFastCode,
        mapsiteId: request.linked_mapsite_id?.trim() || null,
        stage: "resolve_fast_code",
        error:
          "FAST Code was not issued for this Build Request. Resubmit the Build Form — the E-Book generator cannot invent a FAST Code.",
        durationMs: onboardingNow() - started,
      },
    };
  }

  // Confirm the code exists in fast_codes (authoritative issuance record).
  const { data: fastRow, error: fastError } = await supabase
    .from("fast_codes")
    .select("code, mapsite_id")
    .eq("code", requestedFastCode)
    .maybeSingle();

  if (fastError || !fastRow?.code) {
    return {
      ok: false,
      report: {
        requestId,
        fastCode: requestedFastCode,
        mapsiteId: request.linked_mapsite_id?.trim() || null,
        stage: "resolve_fast_code",
        error:
          "FAST Code is on the Build Request but missing from the FAST Code registry. Contact support with your Request ID.",
        durationMs: onboardingNow() - started,
      },
    };
  }

  const accountType =
    request.requested_account_type?.trim() ||
    request.account_type?.trim() ||
    null;

  let mapsiteId =
    request.linked_mapsite_id?.trim() ||
    fastRow.mapsite_id?.trim() ||
    null;

  let mapsite: {
    id: string;
    fast_code: string | null;
    owner_first_name: string | null;
    owner_last_name: string | null;
    agent_name: string | null;
    email: string | null;
    phone: string | null;
    cover_image: string | null;
    gallery_images: string[] | null;
    logo_url: string | null;
    property_title: string | null;
    property_address: string | null;
    price: string | null;
  } | null = null;

  if (mapsiteId) {
    const byId = await supabase
      .from("mapsites")
      .select(
        "id, fast_code, owner_first_name, owner_last_name, agent_name, email, phone, cover_image, gallery_images, logo_url, property_title, property_address, price"
      )
      .eq("id", mapsiteId)
      .maybeSingle();
    mapsite = byId.data;
  }

  if (!mapsite) {
    const byFast = await supabase
      .from("mapsites")
      .select(
        "id, fast_code, owner_first_name, owner_last_name, agent_name, email, phone, cover_image, gallery_images, logo_url, property_title, property_address, price"
      )
      .ilike("fast_code", requestedFastCode)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    mapsite = byFast.data;
    mapsiteId = mapsite?.id ?? null;
  }

  const galleryFromRequest = Array.isArray(request.gallery_images)
    ? request.gallery_images.filter(
        (url): url is string => typeof url === "string" && url.trim().length > 0
      )
    : [];
  const galleryFromMapSite = Array.isArray(mapsite?.gallery_images)
    ? mapsite.gallery_images.filter(
        (url): url is string => typeof url === "string" && url.trim().length > 0
      )
    : [];

  const agentName =
    mapsite?.agent_name?.trim() ||
    `${firstName} ${lastName}`.trim();

  const pinAddress =
    request.street_address?.trim() ||
    request.reverse_geocoded_address?.trim() ||
    null;
  const listingAddress =
    mapsite?.property_address?.trim() || pinAddress;

  const context: OnboardingContext = {
    requestId,
    fastCode: requestedFastCode,
    mapsiteId,
    accountType,
    owner: {
      firstName,
      lastName,
      agentName,
      email: email || mapsite?.email?.trim() || "",
      phone: (request.phone || mapsite?.phone || "").trim(),
    },
    assets: {
      coverImage:
        mapsite?.cover_image?.trim() ||
        galleryFromRequest[0] ||
        null,
      galleryImages:
        galleryFromMapSite.length > 0 ? galleryFromMapSite : galleryFromRequest,
      logo:
        mapsite?.logo_url?.trim() ||
        (typeof request.logo === "string" ? request.logo.trim() : null) ||
        null,
    },
    pin: {
      streetAddress: pinAddress,
      latitude:
        request.latitude != null && Number.isFinite(request.latitude)
          ? request.latitude
          : null,
      longitude:
        request.longitude != null && Number.isFinite(request.longitude)
          ? request.longitude
          : null,
      writeup: request.pin_writeup?.trim() || null,
    },
    listing: {
      title: mapsite?.property_title?.trim() || null,
      address: listingAddress,
      price: mapsite?.price?.trim() || null,
    },
  };

  logOnboardingStep("Resolve onboarding", started, {
    requestId,
    fastCode: context.fastCode,
    mapsiteId: context.mapsiteId,
    accountType: context.accountType,
  });

  return { ok: true, context };
}

/**
 * Admin / paid-owner ebook identity from an existing Mapsite™ FAST Code.
 * Used when there is no Build Request (seeded listings like LRG1).
 * Callers must already have verified `canEditMapSite(fastCode)`.
 */
export async function resolveOnboardingFromMapSite(
  fastCodeRaw: string | null | undefined,
): Promise<ResolveOnboardingResult> {
  const started = onboardingNow();
  const fastCode = fastCodeRaw?.trim().toLowerCase() || "";

  if (!fastCode) {
    return {
      ok: false,
      report: {
        requestId: null,
        fastCode: null,
        mapsiteId: null,
        stage: "resolve_request",
        error: "FAST Code is required.",
        durationMs: onboardingNow() - started,
      },
    };
  }

  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      report: {
        requestId: null,
        fastCode,
        mapsiteId: null,
        stage: "resolve_request",
        error: "Database is not configured.",
        durationMs: onboardingNow() - started,
      },
    };
  }

  const supabase = getSupabaseAdmin();
  const { data: fastRow } = await supabase
    .from("fast_codes")
    .select("code, mapsite_id, request_id")
    .ilike("code", fastCode)
    .maybeSingle();

  let mapsite: {
    id: string;
    fast_code: string | null;
    account_type: string | null;
    owner_first_name: string | null;
    owner_last_name: string | null;
    agent_name: string | null;
    email: string | null;
    phone: string | null;
    cover_image: string | null;
    gallery_images: string[] | null;
    logo_url: string | null;
    property_title: string | null;
    property_address: string | null;
    property_description: string | null;
    price: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null = null;

  const mapsiteSelect =
    "id, fast_code, account_type, owner_first_name, owner_last_name, agent_name, email, phone, cover_image, gallery_images, logo_url, property_title, property_address, property_description, price, latitude, longitude";

  if (fastRow?.mapsite_id) {
    const byId = await supabase
      .from("mapsites")
      .select(mapsiteSelect)
      .eq("id", fastRow.mapsite_id)
      .maybeSingle();
    mapsite = byId.data;
  }

  if (!mapsite) {
    const byFast = await supabase
      .from("mapsites")
      .select(mapsiteSelect)
      .ilike("fast_code", fastCode)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    mapsite = byFast.data;
  }

  if (!mapsite) {
    return {
      ok: false,
      report: {
        requestId: fastRow?.request_id?.trim() || null,
        fastCode,
        mapsiteId: null,
        stage: "resolve_fast_code",
        error: "Mapsite™ not found for this FAST Code.",
        durationMs: onboardingNow() - started,
      },
    };
  }

  let requestId = fastRow?.request_id?.trim() || null;
  if (!requestId) {
    const { data: byLinked } = await supabase
      .from("build_requests")
      .select("id")
      .eq("linked_mapsite_id", mapsite.id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    requestId = byLinked?.id ?? null;
  }
  if (!requestId) {
    const { data: byFastRequest } = await supabase
      .from("build_requests")
      .select("id")
      .ilike("requested_fast_code", fastCode)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    requestId = byFastRequest?.id ?? null;
  }

  const firstName = mapsite.owner_first_name?.trim() || "";
  const lastName = mapsite.owner_last_name?.trim() || "";
  const galleryImages = Array.isArray(mapsite.gallery_images)
    ? mapsite.gallery_images.filter(
        (url): url is string => typeof url === "string" && url.trim().length > 0,
      )
    : [];
  const agentName =
    mapsite.agent_name?.trim() ||
    `${firstName} ${lastName}`.trim() ||
    fastCode.toUpperCase();

  const context: OnboardingContext = {
    requestId,
    fastCode,
    mapsiteId: mapsite.id,
    accountType: mapsite.account_type?.trim() || null,
    owner: {
      firstName,
      lastName,
      agentName,
      email: mapsite.email?.trim() || "",
      phone: mapsite.phone?.trim() || "",
    },
    assets: {
      coverImage: mapsite.cover_image?.trim() || galleryImages[0] || null,
      galleryImages,
      logo: mapsite.logo_url?.trim() || null,
    },
    pin: {
      streetAddress: mapsite.property_address?.trim() || null,
      latitude:
        mapsite.latitude != null && Number.isFinite(mapsite.latitude)
          ? mapsite.latitude
          : null,
      longitude:
        mapsite.longitude != null && Number.isFinite(mapsite.longitude)
          ? mapsite.longitude
          : null,
      writeup: mapsite.property_description?.trim() || null,
    },
    listing: {
      title: mapsite.property_title?.trim() || null,
      address: mapsite.property_address?.trim() || null,
      price: mapsite.price?.trim() || null,
    },
  };

  logOnboardingStep("Resolve mapsite onboarding", started, {
    requestId,
    fastCode,
    mapsiteId: context.mapsiteId,
    accountType: context.accountType,
  });

  return { ok: true, context };
}

/**
 * Per-image upload scope for an existing Mapsite™ the caller is allowed to edit.
 */
export async function resolveMapSiteUploadScope(
  mapsiteIdRaw: string | null | undefined,
): Promise<
  | { ok: true; mapsiteId: string; fastCode: string }
  | { ok: false; error: string }
> {
  const mapsiteId = mapsiteIdRaw?.trim() || "";
  if (!mapsiteId) {
    return { ok: false, error: "Mapsite™ ID is required." };
  }
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Database is not configured." };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mapsites")
    .select("id, fast_code")
    .eq("id", mapsiteId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message || "Mapsite™ not found." };
  }

  const fastCode = data.fast_code?.trim().toLowerCase() || "";
  if (!fastCode) {
    return { ok: false, error: "This Mapsite™ has no FAST Code." };
  }
  if (!(await canEditMapSite(fastCode))) {
    return { ok: false, error: "Unauthorized." };
  }

  return { ok: true, mapsiteId: data.id, fastCode };
}
