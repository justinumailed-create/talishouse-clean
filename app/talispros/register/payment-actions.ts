"use server";

import { createRootAccount } from "@/lib/account-service";
import { finalizeRegistrationClientAccess } from "@/lib/client-analytics-auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateFastCode } from "@/lib/fast-code-generator";
import { createMapSite } from "@/lib/mapsite";
import { completeRootAccountRegistration } from "@/lib/root-account-registration-service";
import {
  isRootLikeClaimAccountType,
  isRootPlanType,
} from "@/lib/registration-plans";
import { createUser, updateUserFastCode } from "@/lib/user-service";

export interface ProcessPaymentInput {
  email: string;
  firstName: string;
  lastName: string;
  planType: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  paymentProvider?: "paypal" | "stripe";
  buildRequestId?: string;
  mapsiteId?: string | null;
  fastCode?: string | null;
}

export interface ProcessPaymentResult {
  success: boolean;
  alreadyProcessed?: boolean;
  transactionId?: string;
  redirectUrl?: string;
  mapsiteId?: string;
  fastCode?: string;
  error?: string;
}

export async function processPayment(
  input: ProcessPaymentInput
): Promise<ProcessPaymentResult> {
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return { success: false, error: "Valid email is required" };
  }
  if (!input.planType) {
    return { success: false, error: "Plan type is required" };
  }
  if (!input.firstName.trim()) {
    return { success: false, error: "First name is required" };
  }
  if (!input.lastName.trim()) {
    return { success: false, error: "Last name is required" };
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const stripeCheckoutSessionId = input.stripeCheckoutSessionId?.trim() || null;
    const stripePaymentIntentId = input.stripePaymentIntentId?.trim() || null;
    const paymentProvider =
      input.paymentProvider ||
      (stripeCheckoutSessionId ? "stripe" : "paypal");
    const linkedMapsiteId = input.mapsiteId?.trim() || null;
    const linkedFastCode = input.fastCode?.trim() || null;

    if (stripeCheckoutSessionId) {
      const { data: existingStripe } = await supabaseAdmin
        .from("talispros_payments")
        .select("id, payment_status, mapsite_id, fast_code")
        .eq("stripe_checkout_session_id", stripeCheckoutSessionId)
        .maybeSingle();
      const existingStatus = existingStripe?.payment_status?.trim().toLowerCase();
      if (
        existingStripe?.id &&
        (existingStatus === "completed" ||
          existingStatus === "paid" ||
          existingStatus === "complete" ||
          existingStatus === "succeeded")
      ) {
        let mapsiteId: string | undefined = existingStripe.mapsite_id || linkedMapsiteId || undefined;
        let fastCode: string | undefined = existingStripe.fast_code || linkedFastCode || undefined;
        if (input.buildRequestId && (!mapsiteId || !fastCode)) {
          const { data: buildRequest } = await supabaseAdmin
            .from("build_requests")
            .select("linked_mapsite_id, requested_fast_code")
            .eq("id", input.buildRequestId)
            .maybeSingle();
          mapsiteId = mapsiteId || buildRequest?.linked_mapsite_id || undefined;
          fastCode = fastCode || buildRequest?.requested_fast_code || undefined;
        }
        return {
          success: true,
          alreadyProcessed: true,
          transactionId: stripePaymentIntentId || stripeCheckoutSessionId,
          mapsiteId,
          fastCode,
        };
      }

      if (existingStripe?.id) {
        await supabaseAdmin
          .from("talispros_payments")
          .update({
            email: input.email.trim().toLowerCase(),
            plan_type: input.planType,
            payment_provider: paymentProvider,
            stripe_payment_intent_id: stripePaymentIntentId,
            payment_status: "completed",
            ...(linkedMapsiteId ? { mapsite_id: linkedMapsiteId } : {}),
            ...(input.buildRequestId ? { request_id: input.buildRequestId } : {}),
            ...(linkedFastCode ? { fast_code: linkedFastCode } : {}),
          })
          .eq("id", existingStripe.id);
      } else {
        const { error: paymentError } = await supabaseAdmin
          .from("talispros_payments")
          .insert(paymentRow({
            email: input.email,
            planType: input.planType,
            paypalOrderId: input.paypalOrderId,
            paypalCaptureId: input.paypalCaptureId,
            paymentProvider,
            stripeCheckoutSessionId,
            stripePaymentIntentId,
            mapsiteId: linkedMapsiteId,
            requestId: input.buildRequestId,
            fastCode: linkedFastCode,
          }));

        if (paymentError) {
          if (/duplicate|unique/i.test(paymentError.message)) {
            return {
              success: true,
              alreadyProcessed: true,
              transactionId: stripePaymentIntentId || stripeCheckoutSessionId,
              mapsiteId: linkedMapsiteId || undefined,
              fastCode: linkedFastCode || undefined,
            };
          }
          throw new Error(`Payment record failed: ${paymentError.message}`);
        }
      }
    } else {
      const { error: paymentError } = await supabaseAdmin
        .from("talispros_payments")
        .insert(paymentRow({
          email: input.email,
          planType: input.planType,
          paypalOrderId: input.paypalOrderId,
          paypalCaptureId: input.paypalCaptureId,
          paymentProvider,
          stripeCheckoutSessionId,
          stripePaymentIntentId,
          mapsiteId: linkedMapsiteId,
          requestId: input.buildRequestId,
          fastCode: linkedFastCode,
        }));

      if (paymentError) {
        throw new Error(`Payment record failed: ${paymentError.message}`);
      }
    }

    if (isRootPlanType(input.planType) && !input.buildRequestId) {
      const registration = await completeRootAccountRegistration({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
      });

      const { redirectUrl } = await establishClientSessionAfterPayment(
        input.email,
        registration.fastCode,
      );

      await linkPaymentRecordToMapSite({
        stripeCheckoutSessionId,
        paypalOrderId: input.paypalOrderId,
        mapsiteId: registration.mapsiteId,
        requestId: input.buildRequestId,
        fastCode: registration.fastCode,
      });

      return {
        success: true,
        transactionId:
          stripePaymentIntentId ||
          stripeCheckoutSessionId ||
          input.paypalCaptureId ||
          input.paypalOrderId,
        redirectUrl,
        mapsiteId: registration.mapsiteId,
        fastCode: registration.fastCode,
      };
    }

    let fastCode = "";
    let accountTypeLabel = "root";
    let linkedMapSiteId: string | null = null;
    if (input.buildRequestId) {
      const { data: buildRequest } = await supabaseAdmin
        .from("build_requests")
        .select("id, requested_fast_code, requested_account_type, linked_mapsite_id")
        .eq("id", input.buildRequestId)
        .single();
      if (buildRequest?.requested_fast_code) {
        fastCode = buildRequest.requested_fast_code;
      }
      if (buildRequest?.requested_account_type) {
        accountTypeLabel = buildRequest.requested_account_type;
      } else if (isRootPlanType(input.planType)) {
        accountTypeLabel =
          input.planType === "ROOT_ACCOUNT_1" ? "root-1" : "root";
      }
      linkedMapSiteId = buildRequest?.linked_mapsite_id ?? null;
    }

    if (!fastCode) {
      const { data: existingCodes } = await supabaseAdmin.from("fast_codes").select("code");
      fastCode = generateFastCode((existingCodes || []).map((r) => r.code));
    }

    const rootLike = isRootLikeClaimAccountType(accountTypeLabel) || isRootPlanType(input.planType);
    const mapsiteAccountType =
      input.planType === "TEST_ACCOUNT"
        ? "TEST Account"
        : input.planType === "ROOT_ACCOUNT_1"
          ? "root-1"
          : rootLike
            ? "root"
            : accountTypeLabel;

    const mapsite = linkedMapSiteId
      ? {
          id: linkedMapSiteId,
          fastCode,
        }
      : await createMapSite({
          fastCode,
          accountType: mapsiteAccountType,
          ownerFirstName: input.firstName,
          ownerLastName: input.lastName,
          email: input.email,
        });

    const user = await createUser({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      role: rootLike ? "root" : "user",
    });

    const account = await createRootAccount({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      userId: user.id,
      fastCode,
    });
    await updateUserFastCode(user.id, account.fastCode);

    await supabaseAdmin
      .from("mapsites")
      .update({
        fast_code: account.fastCode,
        account_id: account.id,
        account_type: mapsiteAccountType,
        owner_first_name: input.firstName,
        owner_last_name: input.lastName,
        email: input.email,
        status: "active",
        interest_form_enabled: true,
      })
      .eq("id", mapsite.id);

    const { error: fcError } = await supabaseAdmin.from("fast_codes").upsert(
      {
        code: account.fastCode,
        type: "mapsite",
        account_type: accountTypeLabel,
        mapsite_id: mapsite.id,
        request_id: input.buildRequestId ?? null,
      },
      { onConflict: "code" }
    );
    if (fcError) {
      throw new Error(`FAST Code record failed: ${fcError.message}`);
    }

    if (input.buildRequestId) {
      await supabaseAdmin
        .from("build_request_registrations")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("build_request_id", input.buildRequestId);
      await supabaseAdmin
        .from("build_requests")
        .update({
          status: "Registered",
          activated_at: new Date().toISOString(),
          linked_mapsite_id: mapsite.id,
          linked_account_id: account.id,
          requested_fast_code: account.fastCode,
        })
        .eq("id", input.buildRequestId);
    }

    await linkPaymentRecordToMapSite({
      stripeCheckoutSessionId,
      paypalOrderId: input.paypalOrderId,
      mapsiteId: mapsite.id,
      requestId: input.buildRequestId,
      fastCode: account.fastCode,
    });

    const { redirectUrl } = await establishClientSessionAfterPayment(
      input.email,
      account.fastCode,
    );

    return {
      success: true,
      transactionId:
        stripePaymentIntentId ||
        stripeCheckoutSessionId ||
        input.paypalCaptureId ||
        input.paypalOrderId,
      redirectUrl,
      mapsiteId: mapsite.id,
      fastCode: account.fastCode,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown server error";
    console.error("[talispros-payment] Error:", err);
    return { success: false, error: msg };
  }
}

