"use server";

import { processPayment } from "@/app/talispros/register/payment-actions";
import type { RegistrationMarket } from "@/lib/registration-market";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  getDemonstrationMapSite,
  getMapSitePlatformByFastCode,
  getMapSitePlatformById,
  mergeMapSiteWithSubmittedLocation,
  type MapSitePlatformRecord,
} from "@/lib/talispros/mapsite-platform";
import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";

export async function loadMapSiteApplicationState(options?: {
  mapsiteId?: string | null;
  fastCode?: string | null;
  requestId?: string | null;
  claimed?: boolean;
}): Promise<MapSitePlatformRecord> {
  const mapsiteId = options?.mapsiteId?.trim() || null;
  const fastCode = options?.fastCode?.trim() || null;
  const requestId = options?.requestId?.trim() || null;
  const claimed = Boolean(options?.claimed);

  let mapsite: MapSitePlatformRecord | null = null;

  if (mapsiteId) {
    mapsite = await getMapSitePlatformById(mapsiteId);
  }

  if (!mapsite && fastCode) {
    mapsite = await getMapSitePlatformByFastCode(fastCode);
  }

  if (!mapsite) {
    mapsite = await getDemonstrationMapSite();
  }

  if (claimed) {
    mapsite = {
      ...mapsite,
      status:
        mapsite.status === "UNCLAIMED"
          ? "BUILD_REQUEST_SUBMITTED"
          : mapsite.status,
      fast_code: fastCode || mapsite.fast_code,
    };
  } else if (fastCode && !mapsite.fast_code) {
    mapsite = { ...mapsite, fast_code: fastCode };
  }

  if (claimed || mapsite.status !== "UNCLAIMED") {
    mapsite = await mergeMapSiteWithSubmittedLocation(mapsite, {
      requestId,
      fastCode: fastCode || mapsite.fast_code,
    });
  }

  return mapsite;
}

export async function refreshMapSiteApplicationState(
  mapsiteId: string
): Promise<MapSitePlatformRecord | null> {
  const mapsite = await getMapSitePlatformById(mapsiteId);
  if (!mapsite) return null;
  return mergeMapSiteWithSubmittedLocation(mapsite);
}

/**
 * Capture Root Account™ PayPal payment from the MapSite™ sidebar.
 * Uses claim Build Request contact details when available.
 */
export async function processMapSiteRootPaypalPayment(input: {
  mapsiteId: string;
  requestId?: string | null;
  audience: RegistrationMarket;
  paypalOrderId: string;
  paypalCaptureId: string;
}): Promise<{
  success: boolean;
  redirectUrl?: string;
  fastCode?: string;
  error?: string;
}> {
  const mapsiteId = input.mapsiteId.trim();
  const requestId = input.requestId?.trim() || null;

  if (!mapsiteId) {
    return { success: false, error: "Missing MapSite id." };
  }
  if (!input.paypalOrderId?.trim()) {
    return { success: false, error: "Missing PayPal order id." };
  }

  try {
    const supabase = getSupabaseAdmin();

    let firstName = "MapSite";
    let lastName = "Owner";
    let email = "";
    let resolvedRequestId = requestId;

    if (!resolvedRequestId) {
      const { data: linkedRequest } = await supabase
        .from("build_requests")
        .select("id, first_name, last_name, email, linked_mapsite_id")
        .eq("linked_mapsite_id", mapsiteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (linkedRequest?.id) {
        resolvedRequestId = linkedRequest.id;
        firstName = linkedRequest.first_name?.trim() || firstName;
        lastName = linkedRequest.last_name?.trim() || lastName;
        email = linkedRequest.email?.trim() || email;
      }
    }

    if (resolvedRequestId) {
      const { data: request } = await supabase
        .from("build_requests")
        .select("id, first_name, last_name, email, linked_mapsite_id")
        .eq("id", resolvedRequestId)
        .maybeSingle();

      if (!request) {
        return { success: false, error: "Claim request not found." };
      }

      firstName = request.first_name?.trim() || firstName;
      lastName = request.last_name?.trim() || lastName;
      email = request.email?.trim() || email;

      if (!request.linked_mapsite_id) {
        await supabase
          .from("build_requests")
          .update({
            linked_mapsite_id: mapsiteId,
            requested_account_type: "root",
          })
          .eq("id", resolvedRequestId);
      }
    }

    if (!email) {
      const { data: mapsite } = await supabase
        .from("mapsites")
        .select("email, owner_first_name, owner_last_name")
        .eq("id", mapsiteId)
        .maybeSingle();

      email = mapsite?.email?.trim() || "";
      firstName = mapsite?.owner_first_name?.trim() || firstName;
      lastName = mapsite?.owner_last_name?.trim() || lastName;
    }

    if (!email || !resolvedRequestId) {
      return {
        success: false,
        error:
          "Complete Claim a Market first, then return here to pay with PayPal.",
      };
    }

    const result = await processPayment({
      email,
      firstName,
      lastName,
      planType: "ROOT_ACCOUNT",
      paypalOrderId: input.paypalOrderId,
      paypalCaptureId: input.paypalCaptureId,
      buildRequestId: resolvedRequestId,
    });

    if (!result.success) {
      return { success: false, error: result.error || "Payment failed." };
    }

    await supabase
      .from("mapsites")
      .update({
        status: "active",
        interest_form_enabled: true,
        ...(result.fastCode ? { fast_code: result.fastCode } : {}),
      })
      .eq("id", result.mapsiteId || mapsiteId);

    const params = new URLSearchParams({
      claimed: "1",
      mapsiteId: result.mapsiteId || mapsiteId,
      audience: input.audience,
    });
    if (result.fastCode) params.set("fastCode", result.fastCode);
    params.set("requestId", resolvedRequestId);

    return {
      success: true,
      fastCode: result.fastCode,
      redirectUrl: `${MAPSITE_APP_PATH}?${params.toString()}`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown payment error";
    console.error("[mapsite-paypal] Error:", error);
    return { success: false, error: message };
  }
}
