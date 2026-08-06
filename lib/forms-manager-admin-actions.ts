"use server";

import { isAdminAuthenticated } from "./admin-auth";
import { isTalisprosAdminAuthenticated } from "./talispros-admin-auth";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "./supabaseAdmin";

export type FormsManagerSource = "build_mapsite" | "registration";

export interface FormsManagerBuildMapSiteRow {
  id: string;
  source: "build_mapsite";
  email: string;
  accountType: string;
  adproCategory: string | null;
  status: string;
  createdAt: string;
  fastCode: string | null;
  mapsiteType: string | null;
  mapsiteStatus: string | null;
  assignedTo: string | null;
  streetAddress: string | null;
  pinWriteup: string | null;
}

export interface FormsManagerRegistrationRow {
  id: string;
  source: "registration";
  email: string;
  accountType: string;
  status: string;
  createdAt: string;
  fastCode: string | null;
  amountPaid: number;
  registrationNumber: string;
}

export type FormsManagerRow =
  | FormsManagerBuildMapSiteRow
  | FormsManagerRegistrationRow;

export interface ListFormsManagerResult {
  success: boolean;
  error?: string;
  buildMapSite: FormsManagerBuildMapSiteRow[];
  registrations: FormsManagerRegistrationRow[];
}

async function requireFormsManagerAdminAccess(): Promise<void> {
  const [legacyAdmin, talisprosAdmin] = await Promise.all([
    isAdminAuthenticated(),
    isTalisprosAdminAuthenticated(),
  ]);

  if (!legacyAdmin && !talisprosAdmin) {
    throw new Error("Unauthorized");
  }
}

export async function listFormsManagerSubmissions(): Promise<ListFormsManagerResult> {
  try {
    await requireFormsManagerAdminAccess();
  } catch {
    return {
      success: false,
      error: "Unauthorized",
      buildMapSite: [],
      registrations: [],
    };
  }

  if (!isSupabaseAdminConfigured()) {
    return {
      success: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to .env.local and restart the dev server.",
      buildMapSite: [],
      registrations: [],
    };
  }

  const supabase = getSupabaseAdmin();

  const { data: buildData, error: buildError } = await supabase
    .from("build_requests")
    .select(
      "id, first_name, last_name, email, account_type, adpro_category, status, created_at, street_address, pin_writeup"
    )
    .order("created_at", { ascending: false });

  if (buildError) {
    return {
      success: false,
      error: buildError.message,
      buildMapSite: [],
      registrations: [],
    };
  }

  const buildRows = buildData ?? [];
  const buildIds = buildRows.map((row) => row.id);

  const fcMap: Record<string, string> = {};
  const msMap: Record<
    string,
    { type: string; status: string; assigned_to: string | null }
  > = {};

  if (buildIds.length > 0) {
    const [{ data: fcData }, { data: msData }] = await Promise.all([
      supabase
        .from("fast_codes")
        .select("request_id, code")
        .in("request_id", buildIds),
      supabase
        .from("mapsite_requests")
        .select("request_id, type, status, assigned_to")
        .in("request_id", buildIds),
    ]);

    for (const fc of fcData ?? []) {
      if (fc.request_id) fcMap[fc.request_id] = fc.code;
    }

    for (const ms of msData ?? []) {
      msMap[ms.request_id] = {
        type: ms.type,
        status: ms.status,
        assigned_to: ms.assigned_to,
      };
    }
  }

  const buildMapSite: FormsManagerBuildMapSiteRow[] = buildRows.map((row) => {
    const mapsite = msMap[row.id];
    return {
      id: row.id,
      source: "build_mapsite",
      email: row.email,
      accountType: row.account_type || row.last_name || "—",
      adproCategory: row.adpro_category ?? null,
      status: row.status,
      createdAt: row.created_at,
      fastCode: fcMap[row.id] ?? (row.first_name || null),
      mapsiteType: mapsite?.type ?? null,
      mapsiteStatus: mapsite?.status ?? null,
      assignedTo: mapsite?.assigned_to ?? null,
      streetAddress: row.street_address,
      pinWriteup: row.pin_writeup,
    };
  });

  const { data: registrationData, error: registrationError } = await supabase
    .from("registrations")
    .select(
      "id, email, account_type, fast_code, amount_paid, registration_number, status, created_at"
    )
    .order("created_at", { ascending: false });

  if (registrationError) {
    return {
      success: false,
      error: registrationError.message,
      buildMapSite,
      registrations: [],
    };
  }

  const registrations: FormsManagerRegistrationRow[] = (registrationData ?? []).map(
    (row) => ({
      id: row.id,
      source: "registration",
      email: row.email,
      accountType: row.account_type,
      status: row.status,
      createdAt: row.created_at,
      fastCode: row.fast_code,
      amountPaid: row.amount_paid,
      registrationNumber: row.registration_number,
    })
  );

  return { success: true, buildMapSite, registrations };
}

export async function updateBuildRequestStatusAdmin(
  requestId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireFormsManagerAdminAccess();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("build_requests")
    .update({ status })
    .eq("id", requestId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateMapSiteRequestStatusAdmin(
  requestId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireFormsManagerAdminAccess();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("mapsite_requests")
    .update({ status })
    .eq("request_id", requestId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
