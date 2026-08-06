"use server";

import { revalidatePath } from "next/cache";
import { publishBuildMapSite } from "@/lib/build-mapsite-publish";
import { resolvePinStyleExtras } from "@/lib/build-request-pin-style-notes";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateFastCode } from "@/services/fast-code.service";
import {
  transitionMapSiteStatus,
  updateMapSiteResources,
  type MapSiteResourceUpdates,
} from "@/lib/talispros/mapsite-platform";
import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";

type ActionResult = { ok: boolean; error?: string };

export type BuildRequestListRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  market_type: string | null;
  requested_account_type: string | null;
  adpro_category: string | null;
  requested_fast_code: string | null;
  registration_link: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string | null;
};

export async function listBuildRequests(): Promise<{ ok: boolean; data: BuildRequestListRow[]; error?: string }> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("build_requests")
    .select(
      "id, first_name, last_name, email, market_type, requested_account_type, adpro_category, requested_fast_code, registration_link, status, submitted_at, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) return { ok: false, data: [], error: error.message };
  return { ok: true, data: (data as BuildRequestListRow[]) || [] };
}

async function reserveFastCodeForRequest(requestId: string): Promise<{ ok: boolean; code?: string; error?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("build_requests")
      .select("id, first_name, last_name, requested_fast_code, requested_account_type")
      .eq("id", requestId)
      .single();

    if (fetchError || !existing) {
      return { ok: false, error: "Build request not found" };
    }

    const reservedFastCode =
      existing.requested_fast_code ||
      (await generateFastCode({ firstName: existing.first_name, lastName: existing.last_name }));
    const { error: fastCodeError } = await supabaseAdmin.from("fast_codes").upsert(
      {
        code: reservedFastCode,
        type: "mapsite",
        request_id: existing.id,
        account_type: existing.requested_account_type || null,
      },
      { onConflict: "code" }
    );
    if (fastCodeError) {
      return { ok: false, error: fastCodeError.message };
    }

    const { error: updateError } = await supabaseAdmin
      .from("build_requests")
      .update({ requested_fast_code: reservedFastCode })
      .eq("id", existing.id);
    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    return { ok: true, code: reservedFastCode };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function assignFastCode(requestId: string): Promise<ActionResult> {
  const result = await reserveFastCodeForRequest(requestId);
  if (!result.ok) return result;
  revalidatePath("/admin/marketing");
  return { ok: true };
}

export async function generateDraftMapSite(requestId: string): Promise<ActionResult> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: buildRequest, error: requestError } = await supabaseAdmin
      .from("build_requests")
      .select(
        "id, first_name, last_name, email, street_address, latitude, longitude, pin_writeup, future_pin_label, future_pin_color, future_pin_icon, future_pin_border, notes, requested_account_type, requested_fast_code, status, linked_mapsite_id"
      )
      .eq("id", requestId)
      .single();
    if (requestError || !buildRequest) {
      return { ok: false, error: "Build request not found" };
    }
    if (buildRequest.linked_mapsite_id) {
      return { ok: false, error: "Draft Mapsite™ already generated for this request." };
    }

    const fastCodeReservation = await reserveFastCodeForRequest(requestId);
    if (!fastCodeReservation.ok || !fastCodeReservation.code) {
      return { ok: false, error: fastCodeReservation.error || "Unable to reserve FAST code" };
    }

    const { data: assets } = await supabaseAdmin
      .from("mapsite_assets")
      .select("profile_image, logo_image, monologue_pdf, pin_image, ebook_pdf")
      .eq("request_id", requestId)
      .maybeSingle();

    const { data: requestMedia } = await supabaseAdmin
      .from("build_requests")
      .select("gallery_images, logo, video")
      .eq("id", requestId)
      .single();

    const pinStyleExtras = resolvePinStyleExtras(buildRequest);

    const published = await publishBuildMapSite({
      fastCode: fastCodeReservation.code,
      firstName: buildRequest.first_name,
      lastName: buildRequest.last_name,
      email: buildRequest.email,
      accountType: buildRequest.requested_account_type || "root",
      streetAddress: buildRequest.street_address || "",
      latitude: buildRequest.latitude,
      longitude: buildRequest.longitude,
      pinWriteup: buildRequest.pin_writeup || "",
      futurePinLabel: buildRequest.future_pin_label || "",
      futurePinColor: buildRequest.future_pin_color,
      futurePinIcon: buildRequest.future_pin_icon,
      futurePinBorder: buildRequest.future_pin_border,
      futurePinWhiteCenter: pinStyleExtras.whiteCenter,
      futurePinAnimated: pinStyleExtras.animated,
      futurePinCategoryBadge: pinStyleExtras.categoryBadge,
      pinImageUrl: assets?.pin_image ?? null,
      profileImageUrl: assets?.profile_image ?? null,
      logoImageUrl: requestMedia?.logo ?? assets?.logo_image ?? null,
      headerImageUrl: requestMedia?.video ?? null,
      galleryImageUrls: requestMedia?.gallery_images ?? [],
    });

    await supabaseAdmin
      .from("mapsites")
      .update({ status: "draft", property_title: buildRequest.future_pin_label || null })
      .eq("id", published.mapsiteId);

    const registrationLink = `/talispros/register?request=${buildRequest.id}`;
    await supabaseAdmin.from("build_request_registrations").upsert(
      {
        build_request_id: buildRequest.id,
        registration_link: registrationLink,
        status: "pending",
      },
      { onConflict: "build_request_id" }
    );

    const { error: updateError } = await supabaseAdmin
      .from("build_requests")
      .update({
        status: "Awaiting Registration",
        approval_status: "Approved",
        approved_at: new Date().toISOString(),
        requested_fast_code: fastCodeReservation.code,
        linked_mapsite_id: published.mapsiteId,
        registration_link: registrationLink
      })
      .eq("id", buildRequest.id);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    const { error: codeLinkError } = await supabaseAdmin
      .from("fast_codes")
      .update({ mapsite_id: published.mapsiteId })
      .eq("request_id", buildRequest.id)
      .eq("code", fastCodeReservation.code);
    if (codeLinkError) {
      return { ok: false, error: codeLinkError.message };
    }

    revalidatePath("/admin/marketing");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function sendRegistration(requestId: string): Promise<ActionResult> {
  const supabaseAdmin = getSupabaseAdmin();
  const reservation = await reserveFastCodeForRequest(requestId);
  if (!reservation.ok) return reservation;
  const registrationLink = `/talispros/register?request=${requestId}`;
  await supabaseAdmin.from("build_request_registrations").upsert(
    {
      build_request_id: requestId,
      registration_link: registrationLink,
      status: "pending",
    },
    { onConflict: "build_request_id" }
  );
  const { error } = await supabaseAdmin
    .from("build_requests")
    .update({ status: "Awaiting Registration", registration_link: registrationLink })
    .eq("id", requestId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/marketing");
  return { ok: true };
}

export async function setBuildRequestStatus(
  requestId: string,
  status:
    | "Under Review"
    | "Rejected"
    | "Changes Requested"
    | "Awaiting Registration"
    | "Published"
): Promise<{ ok: boolean; error?: string }> {
  const supabaseAdmin = getSupabaseAdmin();
  const payload: Record<string, string | null> = { status };
  if (status === "Published") {
    payload.activated_at = new Date().toISOString();
  }
  if (status === "Rejected") {
    payload.approval_status = "Rejected";
  }
  const { error } = await supabaseAdmin.from("build_requests").update(payload).eq("id", requestId);
  if (error) return { ok: false, error: error.message };

  if (status === "Rejected") {
    const mapsiteId = await resolveLinkedMapSiteId(requestId);
    if (mapsiteId) {
      const archived = await transitionMapSiteStatus(mapsiteId, "ARCHIVED");
      if (!archived.ok) {
        await supabaseAdmin
          .from("mapsites")
          .update({ status: "archived", updated_at: new Date().toISOString() })
          .eq("id", mapsiteId);
      }
    }
  }
  if (status === "Under Review") {
    const mapsiteId = await resolveLinkedMapSiteId(requestId);
    if (mapsiteId) {
      await transitionMapSiteStatus(mapsiteId, "MARKETING_REVIEW");
    }
  }

  revalidatePath("/admin/marketing");
  revalidatePath(MAPSITE_APP_PATH);
  return { ok: true };
}

export async function getBuildRequestDetails(requestId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: request } = await supabaseAdmin
    .from("build_requests")
    .select("*")
    .eq("id", requestId)
    .single();
  const { data: assets } = await supabaseAdmin
    .from("mapsite_assets")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle();

  let mapsite = null;
  if (request?.linked_mapsite_id) {
    const { data } = await supabaseAdmin
      .from("mapsites")
      .select(
        "id, fast_code, status, latitude, longitude, property_title, cover_image, header_image_url, mls_url, broker_url, website, teb_url, ttv_url, assigned_marketing_manager, is_demonstration, created_at, updated_at"
      )
      .eq("id", request.linked_mapsite_id)
      .maybeSingle();
    mapsite = data;
  }

  return { request, assets, mapsite };
}

