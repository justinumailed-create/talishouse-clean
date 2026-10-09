import type Stripe from "stripe";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { isAllPinsFastCode } from "@/lib/talispros/allpins-mapsite-constants";
import { isDemonstrationListing } from "@/lib/talispros/demo-mapsite";
import {
  MAPSITE_ADDITIONAL_PIN_CURRENCY,
  MAPSITE_ADDITIONAL_PIN_PRICE_CENTS,
  additionalPinPaymentMatches,
  capacityFromCounts,
  clampFreePinCredits,
  defaultMapSitePinDashboard,
  freePinGrantDeltaError,
  isAdditionalPinsCheckout,
  normalizePinCoordinate,
  normalizePinLabel,
  quantityFromCheckoutMetadata,
  resolvePinQuota,
  type MapSiteAdditionalPin,
  type MapSitePinDashboardState,
} from "@/lib/talispros/mapsite-additional-pins";
import {
  stripeCheckoutSessionIsPaid,
  stripeMapSiteIdFromCheckoutSession,
  stripePaymentIntentIdFromSession,
} from "@/lib/talispros/stripe-mapsite-session";
import { DEMO_MAPSITE_ID } from "@/lib/talispros/mapsite-state";
import { getMapSiteByFastCode } from "@/lib/mapsite-service";

const MIGRATION_HINT =
  "Additional PIN storage is not ready. Apply supabase/migrations/092_mapsite_additional_pins.sql and 095_mapsite_free_pin_credits.sql.";

export type AdditionalPinFulfillmentResult = {
  success: boolean;
  ignored?: boolean;
  alreadyProcessed?: boolean;
  error?: string;
  pinQuota?: number;
  purchasedPins?: number;
  granted?: number;
};

type GrantPayload = {
  ok?: boolean;
  error?: string;
  alreadyProcessed?: boolean;
  pinQuota?: number;
  purchasedPins?: number;
  granted?: number;
};

export function mapsiteCannotSellAdditionalPins(input: {
  mapsiteId: string;
  fastCode?: string | null;
  isDemonstration?: boolean | null;
}): string | null {
  if (input.mapsiteId === DEMO_MAPSITE_ID || isAllPinsFastCode(input.fastCode)) {
    return "This Mapsite cannot buy additional PINs.";
  }
  if (
    isDemonstrationListing({
      isDemonstration: input.isDemonstration,
      fastCode: input.fastCode,
    })
  ) {
    return "Demonstration Mapsites cannot buy additional PINs.";
  }
  return null;
}

function isMissingPinSchema(message: string): boolean {
  return /pin_quota|purchased_pins|free_pin_credits|free_quantity|mapsite_additional_pins|mapsite_pin_purchases|mapsite_free_pin_grants|schema cache|does not exist|grant_mapsite_additional_pins|redeem_mapsite_free_pins|admin_grant_mapsite_free_pins/i.test(
    message,
  );
}

function readGrantPayload(data: unknown): GrantPayload | null {
  if (!data || typeof data !== "object") return null;
  const row = data as GrantPayload;
  if (typeof row.ok !== "boolean") return null;
  return row;
}

export async function loadMapSitePinDashboard(
  mapsiteId: string,
): Promise<MapSitePinDashboardState> {
  const empty = defaultMapSitePinDashboard();
  const id = mapsiteId.trim();
  if (!id || !isSupabaseAdminConfigured()) return empty;

  try {
    const supabase = getSupabaseAdmin();
    const [{ data: row, error: rowError }, { data: pinRows, error: pinError }] =
      await Promise.all([
        supabase
          .from("mapsites")
          .select("pin_quota, purchased_pins, free_pin_credits")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("mapsite_additional_pins")
          .select("id, latitude, longitude, label, sort_order")
          .eq("mapsite_id", id)
          .order("sort_order", { ascending: true }),
      ]);

    const message = rowError?.message || pinError?.message || "";
    if (message) {
      if (!isMissingPinSchema(message)) {
        console.warn("[mapsite-pins] load failed:", message);
      }
      return empty;
    }

    const pins: MapSiteAdditionalPin[] = (pinRows ?? []).map((pin) => ({
      id: pin.id,
      latitude: pin.latitude,
      longitude: pin.longitude,
      label: pin.label || "",
      sortOrder: pin.sort_order || 0,
    }));

    return capacityFromCounts({
      pinQuota: row?.pin_quota,
      purchasedPins: row?.purchased_pins,
      freePinCredits: row?.free_pin_credits,
      placedPins: pins.length,
      pins,
    });
  } catch (error) {
    console.warn("[mapsite-pins] load failed:", error);
    return empty;
  }
}

