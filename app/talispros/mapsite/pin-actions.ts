"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireMapSiteEditAccess } from "@/lib/mapsite-edit-auth";
import { getStripeClient, getStripeSecretKey } from "@/lib/stripe";
import {
  ADDITIONAL_PINS_CHECKOUT_PURPOSE,
  MAPSITE_ADDITIONAL_PIN_CURRENCY,
  MAPSITE_ADDITIONAL_PIN_PRICE_CENTS,
  PIN_CHECKOUT_QUERY,
  PIN_CHECKOUT_SESSION_QUERY,
  additionalPinCheckoutQuantityError,
  parsePinCheckoutSessionId,
  splitFreeAndPaidPins,
  type MapSitePinDashboardState,
} from "@/lib/talispros/mapsite-additional-pins";
import {
  deleteAdditionalPinRecord,
  fixAdditionalPinRecord,
  fulfillAdditionalPinsFromStripeCheckoutSession,
  loadMapSitePinDashboard,
  mapsiteCannotSellAdditionalPins,
  placeAdditionalPinRecord,
  readMapSiteForPinPurchase,
  recordPendingPinPurchase,
  redeemFreePinCredits,
} from "@/lib/talispros/mapsite-additional-pins-service";
import {
  buildClaimedMapSitePath,
  toShareableAbsoluteUrl,
} from "@/lib/talispros/mapsite-state";

type PinActionError = { error: string };
type PinActionOk = {
  dashboard: MapSitePinDashboardState;
  error?: undefined;
};

function revalidateMapSite(fastCode: string) {
  const code = fastCode.trim().toLowerCase();
  revalidatePath("/talispros/mapsite", "layout");
  if (code) revalidatePath(`/mapsite/${code}`);
}

async function resolveAppOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  if (host) return `${protocol}://${host}`;
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
}

async function authorizePinEdit(fastCode: string): Promise<PinActionError | null> {
  try {
    await requireMapSiteEditAccess(fastCode);
    return null;
  } catch {
    return { error: "Only the Mapsite owner can buy or place PINs." };
  }
}

export type AdditionalPinCheckoutResult =
  /** Remaining PINs go through Stripe; `freeRedeemed` were already added free. */
  | { url: string; freeRedeemed: number; dashboard?: undefined; error?: undefined }
  /** Fully covered by admin-granted free credits — no Stripe. */
  | {
      dashboard: MapSitePinDashboardState;
      freeRedeemed: number;
      url?: undefined;
      error?: undefined;
    }
  | {
      error: string;
      url?: undefined;
      dashboard?: undefined;
      freeRedeemed?: undefined;
    };

export async function createAdditionalPinCheckout(input: {
  mapsiteId: string;
  fastCode: string;
  quantity: number;
  accountTypeSegment?: string | null;
}): Promise<AdditionalPinCheckoutResult> {
  const fastCode = input.fastCode.trim();
  const mapsiteId = input.mapsiteId.trim();
  const denied = await authorizePinEdit(fastCode);
  if (denied) return denied;

  const mapsite = await readMapSiteForPinPurchase(mapsiteId);
  if (!mapsite) return { error: "Mapsite was not found." };
  if (mapsite.fastCode.trim().toLowerCase() !== fastCode.toLowerCase()) {
    return { error: "FAST Code™ does not match this Mapsite." };
  }

  const blocked = mapsiteCannotSellAdditionalPins({
    mapsiteId: mapsite.id,
    fastCode: mapsite.fastCode,
    isDemonstration: mapsite.isDemonstration,
  });
  if (blocked) return { error: blocked };

  const quantityError = additionalPinCheckoutQuantityError(
    mapsite.pinQuota,
    input.quantity,
  );
  if (quantityError) return { error: quantityError };

  // Admin-granted free PIN credits cover PINs first; the rest is $7 CAD each.
  const split = splitFreeAndPaidPins(input.quantity, mapsite.freePinCredits);
  if (split.paid > 0 && !getStripeSecretKey()) {
    return { error: "Stripe is not configured. Set STRIPE_SECRET_KEY." };
  }

  if (split.free > 0) {
    const redeemed = await redeemFreePinCredits({
      mapsiteId: mapsite.id,
      quantity: split.free,
      email: mapsite.email || null,
      fastCode: mapsite.fastCode,
    });
    if (!redeemed.success) {
      return { error: redeemed.error || "Could not apply free PINs." };
    }
    revalidateMapSite(mapsite.fastCode);
  }

  if (split.paid === 0) {
    return {
      dashboard: await loadMapSitePinDashboard(mapsite.id),
      freeRedeemed: split.free,
    };
  }

  const paidQuantity = split.paid;
  const freeNote =
    split.free > 0
      ? ` ${split.free} free PIN${split.free === 1 ? "" : "s"} already added.`
      : "";

  const origin = await resolveAppOrigin();
  const returnPath = buildClaimedMapSitePath({
    fastCode: mapsite.fastCode,
    accountType: input.accountTypeSegment || mapsite.accountType,
  });
  const successUrl = new URL(toShareableAbsoluteUrl(returnPath, origin));
  successUrl.searchParams.set(PIN_CHECKOUT_QUERY, "success");
  const cancelUrl = new URL(toShareableAbsoluteUrl(returnPath, origin));
  cancelUrl.searchParams.set(PIN_CHECKOUT_QUERY, "cancelled");
  const successUrlTemplate = `${successUrl.toString()}&${PIN_CHECKOUT_SESSION_QUERY}={CHECKOUT_SESSION_ID}`;

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: mapsite.email || undefined,
      client_reference_id: mapsite.id,
      line_items: [
        {
          quantity: paidQuantity,
          price_data: {
            currency: MAPSITE_ADDITIONAL_PIN_CURRENCY,
            unit_amount: MAPSITE_ADDITIONAL_PIN_PRICE_CENTS,
            product_data: {
              name: "Talispros™ Mapsite additional PIN",
              description: "One additional map PIN on your Mapsite ($7 CAD).",
            },
          },
        },
      ],
      metadata: {
        purpose: ADDITIONAL_PINS_CHECKOUT_PURPOSE,
        mapSiteId: mapsite.id,
        fastCode: mapsite.fastCode,
        quantity: String(paidQuantity),
        freeQuantity: String(split.free),
        unitAmountCents: String(MAPSITE_ADDITIONAL_PIN_PRICE_CENTS),
      },
      success_url: successUrlTemplate,
      cancel_url: cancelUrl.toString(),
    });

    if (!session.url) {
      return { error: `Stripe Checkout did not return a URL.${freeNote}` };
    }

    await recordPendingPinPurchase({
      mapsiteId: mapsite.id,
      quantity: paidQuantity,
      stripeCheckoutSessionId: session.id,
      email: mapsite.email || null,
      fastCode: mapsite.fastCode,
    });

    return { url: session.url, freeRedeemed: split.free };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start Stripe Checkout.";
    console.error("[mapsite-pins] checkout session failed:", message);
    return { error: `${message}${freeNote}` };
  }
}