export async function updateBuildRequestDetails(
  requestId: string,
  updates: Record<string, unknown>
): Promise<ActionResult> {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("build_requests").update(updates).eq("id", requestId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/marketing/${requestId}`);
  revalidatePath("/admin/marketing");
  return { ok: true };
}

export async function updateBuildRequestAssets(
  requestId: string,
  updates: Record<string, string | null>
): Promise<ActionResult> {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("mapsite_assets")
    .upsert(
      {
        request_id: requestId,
        profile_image: updates.profile_image ?? null,
        logo_image: updates.logo_image ?? null,
        pin_image: updates.pin_image ?? null,
        monologue_pdf: updates.monologue_pdf ?? null,
        ebook_pdf: updates.ebook_pdf ?? null,
      },
      { onConflict: "request_id" }
    );
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/marketing/${requestId}`);
  return { ok: true };
}

async function resolveLinkedMapSiteId(requestId: string): Promise<string | null> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data } = await supabaseAdmin
    .from("build_requests")
    .select("linked_mapsite_id")
    .eq("id", requestId)
    .maybeSingle();
  return data?.linked_mapsite_id ?? null;
}

export async function approveBuildRequestForMarketing(
  requestId: string
): Promise<ActionResult> {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("build_requests")
    .update({
      status: "Under Review",
      approval_status: "Approved",
      approved_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (error) return { ok: false, error: error.message };

  const mapsiteId = await resolveLinkedMapSiteId(requestId);
  if (mapsiteId) {
    await transitionMapSiteStatus(mapsiteId, "MARKETING_REVIEW");
  }

  revalidatePath("/admin/marketing");
  revalidatePath(MAPSITE_APP_PATH);
  return { ok: true };
}

export async function activateMapSiteForRequest(
  requestId: string
): Promise<ActionResult> {
  const supabaseAdmin = getSupabaseAdmin();
  const mapsiteId = await resolveLinkedMapSiteId(requestId);
  if (!mapsiteId) {
    return {
      ok: false,
      error: "No linked Mapsite™. Create a Mapsite™ or claim from the map first.",
    };
  }

  const { getMapSitePlatformById } = await import("@/lib/talispros/mapsite-platform");
  const { toDbStatus } = await import("@/lib/talispros/mapsite-state");
  const current = await getMapSitePlatformById(mapsiteId);
  if (!current) {
    return { ok: false, error: "Linked Mapsite™ was not found." };
  }

  if (current.status !== "ACTIVE") {
    // Force ACTIVE for marketing activation (admin override of intermediate states).
    const { error: statusError } = await supabaseAdmin
      .from("mapsites")
      .update({
        status: toDbStatus("ACTIVE"),
        updated_at: new Date().toISOString(),
      })
      .eq("id", mapsiteId);
    if (statusError) return { ok: false, error: statusError.message };
  }

  const { error } = await supabaseAdmin
    .from("build_requests")
    .update({
      status: "Mapsite™ Active",
      approval_status: "Approved",
      activated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/marketing");
  revalidatePath(MAPSITE_APP_PATH);
  return { ok: true };
}

export async function updateLinkedMapSiteResources(
  requestId: string,
  updates: MapSiteResourceUpdates
): Promise<ActionResult> {
  const mapsiteId = await resolveLinkedMapSiteId(requestId);
  if (!mapsiteId) {
    return { ok: false, error: "No linked Mapsite™ for this Build Request." };
  }

  const result = await updateMapSiteResources(mapsiteId, updates);
  if (!result.ok) return result;

  if (updates.fast_code) {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin
      .from("build_requests")
      .update({ requested_fast_code: updates.fast_code })
      .eq("id", requestId);
  }

  revalidatePath(`/admin/marketing/${requestId}`);
  revalidatePath("/admin/marketing");
  revalidatePath(MAPSITE_APP_PATH);
  return { ok: true };
}