export async function listMapSiteAdditionalPins(
  mapsiteId: string,
): Promise<MapSiteAdditionalPin[]> {
  const dashboard = await loadMapSitePinDashboard(mapsiteId);
  return dashboard.pins;
}

export async function fulfillAdditionalPinsFromStripeCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<AdditionalPinFulfillmentResult> {
  if (!isAdditionalPinsCheckout(session.metadata)) {
    return { success: true, ignored: true };
  }
  if (!stripeCheckoutSessionIsPaid(session)) {
    return { success: true, ignored: true };
  }

  const mapsiteId = stripeMapSiteIdFromCheckoutSession(session) || "";
  const quantity = quantityFromCheckoutMetadata(session.metadata);
  if (!mapsiteId || quantity == null) {
    return {
      success: false,
      error: "Checkout session is missing Mapsite PIN details.",
    };
  }

  const amountTotal = session.amount_total ?? null;
  const currency = session.currency ?? null;
  if (!additionalPinPaymentMatches({ quantity, amountTotal, currency })) {
    return {
      success: false,
      error: "Payment amount does not match $7 CAD per PIN.",
    };
  }

  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Supabase is not configured." };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("grant_mapsite_additional_pins", {
    p_mapsite_id: mapsiteId,
    p_quantity: quantity,
    p_session_id: session.id,
    p_payment_intent_id: stripePaymentIntentIdFromSession(session),
    p_amount_total: amountTotal ?? 0,
    p_currency: currency ?? "",
    p_email:
      session.customer_details?.email ||
      session.customer_email ||
      null,
    p_fast_code: session.metadata?.fastCode?.trim() || null,
  });

  if (error) {
    console.error("[mapsite-pins] grant failed:", error.message);
    return {
      success: false,
      error: isMissingPinSchema(error.message)
        ? MIGRATION_HINT
        : "Could not unlock additional PINs.",
    };
  }

  const grant = readGrantPayload(data);
  if (!grant?.ok) {
    return {
      success: false,
      error: grant?.error || "Could not unlock additional PINs.",
    };
  }

  return {
    success: true,
    alreadyProcessed: Boolean(grant.alreadyProcessed),
    pinQuota: grant.pinQuota,
    purchasedPins: grant.purchasedPins,
    granted: grant.granted,
  };
}

export async function readMapSiteForPinPurchase(mapsiteId: string): Promise<{
  id: string;
  fastCode: string;
  email: string;
  accountType: string;
  isDemonstration: boolean;
  pinQuota: number;
  purchasedPins: number;
  freePinCredits: number;
} | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mapsites")
    .select(
      "id, fast_code, email, account_type, is_demonstration, pin_quota, purchased_pins, free_pin_credits",
    )
    .eq("id", mapsiteId)
    .maybeSingle();
  if (error || !data?.id) return null;
  const quota = resolvePinQuota({
    pinQuota: data.pin_quota,
    purchasedPins: data.purchased_pins,
  });
  return {
    id: data.id,
    fastCode: data.fast_code,
    email: data.email,
    accountType: data.account_type,
    isDemonstration: Boolean(data.is_demonstration),
    pinQuota: quota.pinQuota,
    purchasedPins: quota.purchasedPins,
    freePinCredits: clampFreePinCredits(data.free_pin_credits),
  };
}

