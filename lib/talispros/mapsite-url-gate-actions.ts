"use server";

import { redirect } from "next/navigation";
import { requireMapSiteEditAccess } from "@/lib/mapsite-edit-auth";
import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  isUrlGatePinFormat,
  listingResourceHref,
  normalizeUrlGatePin,
} from "@/lib/talispros/mapsite-url-gate";
import {
  generateUrlGatePin,
  hashUrlGatePin,
  urlGatePinsMatch,
} from "@/lib/talispros/mapsite-url-gate-crypto";

const STORAGE_ERROR =
  "URL PIN storage is not available. Apply the mapsite_url_gate_pins migration.";

export async function issueMapSiteUrlGatePin(fastCode: string): Promise<{
  success: boolean;
  pin?: string;
  issuedAt?: string;
  error?: string;
}> {
  try {
    await requireMapSiteEditAccess(fastCode);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: STORAGE_ERROR };
  }

  const mapsite = await getMapSiteByFastCode(fastCode);
  if (!mapsite) {
    return { success: false, error: "Mapsite™ not found" };
  }

  const pin = generateUrlGatePin();
  const issuedAt = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("mapsite_url_gate_pins").upsert(
    {
      mapsite_id: mapsite.id,
      pin_hash: hashUrlGatePin(mapsite.fastCode, pin),
      issued_at: issuedAt,
    },
    { onConflict: "mapsite_id" },
  );

  if (error) {
    return { success: false, error: error.message || STORAGE_ERROR };
  }

  return { success: true, pin, issuedAt };
}

export async function submitMapSiteUrlGatePin(
  fastCode: string,
  formData: FormData,
): Promise<{ success: false; error: string }> {
  const pin = normalizeUrlGatePin(String(formData.get("pin") || ""));
  if (!isUrlGatePinFormat(pin)) {
    return { success: false, error: "Enter the 6-digit PIN issued by Global Admin." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: STORAGE_ERROR };
  }

  const mapsite = await getMapSiteByFastCode(fastCode);
  if (!mapsite) {
    return { success: false, error: "Mapsite™ not found" };
  }

  const dest = listingResourceHref(mapsite.brokerUrl);
  if (!dest) {
    return { success: false, error: "No listing URL is on file for this Mapsite™." };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mapsite_url_gate_pins")
    .select("pin_hash")
    .eq("mapsite_id", mapsite.id)
    .maybeSingle();

  if (error) {
    return { success: false, error: STORAGE_ERROR };
  }
  if (!data?.pin_hash) {
    return {
      success: false,
      error: "Global Admin has not authorized a PIN for this Mapsite™ yet.",
    };
  }
  if (!urlGatePinsMatch(mapsite.fastCode, pin, data.pin_hash)) {
    return { success: false, error: "That PIN is not valid." };
  }

  redirect(dest);
}
