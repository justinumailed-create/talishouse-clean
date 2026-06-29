"use server";

import { supabase } from "@/lib/supabaseClient";
import { createAccount } from "@/lib/account-service";
import {
  FastCodeApiError,
  requestFastCodeGeneration,
} from "@/lib/fast-code-client";

export interface FormFields {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  province: string;
  middleName?: string;
}

export interface ActionResult {
  success: boolean;
  fastCode?: string;
  error?: string;
}

function validate(data: FormFields): string | null {
  if (!data.firstName.trim()) return "First name is required";
  if (!data.lastName.trim()) return "Last name is required";
  if (!data.email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
    return "Invalid email format";
  if (!data.phone.trim()) return "Phone number is required";
  if (!data.address.trim()) return "Address is required";
  if (!data.province.trim()) return "State / Province is required";
  return null;
}

export async function registerFastCode(data: FormFields): Promise<ActionResult> {
  const validationError = validate(data);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      success: false,
      error: "Server configuration error: Supabase credentials not found.",
    };
  }

  try {
    const { fastCode } = await requestFastCodeGeneration({
      firstName: data.firstName,
      middleName: data.middleName ?? null,
      lastName: data.lastName,
    });

    await createAccount({
      firstName: data.firstName,
      middleName: data.middleName ?? null,
      lastName: data.lastName,
      email: data.email,
      fastCode,
    });

    const { error: insertError } = await supabase
      .from("fast_code_registrations")
      .insert([
        {
          fast_code: fastCode,
          first_name: data.firstName.trim(),
          last_name: data.lastName.trim(),
          email: data.email.trim(),
          cell_phone: data.phone.trim(),
          street_address: data.address.trim(),
          province: data.province.trim(),
        },
      ]);

    if (insertError) {
      if (insertError.code === "23505") {
        return {
          success: false,
          error: "FAST Code already registered. Please try again.",
        };
      }

      return {
        success: false,
        error: `Insert failed: ${insertError.message} (code: ${insertError.code})`,
      };
    }

    return { success: true, fastCode };
  } catch (err) {
    if (err instanceof FastCodeApiError) {
      return { success: false, error: err.message };
    }

    const errMsg = err instanceof Error ? err.message : "Unknown";
    console.error("[fast-code] Registration error:", err);
    return {
      success: false,
      error: `Server error: ${errMsg}`,
    };
  }
}