export async function recordPendingPinPurchase(input: {
  mapsiteId: string;
  quantity: number;
  stripeCheckoutSessionId: string;
  email: string | null;
  fastCode: string | null;
}): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("mapsite_pin_purchases").insert({
    mapsite_id: input.mapsiteId,
    quantity: input.quantity,
    unit_amount_cents: MAPSITE_ADDITIONAL_PIN_PRICE_CENTS,
    currency: MAPSITE_ADDITIONAL_PIN_CURRENCY,
    stripe_checkout_session_id: input.stripeCheckoutSessionId,
    payment_status: "pending",
    email: input.email,
    fast_code: input.fastCode,
  });
  if (error && !/duplicate|unique/i.test(error.message)) {
    console.warn("[mapsite-pins] Could not record pending checkout:", error.message);
  }
}

export async function placeAdditionalPinRecord(input: {
  mapsiteId: string;
  latitude: number;
  longitude: number;
  label?: string | null;
}): Promise<{ pin?: MapSiteAdditionalPin; dashboard?: MapSitePinDashboardState; error?: string }> {
  const latitude = normalizePinCoordinate(input.latitude, "lat");
  const longitude = normalizePinCoordinate(input.longitude, "lng");
  if (latitude == null || longitude == null) {
    return { error: "Enter a valid latitude and longitude." };
  }
  if (!isSupabaseAdminConfigured()) {
    return { error: "Supabase is not configured." };
  }

  const supabase = getSupabaseAdmin();
  const dashboard = await loadMapSitePinDashboard(input.mapsiteId);
  if (dashboard.remainingToPlace <= 0) {
    return {
      error:
        dashboard.remainingPurchasable > 0
          ? "Buy another PIN before placing more."
          : "This Mapsite is at its PIN limit.",
    };
  }

  const { data, error } = await supabase
    .from("mapsite_additional_pins")
    .insert({
      mapsite_id: input.mapsiteId,
      latitude,
      longitude,
      label: normalizePinLabel(input.label),
      sort_order:
        dashboard.pins.reduce((max, pin) => Math.max(max, pin.sortOrder || 0), 0) + 1,
    })
    .select("id, latitude, longitude, label, sort_order")
    .single();

  if (error || !data) {
    const message = error?.message || "Could not place PIN.";
    if (/quota exceeded/i.test(message)) {
      return { error: "Buy another PIN before placing more." };
    }
    if (isMissingPinSchema(message)) return { error: MIGRATION_HINT };
    return { error: "Could not place PIN." };
  }

  const next = await loadMapSitePinDashboard(input.mapsiteId);
  return {
    pin: {
      id: data.id,
      latitude: data.latitude,
      longitude: data.longitude,
      label: data.label || "",
      sortOrder: data.sort_order || 0,
    },
    dashboard: next,
  };
}

export async function fixAdditionalPinRecord(input: {
  mapsiteId: string;
  pinId: string;
  latitude: number;
  longitude: number;
  label?: string | null;
}): Promise<{ pin?: MapSiteAdditionalPin; dashboard?: MapSitePinDashboardState; error?: string }> {
  const latitude = normalizePinCoordinate(input.latitude, "lat");
  const longitude = normalizePinCoordinate(input.longitude, "lng");
  if (latitude == null || longitude == null) {
    return { error: "Enter a valid latitude and longitude." };
  }
  if (!isSupabaseAdminConfigured()) {
    return { error: "Supabase is not configured." };
  }

  const supabase = getSupabaseAdmin();
  const patch: {
    latitude: number;
    longitude: number;
    updated_at: string;
    label?: string;
  } = {
    latitude,
    longitude,
    updated_at: new Date().toISOString(),
  };
  if (input.label !== undefined) {
    patch.label = normalizePinLabel(input.label);
  }

  const { data, error } = await supabase
    .from("mapsite_additional_pins")
    .update(patch)
    .eq("id", input.pinId)
    .eq("mapsite_id", input.mapsiteId)
    .select("id, latitude, longitude, label, sort_order")
    .maybeSingle();

  if (error) {
    if (isMissingPinSchema(error.message)) return { error: MIGRATION_HINT };
    return { error: "Could not update PIN." };
  }
  if (!data) return { error: "PIN was not found on this Mapsite." };

  return {
    pin: {
      id: data.id,
      latitude: data.latitude,
      longitude: data.longitude,
      label: data.label || "",
      sortOrder: data.sort_order || 0,
    },
    dashboard: await loadMapSitePinDashboard(input.mapsiteId),
  };
}

