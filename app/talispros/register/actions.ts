"use server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateFastCode } from "@/lib/fast-code-generator";
import { createMapSite } from "@/lib/mapsite";
import { generateRegistrationNumber } from "@/lib/registration-number";

export interface RegisterTalisprosInput {
  fastCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  accountType: string;
  amountPaid?: number;
  monthlySubscription?: number;
  paypalOrderId?: string;
  paypalCaptureId?: string;
}

export interface RegisterTalisprosResult {
  success: boolean;
  mapsite?: {
    id: string;
    fastCode: string;
    slug: string;
    url: string;
  };
  error?: string;
}

function validate(input: RegisterTalisprosInput): string | null {
  if (!input.firstName.trim()) return "First name is required";
  if (!input.lastName.trim()) return "Last name is required";
  if (!input.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()))
    return "Valid email is required";
  if (!input.accountType) return "Account type is required";
  if (input.amountPaid && input.amountPaid <= 0) return "Invalid payment amount";
  return null;
}

export async function registerTalispros(
  input: RegisterTalisprosInput
): Promise<RegisterTalisprosResult> {
  const validationError = validate(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    let fastCode = input.fastCode.trim().toUpperCase();

    if (fastCode && fastCode !== "DEFAULT") {
      const { data: dup } = await supabaseAdmin
        .from("fast_codes")
        .select("code")
        .eq("code", fastCode)
        .eq("type", "mapsite")
        .maybeSingle();
      if (dup) {
        return { success: false, error: `FAST Code "${fastCode}" is already taken.` };
      }

      const { error: fcError } = await supabaseAdmin.from("fast_codes").insert({
        code: fastCode,
        type: "mapsite",
        status: "active",
      });
      if (fcError) {
        return { success: false, error: `Failed to create FAST Code: ${fcError.message}` };
      }
    } else {
      const { data: existing } = await supabaseAdmin
        .from("fast_codes")
        .select("code");
      fastCode = generateFastCode((existing || []).map((r) => r.code));

      const { error: fcError } = await supabaseAdmin.from("fast_codes").insert({
        code: fastCode,
        type: "mapsite",
        status: "active",
      });
      if (fcError) {
        return { success: false, error: `Failed to create FAST Code: ${fcError.message}` };
      }
    }

    const { data: existingNumbers, error: numError } = await supabaseAdmin
      .from("registrations")
      .select("registration_number");

    if (numError) {
      throw new Error(`Failed to fetch existing registration numbers: ${numError.message}`);
    }

    const registrationNumber = generateRegistrationNumber(
      (existingNumbers || []).map((r) => r.registration_number)
    );

    const { error: regError } = await supabaseAdmin
      .from("registrations")
      .insert({
        email: input.email.trim().toLowerCase(),
        account_type: input.accountType,
        fast_code: fastCode,
        amount_paid: input.amountPaid || 49.95,
        monthly_subscription: input.monthlySubscription || 0,
        registration_number: registrationNumber,
        paypal_order_id: input.paypalOrderId || null,
        paypal_capture_id: input.paypalCaptureId || null,
        status: "active",
      });

    if (regError) {
      throw new Error(`Failed to save registration: ${regError.message}`);
    }

    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        product_name: `${input.accountType} Registration`,
        amount: input.amountPaid || 49.95,
        user_name: `${input.firstName.trim()} ${input.lastName.trim()}`,
        status: "completed",
      });
    if (paymentError) {
      console.error("[talispros-register] Payment record error:", paymentError);
    }

    const mapsite = await createMapSite({
      fastCode,
      accountType: input.accountType,
      ownerFirstName: input.firstName,
      ownerLastName: input.lastName,
      email: input.email,
      phone: input.phone,
    });

    return {
      success: true,
      mapsite,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown server error";
    console.error("[talispros-register] Registration error:", err);
    return { success: false, error: msg };
  }
}
