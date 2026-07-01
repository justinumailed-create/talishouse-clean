"use server";

import type { Database } from "./database.types";
import { isAdminAuthenticated } from "./admin-auth";
import { getMapSiteByFastCode } from "./mapsite-service";
import { tierFromAccountType } from "./registration-fast-code-routing";
import { isTalisprosAdminAuthenticated } from "./talispros-admin-auth";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "./supabaseAdmin";

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

export interface ListBuildSystemFastCodesResult {
  success: boolean;
  error?: string;
  data: Database["public"]["Tables"]["fast_codes"]["Row"][];
}

async function requireFastCodeAdminAccess(): Promise<void> {
  const [legacyAdmin, talisprosAdmin] = await Promise.all([
    isAdminAuthenticated(),
    isTalisprosAdminAuthenticated(),
  ]);

  if (!legacyAdmin && !talisprosAdmin) {
    throw new Error("Unauthorized");
  }
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

  return { success: true, data: data ?? [] };
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
  const { error } = await supabase.from("fast_codes").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