/** Remove a placed extra PIN. Capacity is unchanged, so it can be placed again. */
export async function deleteAdditionalPinRecord(input: {
  mapsiteId: string;
  pinId: string;
}): Promise<{ dashboard?: MapSitePinDashboardState; error?: string }> {
  const pinId = input.pinId.trim();
  if (!pinId) return { error: "PIN was not found on this Mapsite." };
  if (!isSupabaseAdminConfigured()) {
    return { error: "Supabase is not configured." };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mapsite_additional_pins")
    .delete()
    .eq("id", pinId)
    .eq("mapsite_id", input.mapsiteId)
    .select("id");

  if (error) {
    if (isMissingPinSchema(error.message)) return { error: MIGRATION_HINT };
    return { error: "Could not delete PIN." };
  }
  if (!data || data.length === 0) return { error: "PIN was not found on this Mapsite." };

  return { dashboard: await loadMapSitePinDashboard(input.mapsiteId) };
}

type FreePinRpcPayload = {
  ok?: boolean;
  error?: string;
  redeemed?: number;
  applied?: number;
  pinQuota?: number;
  purchasedPins?: number;
  freePinCredits?: number;
};

function readFreePinPayload(data: unknown): FreePinRpcPayload | null {
  if (!data || typeof data !== "object") return null;
  return data as FreePinRpcPayload;
}

/**
 * Spend admin-granted free PIN credits to raise pin_quota without Stripe.
 * Atomic in Postgres (row lock); fails if credits or room are insufficient.
 */
export async function redeemFreePinCredits(input: {
  mapsiteId: string;
  quantity: number;
  email: string | null;
  fastCode: string | null;
}): Promise<{
  success: boolean;
  error?: string;
  redeemed?: number;
  freePinCredits?: number;
}> {
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    return { success: false, error: "Choose at least 1 PIN." };
  }
  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Supabase is not configured." };
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("redeem_mapsite_free_pins", {
    p_mapsite_id: input.mapsiteId,
    p_quantity: input.quantity,
    p_email: input.email,
    p_fast_code: input.fastCode,
  });
  if (error) {
    console.error("[mapsite-pins] free redemption failed:", error.message);
    return {
      success: false,
      error: isMissingPinSchema(error.message)
        ? MIGRATION_HINT
        : "Could not apply free PINs.",
    };
  }
  const payload = readFreePinPayload(data);
  if (!payload?.ok) {
    return {
      success: false,
      error: payload?.error || "Could not apply free PINs.",
      freePinCredits: payload?.freePinCredits,
    };
  }
  return {
    success: true,
    redeemed: payload.redeemed ?? input.quantity,
    freePinCredits: payload.freePinCredits,
  };
}

export type FreePinGrantRecord = {
  id: string;
  fastCode: string;
  delta: number;
  balanceAfter: number;
  grantedBy: string;
  note: string | null;
  createdAt: string;
};

export type FreePinAdminSnapshot = {
  mapsiteId: string;
  fastCode: string;
  freePinCredits: number;
  pinQuota: number;
  purchasedPins: number;
};

