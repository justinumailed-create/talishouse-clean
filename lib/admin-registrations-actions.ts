"use server";

import { isAdminAuthenticated } from "./admin-auth";
import { isTalisprosAdminAuthenticated } from "./talispros-admin-auth";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "./supabaseAdmin";
import {
  adminRegistrationFromTalisprosPayment,
  mergeAdminRegistrationRows,
  type AdminRegistrationRow,
} from "./admin-registrations";

export type ListAdminRegistrationsResult = {
  success: boolean;
  error?: string;
  data: AdminRegistrationRow[];
};

async function requireRegistrationsAdminAccess(): Promise<void> {
  if (await isAdminAuthenticated()) return;
  if (await isTalisprosAdminAuthenticated()) return;
  throw new Error("Unauthorized");
}

export async function listAdminRegistrations(): Promise<ListAdminRegistrationsResult> {
  try {
    await requireRegistrationsAdminAccess();
  } catch {
    return { success: false, error: "Unauthorized", data: [] };
  }

  if (!isSupabaseAdminConfigured()) {
    return {
      success: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to .env.local and restart the dev server.",
      data: [],
    };
  }

  const supabase = getSupabaseAdmin();

  const { data: legacyRows, error: legacyError } = await supabase
    .from("registrations")
    .select(
      "id, email, account_type, fast_code, amount_paid, registration_number, status, created_at",
    )
    .order("created_at", { ascending: false });

  if (legacyError) {
    console.warn(
      "[registrations] registrations table lookup failed:",
      legacyError.message,
    );
  }

  const legacy: AdminRegistrationRow[] = (legacyRows ?? []).map((row) => ({
    id: row.id,
    source: "registrations",
    email: row.email,
    account_type: row.account_type,
    fast_code: row.fast_code ?? "",
    amount_paid: row.amount_paid,
    registration_number: row.registration_number,
    status: row.status,
    created_at: row.created_at,
    markable: row.status !== "completed",
  }));

  const { data: payments, error: paymentsError } = await supabase
    .from("talispros_payments")
    .select(
      "id, email, plan_type, payment_status, fast_code, mapsite_id, paypal_order_id, paypal_capture_id, stripe_payment_intent_id, stripe_checkout_session_id, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(2000);

  if (paymentsError) {
    console.warn(
      "[registrations] talispros_payments lookup failed:",
      paymentsError.message,
    );
  }

  const mapsiteIds = [
    ...new Set(
      (payments ?? [])
        .map((row) => row.mapsite_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const mapsiteCodeById = new Map<string, string>();
  if (mapsiteIds.length > 0) {
    const { data: mapsites } = await supabase
      .from("mapsites")
      .select("id, fast_code")
      .in("id", mapsiteIds);
    for (const mapsite of mapsites ?? []) {
      mapsiteCodeById.set(mapsite.id, mapsite.fast_code);
    }
  }

  const fromPayments = (payments ?? []).map((row) =>
    adminRegistrationFromTalisprosPayment(
      row,
      row.mapsite_id ? mapsiteCodeById.get(row.mapsite_id) : null,
    ),
  );

  const data = mergeAdminRegistrationRows(legacy, fromPayments);

  if (legacyError && paymentsError) {
    return {
      success: false,
      error: paymentsError.message || legacyError.message,
      data: [],
    };
  }

  return { success: true, data };
}

export async function markAdminRegistrationCompleted(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRegistrationsAdminAccess();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Database is not configured." };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("registrations")
    .update({ status: "completed" })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function markAllAdminRegistrationsCompleted(
  ids: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRegistrationsAdminAccess();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Database is not configured." };
  }

  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return { success: true };

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("registrations")
    .update({ status: "completed" })
    .in("id", uniqueIds);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
