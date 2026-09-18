"use server";

import type { Database } from "./database.types";
import { getAdminSessionAccount, requireAdminScope } from "./admin-auth";
import { getMapSiteByFastCode } from "./mapsite-service";
import { deleteMapSiteAndBookshelfForFastCode } from "./talispros/fast-code-cascade-delete";
import { tierFromAccountType } from "./registration-fast-code-routing";
import { isTalisprosAdminAuthenticated } from "./talispros-admin-auth";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "./supabaseAdmin";
import { attachFastCodePayments } from "./fast-code-admin-payment";

export interface AdminFastCodeInput {
  code: string;
  type: string;
  accountType?: string | null;
}

export interface AdminFastCodeUpdateInput {
  id: string;
  type: string;
  accountType?: string | null;
}

export interface AdminFastCodeActionResult {
  success: boolean;
  error?: string;
  data?: Database["public"]["Tables"]["fast_codes"]["Row"];
}

export type AdminFastCodeListItem = Database["public"]["Tables"]["fast_codes"]["Row"] & {
  paymentSuccessful: boolean;
  stripeTransactionId: string | null;
  email?: string | null;
};

export interface ListBuildSystemFastCodesResult {
  success: boolean;
  error?: string;
  data: AdminFastCodeListItem[];
}

async function requireFastCodeAdminAccess(): Promise<void> {
  const account = await getAdminSessionAccount();
  if (account) {
    await requireAdminScope("fast-codes");
    return;
  }

  if (await isTalisprosAdminAuthenticated()) {
    return;
  }

  throw new Error("Unauthorized");
}

