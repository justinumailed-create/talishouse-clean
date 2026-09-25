"use server";

import { redirect } from "next/navigation";
import { requireMapSiteEditAccess } from "@/lib/mapsite-edit-auth";
import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { createAdminNotification } from "@/lib/talispros/admin-notifications";
import {
  isUrlGateExpired,
  isUrlGatePinFormat,
  listingResourceHref,
  MAPSITE_URL_GATE_REGEN_COOLDOWN_MS,
  MAPSITE_URL_GATE_TTL_LABEL,
  normalizeUrlGatePin,
  urlGateExpiresAt,
} from "@/lib/talispros/mapsite-url-gate";
import {
  generateUrlGatePin,
  hashUrlGatePin,
  urlGatePinsMatch,
} from "@/lib/talispros/mapsite-url-gate-crypto";

const STORAGE_ERROR =
  "URL secure-code storage is not available. Apply the mapsite_url_gate migrations.";

type GateSource = "visitor" | "admin";

async function persistUrlGateCode(options: {
  fastCode: string;
  source: GateSource;
  requireEditAccess: boolean;
}): Promise<{
  success: boolean;
  pin?: string;
  issuedAt?: string;
  expiresAt?: string;
  error?: string;
}> {
  if (options.requireEditAccess) {
    try {
      await requireMapSiteEditAccess(options.fastCode);
    } catch {
      return { success: false, error: "Unauthorized" };
    }
  }

  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: STORAGE_ERROR };
  }

  const mapsite = await getMapSiteByFastCode(options.fastCode);
  if (!mapsite) {
    return { success: false, error: "Mapsite™ not found" };
  }

  const dest = listingResourceHref(mapsite.brokerUrl);
  if (!dest) {
    return {
      success: false,
      error: "No listing/payment URL is on file for this Mapsite™.",
    };
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("mapsite_url_gate_pins")
    .select("issued_at, consumed_at, expires_at")
    .eq("mapsite_id", mapsite.id)
    .maybeSingle();

  if (
    existing?.issued_at &&
    !existing.consumed_at &&
    !isUrlGateExpired(existing.expires_at)
  ) {
    const issuedMs = new Date(existing.issued_at).getTime();
    if (
      !Number.isNaN(issuedMs) &&
      Date.now() - issuedMs < MAPSITE_URL_GATE_REGEN_COOLDOWN_MS
    ) {
      return {
        success: false,
        error:
          "A secure code was just generated. Wait a few seconds, or enter the code from Admin Notifications.",
      };
    }
  }

  const pin = generateUrlGatePin();
  const issuedAt = new Date().toISOString();
  const expiresAt = urlGateExpiresAt(new Date(issuedAt)).toISOString();
  const fastLabel = mapsite.fastCode.trim().toUpperCase();
  const titleLabel =
    mapsite.propertyTitle?.trim() ||
    mapsite.propertyAddress?.trim() ||
    "Mapsite™";

  const notification = await createAdminNotification({
    type: "mapsite_url_gate_code",
    title: `URL secure code · ${fastLabel}`,
    body: `Secure code ${pin} for ${titleLabel} (FAST ${fastLabel}). Valid ${MAPSITE_URL_GATE_TTL_LABEL}, single-use. Share it so the payment/listing URL can open.`,
    metadata: {
      mapsiteId: mapsite.id,
      fastCode: mapsite.fastCode,
      propertyTitle: mapsite.propertyTitle ?? null,
      code: pin,
      expiresAt,
      source: options.source,
    },
  });

  if (!notification.success) {
    return { success: false, error: notification.error };
  }

  const { error } = await supabase.from("mapsite_url_gate_pins").upsert(
    {
      mapsite_id: mapsite.id,
      pin_hash: hashUrlGatePin(mapsite.fastCode, pin),
      issued_at: issuedAt,
      expires_at: expiresAt,
      consumed_at: null,
      source: options.source,
      notification_id: notification.id,
    },
    { onConflict: "mapsite_id" },
  );

  if (error) {
    return { success: false, error: error.message || STORAGE_ERROR };
  }

  return { success: true, pin, issuedAt, expiresAt };
}

/** Visitor (published Mapsite™ popup): generate a code and ship it to Admin Notifications. */
export async function requestMapSiteUrlGateCode(fastCode: string): Promise<{
  success: boolean;
  issuedAt?: string;
  expiresAt?: string;
  ttlLabel?: string;
  error?: string;
}> {
  const result = await persistUrlGateCode({
    fastCode,
    source: "visitor",
    requireEditAccess: false,
  });
  if (!result.success) {
    return { success: false, error: result.error };
  }
  // Never return the plaintext PIN to the visitor — admin reads it in Notifications.
  return {
    success: true,
    issuedAt: result.issuedAt,
    expiresAt: result.expiresAt,
    ttlLabel: MAPSITE_URL_GATE_TTL_LABEL,
  };
}

/** Admin editor / Notifications fallback: generate and show the PIN once. */
export async function issueMapSiteUrlGatePin(fastCode: string): Promise<{
  success: boolean;
  pin?: string;
  issuedAt?: string;
  expiresAt?: string;
  error?: string;
}> {
  return persistUrlGateCode({
    fastCode,
    source: "admin",
    requireEditAccess: true,
  });
}

async function unlockWithPin(
  fastCode: string,
  rawPin: string,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  const pin = normalizeUrlGatePin(rawPin);
  if (!isUrlGatePinFormat(pin)) {
    return {
      success: false,
      error: "Enter the 6-digit secure code from Admin Notifications.",
    };
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
    return {
      success: false,
      error: "No listing/payment URL is on file for this Mapsite™.",
    };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mapsite_url_gate_pins")
    .select("pin_hash, expires_at, consumed_at")
    .eq("mapsite_id", mapsite.id)
    .maybeSingle();

  if (error) {
    return { success: false, error: STORAGE_ERROR };
  }
  if (!data?.pin_hash) {
    return {
      success: false,
      error: "Generate a secure code first. Admin will see it under Notifications.",
    };
  }
  if (data.consumed_at) {
    return {
      success: false,
      error: "That secure code was already used. Generate a new one.",
    };
  }
  if (isUrlGateExpired(data.expires_at)) {
    return {
      success: false,
      error: `That secure code expired (${MAPSITE_URL_GATE_TTL_LABEL}). Generate a new one.`,
    };
  }
  if (!urlGatePinsMatch(mapsite.fastCode, pin, data.pin_hash)) {
    return { success: false, error: "That secure code is not valid." };
  }

  const consumedAt = new Date().toISOString();
  const { error: consumeError } = await supabase
    .from("mapsite_url_gate_pins")
    .update({ consumed_at: consumedAt })
    .eq("mapsite_id", mapsite.id)
    .is("consumed_at", null);

  if (consumeError) {
    return { success: false, error: consumeError.message || STORAGE_ERROR };
  }

  return { success: true, url: dest };
}

/** Popup / client: validate code and return the URL (open in a new tab). */
export async function unlockMapSiteUrlWithGatePin(
  fastCode: string,
  pin: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  const result = await unlockWithPin(fastCode, pin);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true, url: result.url };
}

/** Standalone gate page form: same unlock, then redirect (legacy deep link). */
export async function submitMapSiteUrlGatePin(
  fastCode: string,
  formData: FormData,
): Promise<{ success: false; error: string }> {
  const result = await unlockWithPin(
    fastCode,
    String(formData.get("pin") || ""),
  );
  if (!result.success) {
    return { success: false, error: result.error };
  }
  redirect(result.url);
}
