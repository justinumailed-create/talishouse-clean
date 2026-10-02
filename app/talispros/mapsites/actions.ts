"use server";

import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import {
  canEditMapSite,
  clearMapSiteBrowserSession,
  establishPaidMapSiteBrowserSession,
  setMapSiteOwnerSession,
} from "@/lib/mapsite-edit-auth";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { isDemoMapSiteCode } from "@/lib/talispros/demo-mapsite";
import { isAllPinsFastCode } from "@/lib/talispros/allpins-mapsite-constants";
import { ROUTES } from "@/lib/routes";
import { hasCompletedMapSiteActivationPayment } from "@/lib/talispros/mapsite-payment";
import {
  buildClaimedMapSitePath,
  claimedMapSiteSegmentForAccountOrPlan,
} from "@/lib/talispros/mapsite-state";

export async function establishMapSiteOwnerSession(
  mapsiteFastCode: string,
  enteredCode: string
): Promise<{ success: boolean; error?: string }> {
  const target = mapsiteFastCode.trim().toLowerCase();
  const entered = enteredCode.trim().toLowerCase();

  if (!target) {
    return { success: false, error: "Mapsite™ FAST code is required." };
  }

  if (!entered || entered !== target) {
    return {
      success: false,
      error: "Enter the FAST code for this Mapsite™ to continue.",
    };
  }

  const mapsite = await getMapSiteByFastCode(target);
  if (!mapsite) {
    return { success: false, error: "Mapsite™ not found." };
  }

  await setMapSiteOwnerSession(target);
  return { success: true };
}

export async function checkMapSiteEditAccess(
  fastCode: string
): Promise<boolean> {
  return canEditMapSite(fastCode);
}

/**
 * Prefer payment plan, then build-request / FAST Code account type, so Root
 * activations (e.g. rm22) open /brokers/… instead of a generic listings path.
 */
export async function resolveClaimedMapSiteAccountTypeSegment(options: {
  fastCode: string;
  mapsiteId?: string | null;
}): Promise<string> {
  const fastCode = options.fastCode.trim();
  const mapsiteId = options.mapsiteId?.trim() || null;
  if (!fastCode && !mapsiteId) return "listings";
  if (!isSupabaseAdminConfigured()) return "listings";

  try {
    const supabase = getSupabaseAdmin();

    if (mapsiteId) {
      const { data: payment } = await supabase
        .from("talispros_payments")
        .select("plan_type, payment_status")
        .eq("mapsite_id", mapsiteId)
        .order("created_at", { ascending: false })
        .limit(5);
      for (const row of payment || []) {
        const status = row.payment_status?.trim().toLowerCase() || "";
        if (
          row.plan_type &&
          (status === "completed" ||
            status === "paid" ||
            status === "complete" ||
            status === "succeeded")
        ) {
          return claimedMapSiteSegmentForAccountOrPlan(row.plan_type);
        }
      }
    }

    if (fastCode) {
      const { data: paymentByCode } = await supabase
        .from("talispros_payments")
        .select("plan_type, payment_status")
        .ilike("fast_code", fastCode)
        .order("created_at", { ascending: false })
        .limit(5);
      for (const row of paymentByCode || []) {
        const status = row.payment_status?.trim().toLowerCase() || "";
        if (
          row.plan_type &&
          (status === "completed" ||
            status === "paid" ||
            status === "complete" ||
            status === "succeeded")
        ) {
          return claimedMapSiteSegmentForAccountOrPlan(row.plan_type);
        }
      }

      const { data: codeRow } = await supabase
        .from("fast_codes")
        .select("account_type, request_id")
        .ilike("code", fastCode)
        .maybeSingle();
      if (codeRow?.account_type) {
        return claimedMapSiteSegmentForAccountOrPlan(codeRow.account_type);
      }
      if (codeRow?.request_id) {
        const { data: request } = await supabase
          .from("build_requests")
          .select("requested_account_type, account_type")
          .eq("id", codeRow.request_id)
          .maybeSingle();
        const accountType =
          request?.requested_account_type || request?.account_type || "";
        if (accountType) {
          return claimedMapSiteSegmentForAccountOrPlan(accountType);
        }
      }
    }

    if (mapsiteId) {
      const { data: request } = await supabase
        .from("build_requests")
        .select("requested_account_type, account_type")
        .eq("linked_mapsite_id", mapsiteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const accountType =
        request?.requested_account_type || request?.account_type || "";
      if (accountType) {
        return claimedMapSiteSegmentForAccountOrPlan(accountType);
      }
    }
  } catch (error) {
    console.warn(
      "[mapsite] resolveClaimedMapSiteAccountTypeSegment failed:",
      error,
    );
  }

  return "listings";
}

/**
 * Homepage FAST Code entry: open the connected claimed Mapsite™ with the same
 * owner / paid browser session as the normal paid return path (not public-only).
 */
export async function openClaimedMapSiteFromHomeFastCode(
  rawCode: string
): Promise<{ success: boolean; href?: string; error?: string }> {
  const code = rawCode
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "");

  if (!code) {
    return { success: false, error: "Please enter a FAST Code." };
  }

  if (!/^[a-z0-9-]+$/.test(code)) {
    return {
      success: false,
      error: "Invalid format. Use letters, numbers, or hyphens only.",
    };
  }

  if (isDemoMapSiteCode(code)) {
    return {
      success: false,
      error: "Enter your issued FAST Code to open your claimed Mapsite™.",
    };
  }

  // ALLPINS opens the live /talisu/mkts Markets map.
  if (isAllPinsFastCode(code)) {
    return { success: true, href: ROUTES.TALISU_MARKETS };
  }

  const mapsite = await getMapSiteByFastCode(code);
  if (!mapsite) {
    return {
      success: false,
      error: "No Mapsite™ found for that FAST Code.",
    };
  }

  const resolvedCode = (mapsite.fastCode || code).trim().toLowerCase();

  const paid = await hasCompletedMapSiteActivationPayment({
    fastCode: resolvedCode,
    mapsiteId: mapsite.id,
    reconcileFromStripe: true,
  });

  // Paid users get owner + root-account cookies; unpaid still get owner chrome.
  if (paid) {
    await establishPaidMapSiteBrowserSession(resolvedCode);
  } else {
    await setMapSiteOwnerSession(resolvedCode);
  }

  const accountType = await resolveClaimedMapSiteAccountTypeSegment({
    fastCode: resolvedCode,
    mapsiteId: mapsite.id,
  });

  const href = buildClaimedMapSitePath({
    fastCode: resolvedCode,
    accountType,
  });

  return { success: true, href };
}

/**
 * Logout from claimed/paid Mapsite™ owner view: clear owner + paid cookies and
 * return to the Talispros home page so no claimed/public Mapsite™ shell remains.
 */
export async function logoutMapSiteOwnerSession(_options?: {
  fastCode?: string | null;
  accountType?: string | null;
}): Promise<{ success: boolean; href: string }> {
  void _options; // Keep the action signature compatible with existing Mapsite chrome callers.
  await clearMapSiteBrowserSession();
  return { success: true, href: "/" };
}
