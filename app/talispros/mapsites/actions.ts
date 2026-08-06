"use server";

import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import {
  canEditMapSite,
  setMapSiteOwnerSession,
} from "@/lib/mapsite-edit-auth";

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
