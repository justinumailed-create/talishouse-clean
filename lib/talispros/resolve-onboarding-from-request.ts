import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  logOnboardingStep,
  onboardingNow,
  type OnboardingFailureReport,
} from "@/lib/onboarding-timing";
import { isIssuedFastCode } from "@/lib/talispros/fast-code-shape";

export { isIssuedFastCode } from "@/lib/talispros/fast-code-shape";

export type OnboardingContext = {
  requestId: string;
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
};

export type ResolveOnboardingResult =
  | { ok: true; context: OnboardingContext }
  | { ok: false; report: OnboardingFailureReport };

/**
 * Canonical onboarding resolver.
 * Build Request (`requestId`) is the sole source of truth — no cookies,
 * localStorage, or client-supplied FAST Code / MapSite IDs are trusted.
 */
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
  } | null = null;

  if (mapsiteId) {
    const byId = await supabase
      .from("mapsites")
      .select(
        "id, fast_code, owner_first_name, owner_last_name, agent_name, email, phone, cover_image, gallery_images, logo_url"
      )
      .eq("id", mapsiteId)
      .maybeSingle();
    mapsite = byId.data;
  }

  if (!mapsite) {
    const byFast = await supabase
      .from("mapsites")
      .select(
        "id, fast_code, owner_first_name, owner_last_name, agent_name, email, phone, cover_image, gallery_images, logo_url"
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
  const galleryFromMapsite = Array.isArray(mapsite?.gallery_images)
    ? mapsite.gallery_images.filter(
        (url): url is string => typeof url === "string" && url.trim().length > 0
      )
    : [];

  const agentName =
    mapsite?.agent_name?.trim() ||
    `${firstName} ${lastName}`.trim();

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
        galleryFromMapsite.length > 0 ? galleryFromMapsite : galleryFromRequest,
      logo:
        mapsite?.logo_url?.trim() ||
        (typeof request.logo === "string" ? request.logo.trim() : null) ||
        null,
    },
    pin: {
      streetAddress:
        request.street_address?.trim() ||
        request.reverse_geocoded_address?.trim() ||
        null,
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
  };

  logOnboardingStep("Resolve onboarding", started, {
    requestId,
    fastCode: context.fastCode,
    mapsiteId: context.mapsiteId,
    accountType: context.accountType,
  });

  return { ok: true, context };
}
