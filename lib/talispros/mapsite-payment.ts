import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";

/**
 * True when talispros_payments has a completed PayPal capture for this claim.
 * Looks up emails from the FAST Code build request and/or Mapsite™ owner.
 */
export async function hasCompletedMapSitePaypalPayment(options: {
  email?: string | null;
  mapsiteId?: string | null;
  fastCode?: string | null;
  requestId?: string | null;
}): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;

  try {
    const supabase = getSupabaseAdmin();
    const emails = new Set<string>();

    const directEmail = options.email?.trim().toLowerCase();
    if (directEmail) emails.add(directEmail);

    const requestId = options.requestId?.trim() || null;
    const fastCode = options.fastCode?.trim() || null;
    const mapsiteId = options.mapsiteId?.trim() || null;

    let resolvedRequestId = requestId;

    if (!resolvedRequestId && fastCode) {
      const { data: codeRow } = await supabase
        .from("fast_codes")
        .select("request_id")
        .ilike("code", fastCode)
        .maybeSingle();
      resolvedRequestId = codeRow?.request_id ?? null;
    }

    if (resolvedRequestId) {
      const { data: request } = await supabase
        .from("build_requests")
        .select("email")
        .eq("id", resolvedRequestId)
        .maybeSingle();
      const email = request?.email?.trim().toLowerCase();
      if (email) emails.add(email);
    }

    if (mapsiteId) {
      const { data: mapsite } = await supabase
        .from("mapsites")
        .select("email")
        .eq("id", mapsiteId)
        .maybeSingle();
      const email = mapsite?.email?.trim().toLowerCase();
      if (email) emails.add(email);
    }

    if (emails.size === 0) return false;

    const { data: payments, error } = await supabase
      .from("talispros_payments")
      .select("id, payment_status, email")
      .in("email", [...emails])
      .ilike("payment_status", "completed")
      .limit(1);

    if (error) {
      console.warn("[mapsite-payment] lookup failed:", error.message);
      return false;
    }

    return Boolean(payments && payments.length > 0);
  } catch (error) {
    console.warn("[mapsite-payment] hasCompletedMapSitePaypalPayment failed:", error);
    return false;
  }
}
