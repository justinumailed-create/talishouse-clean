"use server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateFastCode } from "@/lib/fast-code-generator";
import { createMapSite } from "@/lib/mapsite";

export interface ProcessPaymentInput {
  email: string;
  firstName: string;
  lastName: string;
  planType: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
}

export interface ProcessPaymentResult {
  success: boolean;
  transactionId?: string;
  redirectUrl?: string;
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

    const { data: existingCodes } = await supabaseAdmin
      .from("fast_codes")
      .select("code");

    const fastCode = generateFastCode(
      (existingCodes || []).map((r) => r.code)
    );

    const mapsite = await createMapSite({
      fastCode,
      accountType: input.planType,
      ownerFirstName: input.firstName,
      ownerLastName: input.lastName,
      email: input.email,
    });

    const { error: fcError } = await supabaseAdmin.from("fast_codes").insert({
      code: fastCode,
      type: "mapsite",
      account_type: input.planType,
      mapsite_id: mapsite.id,
    });

    if (fcError) {
      throw new Error(`FAST Code record failed: ${fcError.message}`);
    }

    return {
      success: true,
      transactionId: input.paypalCaptureId || input.paypalOrderId,
      redirectUrl: `/ma/${fastCode}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown server error";
    console.error("[talispros-payment] Error:", err);
    return { success: false, error: msg };
  }
}
