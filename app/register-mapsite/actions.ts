"use server";

// ⚠️ DEPRECATED — Use /talispros/register/actions.ts instead.
// Kept for backward compatibility; will be removed in a future release.

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { finalizeRegistrationClientAccess } from "@/lib/client-analytics-auth";
import { createMapSite } from "@/lib/mapsite";

export interface RegisterMapsiteInput {
  fastCode: string;
  accountType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  province: string;
}

export interface RegisterMapsiteResult {
  success: boolean;
  mapsite?: {
    id: string;
    fastCode: string;
    slug: string;
    url: string;
  };
  redirectUrl?: string;
  error?: string;
}

function validate(input: RegisterMapsiteInput): string | null {
  if (!input.fastCode.trim()) return "FAST Code is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()))
    return "Invalid email format";
  if (!input.firstName.trim()) return "First name is required";
  if (!input.lastName.trim()) return "Last name is required";
  return null;
}

export async function registerMapsite(
  input: RegisterMapsiteInput
): Promise<RegisterMapsiteResult> {
  const validationError = validate(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        product_name: "MapSite Registration",
        amount: 49.99,
        user_name: `${input.firstName.trim()} ${input.lastName.trim()}`,
        status: "completed",
      });

    if (paymentError) {
      console.error("[register-mapsite] Payment record error:", paymentError);
    }

    const mapsite = await createMapSite({
      fastCode: input.fastCode,
      accountType: input.accountType,
      ownerFirstName: input.firstName,
      ownerLastName: input.lastName,
      email: input.email,
      phone: input.phone,
      city: input.city,
      province: input.province,
    });

    const { redirectUrl } = await finalizeRegistrationClientAccess(
      input.email,
      mapsite.fastCode
    );

    return {
      success: true,
      mapsite,
      redirectUrl,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown server error";
    console.error("[register-mapsite] Registration error:", err);
    return { success: false, error: msg };
  }
}
