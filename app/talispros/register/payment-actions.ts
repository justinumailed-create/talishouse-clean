"use server";

import { finalizeRegistrationClientAccess } from "@/lib/client-analytics-auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateFastCode } from "@/lib/fast-code-generator";
import { createMapSite } from "@/lib/mapsite";
import { completeRootAccountRegistration } from "@/lib/root-account-registration-service";

export interface ProcessPaymentInput {
  email: string;
  firstName: string;
  lastName: string;
  planType: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  buildRequestId?: string;
}

export interface ProcessPaymentResult {
  success: boolean;
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

    const { error: paymentError } = await supabaseAdmin
      .from("talispros_payments")
      .insert({
        email: input.email.trim().toLowerCase(),
        plan_type: input.planType,
        paypal_order_id: input.paypalOrderId || null,
        paypal_capture_id: input.paypalCaptureId || null,
        payment_status: "completed",
      });

    if (paymentError) {
      throw new Error(`Payment record failed: ${paymentError.message}`);
    }

    if (
      (input.planType === "ROOT_ACCOUNT" || input.planType === "TEST_ACCOUNT") &&
      !input.buildRequestId
    ) {
      const registration = await completeRootAccountRegistration({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
      });

      const { redirectUrl } = await finalizeRegistrationClientAccess(
        input.email,
        registration.fastCode
      );

      return {
        success: true,
        transactionId: input.paypalCaptureId || input.paypalOrderId,
        redirectUrl,
        mapsiteId: registration.mapsiteId,
        fastCode: registration.fastCode,
      };
    }

    let fastCode = "";
    let buildRequestPlan =
      input.planType === "TEST_ACCOUNT" ? "ROOT_ACCOUNT" : input.planType;
    if (input.buildRequestId) {
      const { data: buildRequest } = await supabaseAdmin
        .from("build_requests")
        .select("id, requested_fast_code, requested_account_type")
        .eq("id", input.buildRequestId)
        .single();
      if (buildRequest?.requested_fast_code) {
        fastCode = buildRequest.requested_fast_code;
      }
      if (buildRequest?.requested_account_type) {
        buildRequestPlan = buildRequest.requested_account_type;
      }
      await supabaseAdmin
        .from("build_requests")
        .update({ status: "Registered" })
        .eq("id", input.buildRequestId);
    }

    if (!fastCode) {
      const { data: existingCodes } = await supabaseAdmin.from("fast_codes").select("code");
      fastCode = generateFastCode((existingCodes || []).map((r) => r.code));
    }

    const mapsite = await createMapSite({
      fastCode,
      accountType: buildRequestPlan,
      ownerFirstName: input.firstName,
      ownerLastName: input.lastName,
      email: input.email,
    });

    const { error: fcError } = await supabaseAdmin.from("fast_codes").insert({
      code: fastCode,
      type: "mapsite",
      account_type: buildRequestPlan,
      mapsite_id: mapsite.id,
    });
    if (input.buildRequestId) {
      await supabaseAdmin
        .from("build_request_registrations")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("build_request_id", input.buildRequestId);
      await supabaseAdmin
        .from("build_requests")
        .update({
          status: "MapSite Active",
          activated_at: new Date().toISOString(),
          linked_mapsite_id: mapsite.id,
          requested_fast_code: fastCode,
        })
        .eq("id", input.buildRequestId);
    }


    if (fcError) {
      throw new Error(`FAST Code record failed: ${fcError.message}`);
    }

    const { redirectUrl } = await finalizeRegistrationClientAccess(
      input.email,
      fastCode
    );

    return {
      success: true,
      transactionId: input.paypalCaptureId || input.paypalOrderId,
      redirectUrl,
      mapsiteId: mapsite.id,
      fastCode,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown server error";
    console.error("[talispros-payment] Error:", err);
    return { success: false, error: msg };
  }
}
