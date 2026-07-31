import type { Database } from "@/lib/database.types";
import {
  accountTypeLabelFromBuildAccountType,
  offeredTierFromBuildAccountType,
} from "@/lib/build-mapsite-publish";
import { HOME_PIN_DEFAULT_MAP_ZOOM } from "@/lib/home-pin-coordinates";
import { generateMapSiteSlug } from "@/lib/slug-generator";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { MAPSITE_DEMO_LISTING_IMAGE } from "@/lib/talispros/mapsite-listing-media";
import {
  getMapSiteLocationFromBuildRequest,
  markMapSiteClaimedByBuildRequest,
} from "@/lib/talispros/mapsite-platform";
import {
  buildRahulWaitingMapSiteHref,
  buildSelfEbookContinueHref,
  type PostBuildSuccessPath,
} from "@/lib/talispros/ebook-choice";
import {
  buildClaimedMapSitePath,
  DEMO_MAPSITE_ID,
  MAPSITE_APP_PATH,
} from "@/lib/talispros/mapsite-state";

export type EnsureClientMapSiteResult = {
  ok: true;
  mapsiteId: string;
  fastCode: string | null;
  accountType: string | null;
  href: string;
} | {
  ok: false;
  error: string;
  href: string;
};

function buildSuccessHref(options: {
  mapsiteId: string;
  fastCode?: string | null;
  accountType?: string | null;
  requestId: string;
  successPath?: PostBuildSuccessPath;
}): string {
  const fastCode = options.fastCode?.trim() || "";
  const successPath = options.successPath ?? "mapsite";

  if (successPath === "self-ebook") {
    return buildSelfEbookContinueHref({
      fastCode,
      mapsiteId: options.mapsiteId,
      accountType: options.accountType,
      requestId: options.requestId,
    });
  }

  if (successPath === "rahul-waiting") {
    return buildRahulWaitingMapSiteHref({
      fastCode,
      mapsiteId: options.mapsiteId,
      accountType: options.accountType,
      requestId: options.requestId,
    });
  }

  // Legacy / default: open MapSite with pin (no registration / PayPal redirect).
  if (fastCode && fastCode.toLowerCase() !== "demo") {
    const path = buildClaimedMapSitePath({
      fastCode,
      accountType: options.accountType,
    });
    const params = new URLSearchParams({ view: "pin" });
    if (options.requestId) params.set("requestId", options.requestId);
    if (options.mapsiteId) params.set("mapsiteId", options.mapsiteId);
    return `${path}?${params.toString()}`;
  }

  const params = new URLSearchParams({
    claimed: "1",
    view: "pin",
    mapsiteId: options.mapsiteId,
    requestId: options.requestId,
  });
  if (fastCode) params.set("fastCode", fastCode);
  if (options.accountType) {
    params.set("audience", options.accountType);
  }
  return `${MAPSITE_APP_PATH}?${params.toString()}`;
}

/**
 * After a Build Request succeeds, ensure the client has a MapSite™ to open
 * immediately (PIN + location + image). Does not change submitBuildRequest.
 */
