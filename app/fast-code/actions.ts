"use server";

import { supabase } from "@/lib/supabaseClient";
import { generateFastCode } from "@/lib/fast-code-generator";

export interface FormFields {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  province: string;
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) return "Invalid email format";
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

  console.log("[fast-code] ENV CHECK:", JSON.stringify({
    urlPresent: !!supabaseUrl,
    urlLength: supabaseUrl?.length,
    urlStart: supabaseUrl ? supabaseUrl.substring(0, 20) : "N/A",
    keyPresent: !!supabaseKey,
    keyLength: supabaseKey?.length,
    keyStart: supabaseKey ? supabaseKey.substring(0, 20) : "N/A",
    nodeVersion: process.version,
  }));

  if (!supabaseUrl || !supabaseKey) {
    console.error("[fast-code] MISSING ENV: URL present:", !!supabaseUrl, "KEY present:", !!supabaseKey);
    return {
      success: false,
      error: "Server configuration error: Supabase credentials not found.",
    };
  }

  try {
    console.log("[fast-code] Attempting Supabase SELECT from fast_code_registrations");
    const { data: existing, error: selectError } = await supabase
      .from("fast_code_registrations")
      .select("fast_code");

    if (selectError) {
      console.error("SELECT ERROR:", JSON.stringify(selectError, null, 2));
      return {
        success: false,
        error: `Database error: ${selectError.message} (code: ${selectError.code})`,
      };
    }

    const existingCodes = (existing || []).map((r) => r.fast_code);

    const fastCode = generateFastCode(existingCodes);

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
      console.error("INSERT ERROR:", JSON.stringify(insertError, null, 2));

      if (insertError.code === "23505") {
        const { data: retryExisting, error: retrySelectError } = await supabase
          .from("fast_code_registrations")
          .select("fast_code");

        if (retrySelectError) {
          console.error("RETRY SELECT ERROR:", JSON.stringify(retrySelectError, null, 2));
          return {
            success: false,
            error: `Retry failed: ${retrySelectError.message}`,
          };
        }

        const retryCodes = (retryExisting || []).map((r) => r.fast_code);
        const retryCode = generateFastCode(retryCodes);

        const { error: retryError } = await supabase
          .from("fast_code_registrations")
          .insert([
            {
              fast_code: retryCode,
              first_name: data.firstName.trim(),
              last_name: data.lastName.trim(),
              email: data.email.trim(),
              cell_phone: data.phone.trim(),
              street_address: data.address.trim(),
              province: data.province.trim(),
            },
          ]);

        if (retryError) {
          console.error("RETRY INSERT ERROR:", JSON.stringify(retryError, null, 2));
          return {
            success: false,
            error: `Retry insert failed: ${retryError.message}`,
          };
        }

        return { success: true, fastCode: retryCode };
      }

      return {
        success: false,
        error: `Insert failed: ${insertError.message} (code: ${insertError.code})`,
      };
    }

    return { success: true, fastCode };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown";
    const errCause = err instanceof Error && (err as any).cause
      ? (err as any).cause instanceof Error
        ? `${(err as any).cause.message}`
        : JSON.stringify((err as any).cause)
      : "no cause";

    console.error("[fast-code] CATCH BLOCK ERROR:", errMsg);
    console.error("[fast-code] CAUSE:", errCause);
    console.error("[fast-code] STACK:", err instanceof Error ? err.stack : "no stack");
    console.error("[fast-code] FULL ERROR:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));

    return {
      success: false,
      error: `Server error: ${errMsg}${errCause !== "no cause" ? ` (${errCause})` : ""}`,
    };
  }
}