export async function listBuildSystemFastCodes(): Promise<ListBuildSystemFastCodesResult> {
  try {
    await requireFastCodeAdminAccess();
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
  const { data, error } = await supabase
    .from("fast_codes")
    .select("id, code, type, request_id, account_type, mapsite_id, assigned_at")
    .order("assigned_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message, data: [] };
  }

  const rows = data ?? [];
  const paymentSelect =
    "payment_status, fast_code, mapsite_id, request_id, email, stripe_payment_intent_id, stripe_checkout_session_id";

  const [
    { data: mapsites },
    { data: accounts },
    { data: buildRequests },
  ] = await Promise.all([
    supabase.from("mapsites").select("id, fast_code, email, account_id"),
    supabase.from("accounts").select("id, email, fast_code"),
    supabase
      .from("build_requests")
      .select("id, email, linked_mapsite_id, requested_fast_code"),
  ]);

  const payments: Array<{
    payment_status?: string | null;
    fast_code?: string | null;
    mapsite_id?: string | null;
    request_id?: string | null;
    email?: string | null;
    stripe_payment_intent_id?: string | null;
    stripe_checkout_session_id?: string | null;
  }> = [];
  const pageSize = 1000;
  for (let from = 0; from < 20_000; from += pageSize) {
    const { data: page, error: paymentsError } = await supabase
      .from("talispros_payments")
      .select(paymentSelect)
      .or(
        "payment_status.ilike.completed,payment_status.ilike.paid,payment_status.ilike.complete,payment_status.ilike.succeeded",
      )
      .range(from, from + pageSize - 1);

    if (paymentsError) {
      console.warn(
        "[fast-codes] talispros_payments lookup failed:",
        paymentsError.message,
      );
      if (from === 0) {
        const fallback = await supabase
          .from("talispros_payments")
          .select(paymentSelect)
          .limit(pageSize);
        if (fallback.error) {
          console.warn(
            "[fast-codes] talispros_payments fallback failed:",
            fallback.error.message,
          );
        }
        payments.push(...(fallback.data ?? []));
      }
      break;
    }

    payments.push(...(page ?? []));
    if (!page || page.length < pageSize) break;
  }

  type LinkedMapsite = {
    id: string;
    email: string | null;
    account_id: string | null;
  };
  const mapsiteByCode = new Map<string, LinkedMapsite>();
  const mapsiteById = new Map<string, LinkedMapsite>();
  for (const mapsite of mapsites ?? []) {
    const code = mapsite.fast_code?.trim().toLowerCase() || "";
    const value: LinkedMapsite = {
      id: mapsite.id,
      email: mapsite.email ?? null,
      account_id: mapsite.account_id ?? null,
    };
    if (code) mapsiteByCode.set(code, value);
    mapsiteById.set(mapsite.id, value);
  }

  const accountById = new Map<string, { email: string | null }>();
  const accountByCode = new Map<string, { email: string | null }>();
  for (const account of accounts ?? []) {
    const email = account.email ?? null;
    accountById.set(account.id, { email });
    const code = account.fast_code?.trim().toLowerCase() || "";
    if (code) accountByCode.set(code, { email });
  }

  const requestsByMapsite = new Map<
    string,
    Array<{ id: string; email: string | null }>
  >();
  const requestsByCode = new Map<
    string,
    Array<{ id: string; email: string | null }>
  >();
  for (const request of buildRequests ?? []) {
    const value = { id: request.id, email: request.email ?? null };
    if (request.linked_mapsite_id) {
      const list = requestsByMapsite.get(request.linked_mapsite_id) ?? [];
      list.push(value);
      requestsByMapsite.set(request.linked_mapsite_id, list);
    }
    const requested = request.requested_fast_code?.trim().toLowerCase() || "";
    if (requested) {
      const list = requestsByCode.get(requested) ?? [];
      list.push(value);
      requestsByCode.set(requested, list);
    }
  }

  const withMapsite = rows.map((row) => {
    const codeKey = row.code.trim().toLowerCase();
    const linked =
      (row.mapsite_id ? mapsiteById.get(row.mapsite_id) : null) ||
      mapsiteByCode.get(codeKey) ||
      null;
    const mapsiteId = row.mapsite_id || linked?.id || null;
    const account =
      (linked?.account_id ? accountById.get(linked.account_id) : null) ||
      accountByCode.get(codeKey) ||
      null;
    const linkedRequests =
      (mapsiteId ? requestsByMapsite.get(mapsiteId) : null) ||
      requestsByCode.get(codeKey) ||
      [];
    const emails = [
      linked?.email ?? null,
      account?.email ?? null,
      ...linkedRequests.map((request) => request.email),
    ];
    return {
      ...row,
      mapsite_id: mapsiteId,
      request_id: row.request_id || linkedRequests[0]?.id || null,
      email: emails.find((value) => value?.includes("@")) ?? null,
      emails,
    };
  });

  return {
    success: true,
    data: attachFastCodePayments(withMapsite, payments),
  };
}

export async function createAdminFastCode(
  input: AdminFastCodeInput
): Promise<AdminFastCodeActionResult> {
  try {
    await requireFastCodeAdminAccess();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  if (!isSupabaseAdminConfigured()) {
    return {
      success: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to .env.local and restart the dev server.",
    };
  }

  const code = input.code.trim().toUpperCase();
  const type = input.type.trim() || "mapsite";
  const mapsite = await getMapSiteByFastCode(code.toLowerCase());
  const accountType =
    input.accountType?.trim() ||
    tierFromAccountType(mapsite?.accountType) ||
    (type === "mapsite" ? "root" : null);

  if (!code) {
    return { success: false, error: "FAST code is required." };
  }

  const insert: Database["public"]["Tables"]["fast_codes"]["Insert"] = {
    code,
    type,
    account_type: accountType,
    mapsite_id: mapsite?.id ?? null,
  };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("fast_codes")
    .insert(insert)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "That FAST code already exists." };
    }

    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function updateAdminFastCode(
  input: AdminFastCodeUpdateInput
): Promise<AdminFastCodeActionResult> {
  try {
    await requireFastCodeAdminAccess();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  if (!isSupabaseAdminConfigured()) {
    return {
      success: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to .env.local and restart the dev server.",
    };
  }

  const type = input.type.trim() || "mapsite";
  const accountType = input.accountType?.trim() || null;

  const supabase = getSupabaseAdmin();
  const { data: existing, error: fetchError } = await supabase
    .from("fast_codes")
    .select("id, code")
    .eq("id", input.id)
    .maybeSingle();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  if (!existing) {
    return { success: false, error: "FAST code not found." };
  }

  const mapsite = await getMapSiteByFastCode(existing.code.toLowerCase());
  const resolvedAccountType =
    accountType ||
    tierFromAccountType(mapsite?.accountType) ||
    (type === "mapsite" ? "root" : null);

  const { data, error } = await supabase
    .from("fast_codes")
    .update({
      type,
      account_type: resolvedAccountType,
      mapsite_id: mapsite?.id ?? null,
    })
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function deleteAdminFastCode(
  id: string
): Promise<AdminFastCodeActionResult> {
  try {
    await requireFastCodeAdminAccess();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  if (!isSupabaseAdminConfigured()) {
    return {
      success: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to .env.local and restart the dev server.",
    };
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: fetchError } = await supabase
    .from("fast_codes")
    .select("id, code")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }
  if (!existing) {
    return { success: false, error: "FAST code not found." };
  }

  const cascaded = await deleteMapSiteAndBookshelfForFastCode(
    supabase,
    existing.code,
  );
  if (!cascaded.ok) {
    return { success: false, error: cascaded.error };
  }

  const { error } = await supabase.from("fast_codes").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteLegacyFastCodeRegistrations(): Promise<{
  success: boolean;
  error?: string;
  deleted?: number;
}> {
  try {
    await requireFastCodeAdminAccess();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  if (!isSupabaseAdminConfigured()) {
    return {
      success: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to .env.local and restart the dev server.",
    };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    // Legacy /fast-code sign-ups — not in generated Database types.
    .from("fast_code_registrations" as never)
    .delete()
    .neq("fast_code", "")
    .select("id");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, deleted: (data as { id: string }[] | null)?.length ?? 0 };
}