function paymentRow(input: {
  email: string;
  planType: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  paymentProvider: "paypal" | "stripe";
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  mapsiteId?: string | null;
  requestId?: string | null;
  fastCode?: string | null;
}) {
  return {
    email: input.email.trim().toLowerCase(),
    plan_type: input.planType,
    paypal_order_id: input.paypalOrderId || null,
    paypal_capture_id: input.paypalCaptureId || null,
    payment_provider: input.paymentProvider,
    stripe_checkout_session_id: input.stripeCheckoutSessionId,
    stripe_payment_intent_id: input.stripePaymentIntentId,
    payment_status: "completed",
    ...(input.mapsiteId ? { mapsite_id: input.mapsiteId } : {}),
    ...(input.requestId ? { request_id: input.requestId } : {}),
    ...(input.fastCode ? { fast_code: input.fastCode } : {}),
  };
}

async function linkPaymentRecordToMapSite(options: {
  stripeCheckoutSessionId: string | null;
  paypalOrderId?: string;
  mapsiteId: string;
  requestId?: string | null;
  fastCode?: string | null;
}): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const patch = {
      mapsite_id: options.mapsiteId,
      ...(options.requestId ? { request_id: options.requestId } : {}),
      ...(options.fastCode ? { fast_code: options.fastCode } : {}),
    };
    if (options.stripeCheckoutSessionId) {
      await supabase
        .from("talispros_payments")
        .update(patch)
        .eq("stripe_checkout_session_id", options.stripeCheckoutSessionId);
      return;
    }
    if (options.paypalOrderId) {
      await supabase
        .from("talispros_payments")
        .update(patch)
        .eq("paypal_order_id", options.paypalOrderId);
    }
  } catch (error) {
    console.warn("[talispros-payment] Could not link payment to Mapsite™:", error);
  }
}

async function establishClientSessionAfterPayment(
  email: string,
  fastCode: string,
): Promise<{ redirectUrl: string; sessionEstablished: boolean }> {
  try {
    return await finalizeRegistrationClientAccess(email, fastCode);
  } catch (error) {
    console.warn(
      "[talispros-payment] Client session cookie could not be set (expected on Stripe webhooks):",
      error,
    );
    return { redirectUrl: "/talispros/client/dashboard", sessionEstablished: false };
  }
}
