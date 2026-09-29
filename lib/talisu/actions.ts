"use server";

import { safeInsertLead } from "@/lib/supabase";

export type TalisUFormState = {
  ok: boolean;
  error?: string;
};

function required(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function submitTalisULead(
  _prev: TalisUFormState,
  formData: FormData
): Promise<TalisUFormState> {
  const name = required(formData.get("name"));
  const email = required(formData.get("email"));
  const phone = required(formData.get("phone"));
  const location = required(formData.get("location")) || "Not specified";
  const message = required(formData.get("message"));
  const source = required(formData.get("source")) || "talisu";
  const product = required(formData.get("product"));

  if (!name || !email || !phone) {
    return { ok: false, error: "Please fill in name, email, and phone." };
  }

  const composed = [
    product ? `Product interest: ${product}` : null,
    message || null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await safeInsertLead({
      name,
      email,
      phone,
      location,
      message: composed || null,
      source,
      status: "new",
      deal_status: "lead",
    });
    return { ok: true };
  } catch (err) {
    console.error("[talisu] lead insert failed:", err);
    return {
      ok: false,
      error: "Something went wrong submitting your request. Please try again.",
    };
  }
}
