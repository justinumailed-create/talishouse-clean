"use server";

import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import {
  canEditMapSite,
  establishPaidMapSiteBrowserSession,
  setMapSiteOwnerSession,
} from "@/lib/mapsite-edit-auth";
import { isDemoMapSiteCode } from "@/lib/talispros/demo-mapsite";
import { hasCompletedMapSiteActivationPayment } from "@/lib/talispros/mapsite-payment";
import { buildClaimedMapSitePath } from "@/lib/talispros/mapsite-state";

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

  const mapsite = await getMapSiteByFastCode(code);
  if (!mapsite) {
    return {
      success: false,
      error: "No Mapsite™ found for that FAST Code.",
    };
  }

  const resolvedCode = (mapsite.fastCode || code).trim().toLowerCase();

  // Same owner cookie the edit gate / post-claim flows set — unlocks owner chrome.
  await setMapSiteOwnerSession(resolvedCode);

  const paid = await hasCompletedMapSiteActivationPayment({
    fastCode: resolvedCode,
    mapsiteId: mapsite.id,
    reconcileFromStripe: true,
  });

  // Paid users also get the root-account cookie used on the normal paid path.
  if (paid) {
    await establishPaidMapSiteBrowserSession(resolvedCode);
  }

  // Same destination as Back to Mapsite™ / mapsiteBackFromScheduleHref.
  const href = buildClaimedMapSitePath({
    fastCode: resolvedCode,
    accountType: "listings",
  });

  return { success: true, href };
}
