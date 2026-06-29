"use server";

import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateFastCode } from "@/lib/fast-code-generator";
import { createMapSite } from "@/lib/mapsite";
import { completeRootAccountRegistration } from "@/lib/root-account-registration-service";
import {
  MAPSITE_ROOT_ACCOUNT_COOKIE,
  MAPSITE_ROOT_ACCOUNT_MAX_AGE,
} from "@/lib/mapsite-account-session";

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
  mapsiteId?: string;
  fastCode?: string;
  error?: string;
}

async function setSubscriberSession(fastCode: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(MAPSITE_ROOT_ACCOUNT_COOKIE, fastCode.toLowerCase(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAPSITE_ROOT_ACCOUNT_MAX_AGE,
  });
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

    if (input.planType === "ROOT_ACCOUNT") {
      const registration = await completeRootAccountRegistration({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
      });

      await setSubscriberSession(registration.fastCode);

      return {
        success: true,
        transactionId: input.paypalCaptureId || input.paypalOrderId,
        redirectUrl: registration.redirectUrl,
        mapsiteId: registration.mapsiteId,
        fastCode: registration.fastCode,
      };
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

    await setSubscriberSession(fastCode);

    return {
      success: true,
      transactionId: input.paypalCaptureId || input.paypalOrderId,
      redirectUrl: `/talispros/mapsites/${fastCode.toLowerCase()}`,
      mapsiteId: mapsite.id,
      fastCode,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown server error";
    console.error("[talispros-payment] Error:", err);
    return { success: false, error: msg };
  }
}