export async function confirmAdditionalPinCheckout(
  sessionId: string,
): Promise<{ dashboard?: MapSitePinDashboardState; alreadyProcessed?: boolean } | PinActionError> {
  const id = parsePinCheckoutSessionId(sessionId);
  if (!id) return { error: "Missing Checkout session." };
  if (!getStripeSecretKey()) {
    return { error: "Stripe is not configured. Set STRIPE_SECRET_KEY." };
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(id);
    const result = await fulfillAdditionalPinsFromStripeCheckoutSession(session);
    if (!result.success) return { error: result.error || "Could not unlock PINs." };
    if (result.ignored) return { error: "This Checkout session is not a PIN purchase." };
    const mapsiteId = session.metadata?.mapSiteId || session.client_reference_id || "";
    const dashboard = mapsiteId ? await loadMapSitePinDashboard(mapsiteId) : undefined;
    if (session.metadata?.fastCode) revalidateMapSite(session.metadata.fastCode);
    return { dashboard, alreadyProcessed: result.alreadyProcessed };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stripe Checkout lookup failed.";
    return { error: message };
  }
}

export async function placeMapSiteAdditionalPin(input: {
  mapsiteId: string;
  fastCode: string;
  latitude: number;
  longitude: number;
  label?: string | null;
}): Promise<PinActionOk | PinActionError> {
  const fastCode = input.fastCode.trim();
  const denied = await authorizePinEdit(fastCode);
  if (denied) return denied;

  const mapsite = await readMapSiteForPinPurchase(input.mapsiteId);
  if (!mapsite) return { error: "Mapsite was not found." };
  if (mapsite.fastCode.trim().toLowerCase() !== fastCode.toLowerCase()) {
    return { error: "FAST Code™ does not match this Mapsite." };
  }
  const blocked = mapsiteCannotSellAdditionalPins({
    mapsiteId: mapsite.id,
    fastCode: mapsite.fastCode,
    isDemonstration: mapsite.isDemonstration,
  });
  if (blocked) return { error: blocked };

  const placed = await placeAdditionalPinRecord({
    mapsiteId: mapsite.id,
    latitude: input.latitude,
    longitude: input.longitude,
    label: input.label,
  });
  if (placed.error || !placed.dashboard) {
    return { error: placed.error || "Could not place PIN." };
  }
  revalidateMapSite(fastCode);
  return { dashboard: placed.dashboard };
}

export async function fixMapSiteAdditionalPin(input: {
  mapsiteId: string;
  fastCode: string;
  pinId: string;
  latitude: number;
  longitude: number;
  label?: string | null;
}): Promise<PinActionOk | PinActionError> {
  const fastCode = input.fastCode.trim();
  const denied = await authorizePinEdit(fastCode);
  if (denied) return denied;

  const mapsite = await readMapSiteForPinPurchase(input.mapsiteId);
  if (!mapsite) return { error: "Mapsite was not found." };
  if (mapsite.fastCode.trim().toLowerCase() !== fastCode.toLowerCase()) {
    return { error: "FAST Code™ does not match this Mapsite." };
  }

  const fixed = await fixAdditionalPinRecord({
    mapsiteId: mapsite.id,
    pinId: input.pinId,
    latitude: input.latitude,
    longitude: input.longitude,
    label: input.label,
  });
  if (fixed.error || !fixed.dashboard) {
    return { error: fixed.error || "Could not update PIN." };
  }
  revalidateMapSite(fastCode);
  return { dashboard: fixed.dashboard };
}

export async function deleteMapSiteAdditionalPin(input: {
  mapsiteId: string;
  fastCode: string;
  pinId: string;
}): Promise<PinActionOk | PinActionError> {
  const fastCode = input.fastCode.trim();
  const denied = await authorizePinEdit(fastCode);
  if (denied) return denied;

  const mapsite = await readMapSiteForPinPurchase(input.mapsiteId);
  if (!mapsite) return { error: "Mapsite was not found." };
  if (mapsite.fastCode.trim().toLowerCase() !== fastCode.toLowerCase()) {
    return { error: "FAST Code™ does not match this Mapsite." };
  }

  const removed = await deleteAdditionalPinRecord({
    mapsiteId: mapsite.id,
    pinId: input.pinId,
  });
  if (removed.error || !removed.dashboard) {
    return { error: removed.error || "Could not delete PIN." };
  }
  revalidateMapSite(fastCode);
  return { dashboard: removed.dashboard };
}
