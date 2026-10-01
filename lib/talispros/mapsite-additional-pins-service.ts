import type Stripe from "stripe";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { isAllPinsFastCode } from "@/lib/talispros/allpins-mapsite-constants";
import { isDemonstrationListing } from "@/lib/talispros/demo-mapsite";
import {
  MAPSITE_ADDITIONAL_PIN_PRICE_CENTS,
  additionalPinPaymentMatches,
  capacityFromCounts,
  defaultMapSitePinDashboard,
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

const MIGRATION_HINT =
  "Additional PIN storage is not ready. Apply supabase/migrations/092_mapsite_additional_pins.sql.";

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
    return "This Mapsite™ cannot buy additional PINs.";
  }
  if (
    isDemonstrationListing({
      isDemonstration: input.isDemonstration,
      fastCode: input.fastCode,
    })
  ) {
    return "Demonstration Mapsites™ cannot buy additional PINs.";
  }
  return null;
}

function isMissingPinSchema(message: string): boolean {
  return /pin_quota|purchased_pins|mapsite_additional_pins|mapsite_pin_purchases|schema cache|does not exist|grant_mapsite_additional_pins/i.test(
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
          .select("pin_quota, purchased_pins")
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
      error: "Checkout session is missing Mapsite™ PIN details.",
    };
  }

  const amountTotal = session.amount_total ?? null;
  const currency = session.currency ?? null;
  if (!additionalPinPaymentMatches({ quantity, amountTotal, currency })) {
    return {
      success: false,
      error: "Payment amount does not match $10 USD per PIN.",
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
} | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mapsites")
    .select(
      "id, fast_code, email, account_type, is_demonstration, pin_quota, purchased_pins",
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
    currency: "usd",
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
          : "This Mapsite™ is at its PIN limit.",
    };
  }

  const { data, error } = await supabase
    .from("mapsite_additional_pins")
    .insert({
      mapsite_id: input.mapsiteId,
      latitude,
      longitude,
      label: normalizePinLabel(input.label),
      sort_order: dashboard.placedPins + 1,
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
  if (!data) return { error: "PIN was not found on this Mapsite™." };

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
