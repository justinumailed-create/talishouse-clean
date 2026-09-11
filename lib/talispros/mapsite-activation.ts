import { processPayment } from "@/app/talispros/register/payment-actions";
import type { RegistrationMarket } from "@/lib/registration-market";
import {
  isPlanType,
  planTypeForClaimAccountType,
  type PlanType,
} from "@/lib/registration-plans";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { postMapSitePaymentRedirectHref } from "@/lib/talispros/register-agents";

export type MapSitePaymentProvider = "paypal" | "stripe";

export interface ActivateMapSiteAfterPaymentInput {
  mapsiteId: string;
  requestId?: string | null;
  audience?: RegistrationMarket | string | null;
  planType?: PlanType | string | null;
  paypalOrderId?: string | null;
  paypalCaptureId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  fastCode?: string | null;
}

export interface ActivateMapSiteAfterPaymentResult {
  success: boolean;
  alreadyProcessed?: boolean;
  redirectUrl?: string;
  fastCode?: string;
  mapsiteId?: string;
  error?: string;
}

/**
 * Authoritative Mapsite™ activation after a successful payment.
 * PayPal capture and Stripe webhooks both call this — do not duplicate.
 */
export async function activateMapSiteAfterPayment(
  input: ActivateMapSiteAfterPaymentInput
): Promise<ActivateMapSiteAfterPaymentResult> {
  const mapsiteId = input.mapsiteId.trim();
  const requestId = input.requestId?.trim() || null;
  const stripeCheckoutSessionId = input.stripeCheckoutSessionId?.trim() || null;
  const stripePaymentIntentId = input.stripePaymentIntentId?.trim() || null;
  const paypalOrderId = input.paypalOrderId?.trim() || null;
  const paypalCaptureId = input.paypalCaptureId?.trim() || null;

  if (!mapsiteId) {
    return { success: false, error: "Missing Mapsite™ id." };
  }
  if (!paypalOrderId && !stripeCheckoutSessionId) {
    return { success: false, error: "Missing payment identifier." };
  }

  try {
    const supabase = getSupabaseAdmin();

    if (stripeCheckoutSessionId) {
      const { data: existing } = await supabase
        .from("talispros_payments")
        .select("id, payment_status")
        .eq("stripe_checkout_session_id", stripeCheckoutSessionId)
        .ilike("payment_status", "completed")
        .maybeSingle();

      if (existing?.id) {
        const ensured = await ensureMapSiteActiveAfterPayment({
          mapsiteId,
          requestId,
          audience: input.audience,
        });
        return {
          success: true,
          alreadyProcessed: true,
          ...ensured,
        };
      }
    }

    let firstName = "Mapsite™";
    let lastName = "Owner";
    let email = "";
    let resolvedRequestId = requestId;
    let accountTypeFromRequest = "";

    if (!resolvedRequestId) {
      const { data: linkedRequest } = await supabase
        .from("build_requests")
        .select(
          "id, first_name, last_name, email, linked_mapsite_id, requested_account_type, account_type"
        )
        .eq("linked_mapsite_id", mapsiteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (linkedRequest?.id) {
        resolvedRequestId = linkedRequest.id;
        firstName = linkedRequest.first_name?.trim() || firstName;
        lastName = linkedRequest.last_name?.trim() || lastName;
        email = linkedRequest.email?.trim() || email;
        accountTypeFromRequest =
          linkedRequest.requested_account_type ||
          linkedRequest.account_type ||
          "";
      }
    }

    if (resolvedRequestId) {
      const { data: request } = await supabase
        .from("build_requests")
        .select(
          "id, first_name, last_name, email, linked_mapsite_id, requested_account_type, account_type"
        )
        .eq("id", resolvedRequestId)
        .maybeSingle();

      if (!request) {
        return { success: false, error: "Claim request not found." };
      }

      firstName = request.first_name?.trim() || firstName;
      lastName = request.last_name?.trim() || lastName;
      email = request.email?.trim() || email;
      accountTypeFromRequest =
        request.requested_account_type || request.account_type || "";

      if (request.linked_mapsite_id && request.linked_mapsite_id !== mapsiteId) {
        return { success: false, error: "Claim request does not match this Mapsite™." };
      }

      if (!request.linked_mapsite_id) {
        await supabase
          .from("build_requests")
          .update({
            linked_mapsite_id: mapsiteId,
            requested_account_type:
              request.requested_account_type ||
              accountTypeFromRequest ||
              "root",
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
          "Complete Claim a Market first, then return here to complete activation payment.",
      };
    }

    const planType: PlanType = isPlanType(input.planType)
      ? input.planType
      : accountTypeFromRequest
        ? planTypeForClaimAccountType(accountTypeFromRequest)
        : "ROOT_ACCOUNT";

    const paymentProvider: MapSitePaymentProvider = stripeCheckoutSessionId
      ? "stripe"
      : "paypal";

    const result = await processPayment({
      email,
      firstName,
      lastName,
      planType,
      paypalOrderId: paypalOrderId || undefined,
      paypalCaptureId: paypalCaptureId || undefined,
      stripeCheckoutSessionId: stripeCheckoutSessionId || undefined,
      stripePaymentIntentId: stripePaymentIntentId || undefined,
      paymentProvider,
      buildRequestId: resolvedRequestId,
      mapsiteId,
      fastCode: input.fastCode,
    });

    if (!result.success) {
      return { success: false, error: result.error || "Payment failed." };
    }

    const ensured = await ensureMapSiteActiveAfterPayment({
      mapsiteId: result.mapsiteId || mapsiteId,
      requestId: resolvedRequestId,
      audience: input.audience,
      accountType: accountTypeFromRequest,
      fastCode: result.fastCode,
    });

    return {
      success: true,
      alreadyProcessed: result.alreadyProcessed,
      fastCode: result.fastCode || ensured.fastCode,
      mapsiteId: ensured.mapsiteId,
      redirectUrl: ensured.redirectUrl,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown payment error";
    console.error("[mapsite-activation] Error:", error);
    return { success: false, error: message };
  }
}

async function ensureMapSiteActiveAfterPayment(options: {
  mapsiteId: string;
  requestId?: string | null;
  audience?: string | null;
  accountType?: string | null;
  fastCode?: string | null;
}): Promise<{
  redirectUrl: string;
  fastCode?: string;
  mapsiteId: string;
}> {
  const supabase = getSupabaseAdmin();
  const mapsiteId = options.mapsiteId;
  const requestId = options.requestId?.trim() || null;

  let fastCode = options.fastCode?.trim() || null;
  if (!fastCode) {
    const { data: mapsite } = await supabase
      .from("mapsites")
      .select("fast_code")
      .eq("id", mapsiteId)
      .maybeSingle();
    fastCode = mapsite?.fast_code?.trim() || null;
  }

  await supabase
    .from("mapsites")
    .update({
      status: "active",
      interest_form_enabled: true,
      ...(fastCode ? { fast_code: fastCode } : {}),
    })
    .eq("id", mapsiteId);

  if (requestId) {
    await supabase
      .from("build_requests")
      .update({
        status: "Mapsite™ Active",
        approval_status: "Approved",
        activated_at: new Date().toISOString(),
        linked_mapsite_id: mapsiteId,
      })
      .eq("id", requestId);
  }

  const { data: request } = requestId
    ? await supabase
        .from("build_requests")
        .select("requested_account_type, account_type")
        .eq("id", requestId)
        .maybeSingle()
    : { data: null };

  const accountType =
    options.accountType ||
    request?.requested_account_type ||
    request?.account_type ||
    "";

  const redirectUrl = postMapSitePaymentRedirectHref({
    fastCode,
    mapsiteId,
    audience: options.audience,
    accountType,
    requestId,
  });

  return {
    redirectUrl,
    fastCode: fastCode || undefined,
    mapsiteId,
  };
}