async function findMapSiteRowByFastCode(fastCode: string) {
  const code = fastCode.trim();
  if (!code || !isSupabaseAdminConfigured()) return null;
  // Same FAST Code™ resolution as the Mapsite pages (fast_codes link + mapsites.fast_code).
  const mapsite = await getMapSiteByFastCode(code);
  if (!mapsite?.id) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mapsites")
    .select("id, fast_code, is_demonstration, pin_quota, purchased_pins, free_pin_credits")
    .eq("id", mapsite.id)
    .maybeSingle();
  if (error) {
    if (!isMissingPinSchema(error.message)) {
      console.warn("[mapsite-pins] FAST Code lookup failed:", error.message);
    }
    return null;
  }
  return data;
}

export async function loadFreePinAdminSnapshot(
  fastCode: string,
): Promise<FreePinAdminSnapshot | null> {
  const row = await findMapSiteRowByFastCode(fastCode);
  if (!row?.id) return null;
  const quota = resolvePinQuota({
    pinQuota: row.pin_quota,
    purchasedPins: row.purchased_pins,
  });
  return {
    mapsiteId: row.id,
    fastCode: row.fast_code,
    freePinCredits: clampFreePinCredits(row.free_pin_credits),
    pinQuota: quota.pinQuota,
    purchasedPins: quota.purchasedPins,
  };
}

export async function listFreePinGrants(options: {
  mapsiteId?: string | null;
  limit?: number;
} = {}): Promise<FreePinGrantRecord[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("mapsite_free_pin_grants")
    .select("id, fast_code, delta, balance_after, granted_by, note, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(options.limit ?? 20, 1), 100));
  if (options.mapsiteId) query = query.eq("mapsite_id", options.mapsiteId);
  const { data, error } = await query;
  if (error) {
    if (!isMissingPinSchema(error.message)) {
      console.warn("[mapsite-pins] grant audit load failed:", error.message);
    }
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    fastCode: row.fast_code,
    delta: row.delta,
    balanceAfter: row.balance_after,
    grantedBy: row.granted_by,
    note: row.note,
    createdAt: row.created_at,
  }));
}

/** Admin grant (positive delta) or revoke (negative delta), with audit row. */
export async function grantFreePinCreditsForFastCode(input: {
  fastCode: string;
  delta: number;
  grantedBy: string;
  note?: string | null;
}): Promise<{
  success: boolean;
  error?: string;
  applied?: number;
  snapshot?: FreePinAdminSnapshot;
}> {
  const deltaError = freePinGrantDeltaError(input.delta);
  if (deltaError) return { success: false, error: deltaError };
  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Supabase is not configured." };
  }

  const row = await findMapSiteRowByFastCode(input.fastCode);
  if (!row?.id) {
    return { success: false, error: "No Mapsite found for that FAST Code™." };
  }
  if (input.delta > 0) {
    const blocked = mapsiteCannotSellAdditionalPins({
      mapsiteId: row.id,
      fastCode: row.fast_code,
      isDemonstration: row.is_demonstration,
    });
    if (blocked) {
      return {
        success: false,
        error: blocked.replace("cannot buy additional PINs", "cannot receive free PINs"),
      };
    }
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("admin_grant_mapsite_free_pins", {
    p_mapsite_id: row.id,
    p_delta: input.delta,
    p_granted_by: input.grantedBy,
    p_note: input.note?.trim() || null,
  });
  if (error) {
    console.error("[mapsite-pins] free grant failed:", error.message);
    return {
      success: false,
      error: isMissingPinSchema(error.message)
        ? MIGRATION_HINT
        : "Could not grant free PINs.",
    };
  }
  const payload = readFreePinPayload(data);
  if (!payload?.ok) {
    return { success: false, error: payload?.error || "Could not grant free PINs." };
  }
  const snapshot = await loadFreePinAdminSnapshot(row.fast_code);
  return {
    success: true,
    applied: payload.applied ?? input.delta,
    snapshot: snapshot ?? undefined,
  };
}
