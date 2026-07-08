"use server";

import { createRootAccount } from "@/lib/account-service";
import { finalizeRegistrationClientAccess } from "@/lib/client-analytics-auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateFastCode } from "@/lib/fast-code-generator";
import { createMapSite } from "@/lib/mapsite";
import { completeRootAccountRegistration } from "@/lib/root-account-registration-service";
import { createUser, updateUserFastCode } from "@/lib/user-service";

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
    let accountTypeLabel = "root";
    let linkedMapsiteId: string | null = null;
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
      } else if (input.planType === "TEST_ACCOUNT" || input.planType === "ROOT_ACCOUNT") {
        accountTypeLabel = "root";
      }
      linkedMapsiteId = buildRequest?.linked_mapsite_id ?? null;
    }

    if (!fastCode) {
      const { data: existingCodes } = await supabaseAdmin.from("fast_codes").select("code");
      fastCode = generateFastCode((existingCodes || []).map((r) => r.code));
    }

    const mapsite = linkedMapsiteId
      ? {
          id: linkedMapsiteId,
          fastCode,
        }
      : await createMapSite({
          fastCode,
          accountType: accountTypeLabel,
          ownerFirstName: input.firstName,
          ownerLastName: input.lastName,
          email: input.email,
        });

    const user = await createUser({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      role: accountTypeLabel === "root" || input.planType === "TEST_ACCOUNT" ? "root" : "user",
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
        account_type:
          input.planType === "TEST_ACCOUNT" ? "TEST Account" : accountTypeLabel,
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

    const { redirectUrl } = await finalizeRegistrationClientAccess(
      input.email,
      account.fastCode
    );

    return {
      success: true,
      transactionId: input.paypalCaptureId || input.paypalOrderId,
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