export async function ensureClientMapSiteFromBuildRequest(options: {
  requestId: string;
  fastCode?: string | null;
  accountType?: string | null;
  /** Where to send the client after MapSite + owner association. */
  successPath?: PostBuildSuccessPath;
}): Promise<EnsureClientMapSiteResult> {
  const requestId = options.requestId.trim();
  const successPath = options.successPath ?? "mapsite";
  if (!requestId) {
    return {
      ok: false,
      error: "Missing Build Request ID.",
      href: `${MAPSITE_APP_PATH}?claimed=1&view=pin`,
    };
  }

  const fallbackHref = buildSuccessHref({
    mapsiteId: DEMO_MAPSITE_ID,
    fastCode: options.fastCode,
    accountType: options.accountType,
    requestId,
    successPath,
  });

  if (!isSupabaseAdminConfigured()) {
    return {
      ok: true,
      mapsiteId: DEMO_MAPSITE_ID,
      fastCode: options.fastCode?.trim() || null,
      accountType: options.accountType?.trim() || null,
      href: fallbackHref,
    };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: request, error: requestError } = await supabase
      .from("build_requests")
      .select(
        "id, first_name, last_name, email, phone, street_address, reverse_geocoded_address, latitude, longitude, pin_writeup, future_pin_label, requested_account_type, account_type, requested_fast_code, linked_mapsite_id, gallery_images"
      )
      .eq("id", requestId)
      .maybeSingle();

    if (requestError || !request) {
      return { ok: false, error: "Build request not found.", href: fallbackHref };
    }

    const accountType =
      options.accountType?.trim() ||
      request.requested_account_type ||
      request.account_type ||
      null;

    const fastCode =
      options.fastCode?.trim() ||
      request.requested_fast_code?.trim() ||
      null;

    const location = await getMapSiteLocationFromBuildRequest({ requestId });
    const coverImage = location?.coverImage || MAPSITE_DEMO_LISTING_IMAGE;
    const propertyTitle =
      location?.propertyTitle ||
      request.future_pin_label?.trim() ||
      `${request.first_name} ${request.last_name}`.trim() ||
      "Your Property";
    const propertyAddress =
      location?.propertyAddress ||
      request.street_address?.trim() ||
      request.reverse_geocoded_address?.trim() ||
      null;
    const propertyDescription =
      location?.propertyDescription || request.pin_writeup?.trim() || null;
    const latitude =
      location?.latitude ??
      (request.latitude != null && Number.isFinite(request.latitude)
        ? request.latitude
        : null);
    const longitude =
      location?.longitude ??
      (request.longitude != null && Number.isFinite(request.longitude)
        ? request.longitude
        : null);
    const mapZoom = HOME_PIN_DEFAULT_MAP_ZOOM;

    let mapsiteId = request.linked_mapsite_id?.trim() || null;
    let resolvedCode =
      fastCode && fastCode.toLowerCase() !== "demo" ? fastCode : null;

    if (mapsiteId) {
      // Already linked (e.g. Claim a Market™) — refresh property fields only.
      const claimed = await markMapSiteClaimedByBuildRequest({
        mapsiteId,
        buildRequestId: requestId,
        fastCode: resolvedCode,
        latitude,
        longitude,
        mapZoom,
        propertyTitle,
        propertyAddress,
        propertyDescription,
        coverImage,
      });
      mapsiteId = claimed?.id ?? mapsiteId;
      resolvedCode = resolvedCode || claimed?.fast_code || null;
    } else {
      // Create the client's MapSite™ for immediate open without linking yet,
      // so Marketing Admin can still Generate / review the official draft.
      const { data: existingSlugs } = await supabase
        .from("mapsites")
        .select("slug");
      const slug = await generateMapSiteSlug(
        (existingSlugs || []).map((row) => row.slug)
      );

      const provisionalCode =
        resolvedCode?.toLowerCase() || `ms${slug.toLowerCase()}`;

      const ownerFirst = request.first_name?.trim() || "Client";
      const ownerLast = request.last_name?.trim() || "MapSite";
      const agentName = `${ownerFirst} ${ownerLast}`.trim();
      const gallery =
        location?.galleryImages?.length
          ? location.galleryImages
          : [coverImage];

      const insert: Database["public"]["Tables"]["mapsites"]["Insert"] = {
        fast_code: provisionalCode,
        slug,
        account_type: accountTypeLabelFromBuildAccountType(
          accountType || "root"
        ),
        owner_first_name: ownerFirst,
        owner_last_name: ownerLast,
        agent_name: agentName,
        email:
          (request.email || "").trim().toLowerCase() || "client@talispros.com",
        phone: request.phone?.trim() || "",
        status: "build_request_submitted",
        property_title: propertyTitle,
        property_address: propertyAddress,
        property_description: propertyDescription,
        latitude,
        longitude,
        map_zoom: mapZoom,
        cover_image: coverImage,
        header_image_url: coverImage,
        gallery_images: gallery,
        profile_image_url: coverImage,
        is_demonstration: false,
        interest_form_enabled: true,
        offered_subscription_tier: offeredTierFromBuildAccountType(
          accountType || "root"
        ),
      };

      const { data: created, error: createError } = await supabase
        .from("mapsites")
        .insert(insert)
        .select("id, fast_code")
        .single();

      if (createError || !created) {
        console.warn(
          "[ensure-client-mapsite] Create failed, falling back to demo:",
          createError?.message
        );
        mapsiteId = DEMO_MAPSITE_ID;
      } else {
        mapsiteId = created.id;
        resolvedCode = resolvedCode || created.fast_code || null;
      }
    }

    return {
      ok: true,
      mapsiteId: mapsiteId!,
      fastCode: resolvedCode,
      accountType,
      href: buildSuccessHref({
        mapsiteId: mapsiteId!,
        fastCode: resolvedCode,
        accountType,
        requestId,
        successPath,
      }),
    };
  } catch (error) {
    console.error("[ensure-client-mapsite] Failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to open MapSite.",
      href: fallbackHref,
    };
  }
}
