"use server";

import { headers } from "next/headers";
import type { RegistrationMarket } from "@/lib/registration-market";
import { parseRegistrationMarket } from "@/lib/registration-market";
import {
  planSummaryFor,
  planTypeForClaimAccountType,
  type PlanType,
} from "@/lib/registration-plans";
import { getStripeClient, getStripeSecretKey } from "@/lib/stripe";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  MAPSITE_ACTIVATION_CURRENCY,
  mapsiteActivationUnitAmountCents,
} from "@/lib/talispros/mapsite-activation-amount";
import { activateMapSiteAfterPayment } from "@/lib/talispros/mapsite-activation";
import {
  ACTIVATE_QUERY,
  CHECKOUT_QUERY,
  buildActivateMapSiteHref,
} from "@/lib/talispros/ebook-choice";
import {
  getDemonstrationMapSite,
  getMapSitePlatformByFastCode,
  getMapSitePlatformById,
  mergeMapSiteWithSubmittedLocation,
  type MapSitePlatformRecord,
} from "@/lib/talispros/mapsite-platform";
import {
  hasCompletedMapSitePaypalPayment,
} from "@/lib/talispros/mapsite-payment";
import { establishPaidMapSiteBrowserSession } from "@/lib/mapsite-edit-auth";
import {
  DEMO_MAPSITE_ID,
  toShareableAbsoluteUrl,
} from "@/lib/talispros/mapsite-state";

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

  if (!mapsite && requestId && isSupabaseAdminConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data: request } = await supabase
        .from("build_requests")
        .select("linked_mapsite_id")
        .eq("id", requestId)
        .maybeSingle();
      if (request?.linked_mapsite_id) {
        mapsite = await getMapSitePlatformById(request.linked_mapsite_id);
      }
    } catch (error) {
      console.warn("[mapsite] Could not load Mapsite™ from build request:", error);
    }
  }

  if (!mapsite) {
    mapsite = await getDemonstrationMapSite();
  }

  if (
    claimed &&
    mapsite.id === DEMO_MAPSITE_ID &&
    (mapsiteId || fastCode) &&
    mapsiteId !== DEMO_MAPSITE_ID
  ) {
    console.warn(
      "[mapsite] Claimed Mapsite™ fell back to the demonstration listing",
      { mapsiteId, fastCode, requestId },
    );
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

/**
 * Resolve PayPal plan from the Claim a Market build request
 * (e.g. root-1 → ROOT_ACCOUNT_1).
 */
export async function resolveMapSitePaymentPlanType(options?: {
  requestId?: string | null;
  mapsiteId?: string | null;
  fastCode?: string | null;
}): Promise<PlanType> {
  if (!isSupabaseAdminConfigured()) return "ROOT_ACCOUNT";

  try {
    const supabase = getSupabaseAdmin();
    const requestId = options?.requestId?.trim() || null;
    const mapsiteId = options?.mapsiteId?.trim() || null;
    const fastCode = options?.fastCode?.trim() || null;

    if (requestId) {
      const { data } = await supabase
        .from("build_requests")
        .select("requested_account_type, account_type")
        .eq("id", requestId)
        .maybeSingle();
      const accountType =
        data?.requested_account_type || data?.account_type || "";
      if (accountType) return planTypeForClaimAccountType(accountType);
    }

    if (fastCode) {
      const { data: codeRow } = await supabase
        .from("fast_codes")
        .select("request_id, account_type")
        .ilike("code", fastCode)
        .maybeSingle();
      if (codeRow?.account_type) {
        return planTypeForClaimAccountType(codeRow.account_type);
      }
      if (codeRow?.request_id) {
        const { data } = await supabase
          .from("build_requests")
          .select("requested_account_type, account_type")
          .eq("id", codeRow.request_id)
          .maybeSingle();
        const accountType =
          data?.requested_account_type || data?.account_type || "";
        if (accountType) return planTypeForClaimAccountType(accountType);
      }
    }

    if (mapsiteId) {
      const { data } = await supabase
        .from("build_requests")
        .select("requested_account_type, account_type")
        .eq("linked_mapsite_id", mapsiteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const accountType =
        data?.requested_account_type || data?.account_type || "";
      if (accountType) return planTypeForClaimAccountType(accountType);
    }
  } catch (error) {
    console.warn("[mapsite] resolveMapSitePaymentPlanType failed:", error);
  }

  return "ROOT_ACCOUNT";
}

/** Resolve build request id for a claimed FAST Code. */
export async function resolveMapSiteRequestId(options?: {
  requestId?: string | null;
  fastCode?: string | null;
  mapsiteId?: string | null;
}): Promise<string | null> {
  if (options?.requestId?.trim()) return options.requestId.trim();
  if (!isSupabaseAdminConfigured()) return null;

  try {
    const supabase = getSupabaseAdmin();
    const fastCode = options?.fastCode?.trim() || null;
    if (fastCode) {
      const { data } = await supabase
        .from("fast_codes")
        .select("request_id")
        .ilike("code", fastCode)
        .maybeSingle();
      if (data?.request_id) return data.request_id;
    }

    const mapsiteId = options?.mapsiteId?.trim() || null;
    if (mapsiteId) {
      const { data } = await supabase
        .from("build_requests")
        .select("id")
        .eq("linked_mapsite_id", mapsiteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.id) return data.id;
    }
  } catch (error) {
    console.warn("[mapsite] resolveMapSiteRequestId failed:", error);
  }

  return null;
}

export async function refreshMapSiteApplicationState(
  mapsiteId: string
): Promise<MapSitePlatformRecord | null> {
  const mapsite = await getMapSitePlatformById(mapsiteId);
  if (!mapsite) return null;
  return mergeMapSiteWithSubmittedLocation(mapsite);
}

export async function getMapSiteActivationPaymentStatus(options: {
  mapsiteId?: string | null;
  fastCode?: string | null;
  requestId?: string | null;
  stripeCheckoutSessionId?: string | null;
}): Promise<{ paid: boolean }> {
  const paid = await hasCompletedMapSitePaypalPayment({
    ...options,
    reconcileFromStripe: Boolean(options.stripeCheckoutSessionId),
  });

  if (paid && options.fastCode) {
    await establishPaidMapSiteBrowserSession(options.fastCode);
  }

  return { paid };
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

/**
 * Create a Stripe Checkout Session for Mapsite™ activation.
 * Amount and plan are resolved server-side — never from the browser.
 */
export async function createMapSiteStripeCheckoutSession(input: {
  mapsiteId: string;
  requestId?: string | null;
  audience?: string | null;
  fastCode?: string | null;
}): Promise<{ url?: string; error?: string }> {
  const mapsiteId = input.mapsiteId.trim();
  if (!mapsiteId) {
    return { error: "Missing Mapsite™ id." };
  }
  if (!getStripeSecretKey()) {
    return { error: "Stripe is not configured." };
  }
  if (!isSupabaseAdminConfigured()) {
    return { error: "Payment services are not configured." };
  }

  const supabase = getSupabaseAdmin();
  const { data: mapsite } = await supabase
    .from("mapsites")
    .select("id, fast_code, email, account_id")
    .eq("id", mapsiteId)
    .maybeSingle();

  if (!mapsite?.id) {
    return { error: "Mapsite™ was not found." };
  }

  let requestId = input.requestId?.trim() || null;
  if (!requestId) {
    const { data: linked } = await supabase
      .from("build_requests")
      .select("id")
      .eq("linked_mapsite_id", mapsiteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    requestId = linked?.id || null;
  }

  if (requestId) {
    const { data: request } = await supabase
      .from("build_requests")
      .select("id, email, linked_mapsite_id")
      .eq("id", requestId)
      .maybeSingle();
    if (!request) {
      return { error: "Claim request not found." };
    }
    if (request.linked_mapsite_id && request.linked_mapsite_id !== mapsiteId) {
      return { error: "Claim request does not match this Mapsite™." };
    }
  }

  let email = "";
  if (requestId) {
    const { data } = await supabase
      .from("build_requests")
      .select("email")
      .eq("id", requestId)
      .maybeSingle();
    email = data?.email?.trim() || "";
  }
  if (!email) {
    email = mapsite.email?.trim() || "";
  }

  if (!email || !requestId) {
    return {
      error:
        "Complete Claim a Market first, then return here to activate your Mapsite™.",
    };
  }

  const planType: PlanType = await resolveMapSitePaymentPlanType({
    requestId,
    mapsiteId,
    fastCode: input.fastCode || mapsite.fast_code,
  });
  const summary = planSummaryFor(planType);
  const unitAmount = mapsiteActivationUnitAmountCents(planType);
  const fastCode = (input.fastCode || mapsite.fast_code || "").trim();
  const audience = parseRegistrationMarket(input.audience) || input.audience || "";

  const origin = await resolveAppOrigin();
  const returnPath = buildActivateMapSiteHref({
    fastCode,
    mapsiteId,
    accountType: audience,
    requestId,
  });
  const successUrl = new URL(toShareableAbsoluteUrl(returnPath, origin));
  successUrl.searchParams.set(CHECKOUT_QUERY, "success");
  successUrl.searchParams.set(ACTIVATE_QUERY, "1");
  const cancelUrl = new URL(toShareableAbsoluteUrl(returnPath, origin));
  cancelUrl.searchParams.set(CHECKOUT_QUERY, "cancelled");
  cancelUrl.searchParams.set(ACTIVATE_QUERY, "1");

  const successUrlTemplate = `${successUrl.toString()}&session_id={CHECKOUT_SESSION_ID}`;

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      client_reference_id: mapsiteId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: MAPSITE_ACTIVATION_CURRENCY,
            unit_amount: unitAmount,
            product_data: {
              name: `Talispros™ ${summary.planLabel} — Mapsite™ activation`,
              description: `${summary.priceLabel} + ${summary.taxLabel}`,
            },
          },
        },
      ],
      metadata: {
        mapSiteId: mapsiteId,
        requestId,
        fastCode,
        audience: String(audience || ""),
        planType,
        ...(mapsite.account_id ? { accountId: mapsite.account_id } : {}),
      },
      success_url: successUrlTemplate,
      cancel_url: cancelUrl.toString(),
    });

    if (!session.url) {
      return { error: "Stripe Checkout did not return a URL." };
    }

    const { error: pendingError } = await supabase.from("talispros_payments").insert({
      email: email.toLowerCase(),
      plan_type: planType,
      payment_provider: "stripe",
      stripe_checkout_session_id: session.id,
      payment_status: "pending",
      mapsite_id: mapsiteId,
      request_id: requestId,
      fast_code: fastCode || null,
    });
    if (pendingError && !/duplicate|unique/i.test(pendingError.message)) {
      console.warn(
        "[mapsite-stripe] Could not record pending checkout:",
        pendingError.message,
      );
    }

    return { url: session.url };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start Stripe Checkout.";
    console.error("[mapsite-stripe] checkout session failed:", message);
    return { error: message };
  }
}

/** Historical PayPal capture path — delegates to the shared activation service. */
export async function processMapSiteRootPaypalPayment(input: {
  mapsiteId: string;
  requestId?: string | null;
  audience: RegistrationMarket;
  planType?: PlanType;
  paypalOrderId: string;
  paypalCaptureId: string;
}): Promise<{
  success: boolean;
  redirectUrl?: string;
  fastCode?: string;
  error?: string;
}> {
  return activateMapSiteAfterPayment({
    mapsiteId: input.mapsiteId,
    requestId: input.requestId,
    audience: input.audience,
    planType: input.planType,
    paypalOrderId: input.paypalOrderId,
    paypalCaptureId: input.paypalCaptureId,
  });
}
