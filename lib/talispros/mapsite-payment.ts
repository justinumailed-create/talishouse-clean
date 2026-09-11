import { getStripeClient, getStripeSecretKey } from "@/lib/stripe";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { isProtectedPlatformDemoMapSite } from "@/lib/talispros/demo-mapsite";
import {
  isCompletedTalisprosPaymentStatus,
  normalizePaymentEmail,
} from "@/lib/talispros/mapsite-payment-status";
import type Stripe from "stripe";

export {
  isCompletedTalisprosPaymentStatus,
  normalizePaymentEmail,
} from "@/lib/talispros/mapsite-payment-status";

type PaymentLookupRow = {
  id?: string | null;
  payment_status?: string | null;
  email?: string | null;
  mapsite_id?: string | null;
  request_id?: string | null;
  fast_code?: string | null;
};

function rowIsCompletedPayment(row: PaymentLookupRow | null | undefined): boolean {
  return Boolean(row?.id) && isCompletedTalisprosPaymentStatus(row?.payment_status);
}

export interface MapSitePaymentLookupOptions {
  email?: string | null;
  mapsiteId?: string | null;
  fastCode?: string | null;
  requestId?: string | null;
  stripeCheckoutSessionId?: string | null;
  /**
   * When the local payment row is missing, ask Stripe for a paid Checkout
   * session for this Mapsite™ and activate it. Use on owner/checkout paths —
   * not on hot anonymous traffic — then persist so later reads are DB-only.
   */
  reconcileFromStripe?: boolean;
}

/**
 * True when talispros_payments has a completed activation payment for this claim.
 * Historical PayPal rows and new Stripe rows both use payment_status completed.
 *
 * Lookup order (any completed match unlocks):
 * 1. stripe_checkout_session_id
 * 2. mapsite_id / request_id / fast_code on the payment row
 * 3. emails from the mapsite, linked build request, and account
 */
export async function hasCompletedMapSitePaypalPayment(
  options: MapSitePaymentLookupOptions,
): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;

  try {
    const found = await findCompletedMapSitePayment(options);
    if (found) return true;

    if (options.reconcileFromStripe) {
      const healed = await reconcileMapSitePaymentFromStripe(options);
      if (healed) return true;
    }

    return false;
  } catch (error) {
    console.warn("[mapsite-payment] hasCompletedMapSitePaypalPayment failed:", error);
    return false;
  }
}

async function findCompletedMapSitePayment(
  options: MapSitePaymentLookupOptions,
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const emails = new Set<string>();
  const mapsiteIds = new Set<string>();
  const requestIds = new Set<string>();
  const fastCodes = new Set<string>();

  const directEmail = normalizePaymentEmail(options.email);
  if (directEmail) emails.add(directEmail);

  const requestId = options.requestId?.trim() || null;
  const fastCode = options.fastCode?.trim() || null;
  const mapsiteId = options.mapsiteId?.trim() || null;
  const stripeCheckoutSessionId = options.stripeCheckoutSessionId?.trim() || null;

  if (mapsiteId) mapsiteIds.add(mapsiteId);
  if (requestId) requestIds.add(requestId);
  if (fastCode) fastCodes.add(fastCode);

  let resolvedRequestId = requestId;

  if (stripeCheckoutSessionId) {
    const { data: bySession, error } = await supabase
      .from("talispros_payments")
      .select("id, payment_status")
      .eq("stripe_checkout_session_id", stripeCheckoutSessionId)
      .maybeSingle();
    if (!error && rowIsCompletedPayment(bySession)) return true;
  }

  if (!resolvedRequestId && fastCode) {
    const { data: codeRow } = await supabase
      .from("fast_codes")
      .select("request_id, mapsite_id")
      .ilike("code", fastCode)
      .maybeSingle();
    resolvedRequestId = codeRow?.request_id ?? null;
    if (resolvedRequestId) requestIds.add(resolvedRequestId);
    if (codeRow?.mapsite_id) mapsiteIds.add(codeRow.mapsite_id);
  }

  if (resolvedRequestId) {
    const { data: request } = await supabase
      .from("build_requests")
      .select("email, linked_mapsite_id, requested_fast_code")
      .eq("id", resolvedRequestId)
      .maybeSingle();
    const email = normalizePaymentEmail(request?.email);
    if (email) emails.add(email);
    if (request?.linked_mapsite_id) mapsiteIds.add(request.linked_mapsite_id);
    if (request?.requested_fast_code) {
      fastCodes.add(request.requested_fast_code);
    }
  }

  for (const id of [...mapsiteIds]) {
    const { data: mapsite } = await supabase
      .from("mapsites")
      .select("email, account_id, fast_code")
      .eq("id", id)
      .maybeSingle();
    const email = normalizePaymentEmail(mapsite?.email);
    if (email) emails.add(email);
    if (mapsite?.fast_code) fastCodes.add(mapsite.fast_code);

    const { data: linkedRequests } = await supabase
      .from("build_requests")
      .select("id, email, requested_fast_code")
      .eq("linked_mapsite_id", id)
      .order("created_at", { ascending: false })
      .limit(5);
    for (const request of linkedRequests || []) {
      if (request?.id) requestIds.add(request.id);
      const requestEmail = normalizePaymentEmail(request?.email);
      if (requestEmail) emails.add(requestEmail);
      if (request?.requested_fast_code) {
        fastCodes.add(request.requested_fast_code);
      }
    }

    if (mapsite?.account_id) {
      const { data: account } = await supabase
        .from("accounts")
        .select("email, fast_code")
        .eq("id", mapsite.account_id)
        .maybeSingle();
      const accountEmail = normalizePaymentEmail(account?.email);
      if (accountEmail) emails.add(accountEmail);
      if (account?.fast_code) fastCodes.add(account.fast_code);
    }
  }

  if (await paymentsHaveCompletedMatch({ mapsiteIds, requestIds, fastCodes, emails })) {
    return true;
  }

  return false;
}

async function paymentsHaveCompletedMatch(options: {
  mapsiteIds: Set<string>;
  requestIds: Set<string>;
  fastCodes: Set<string>;
  emails: Set<string>;
}): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const completedIn = async (
    result: PromiseLike<{
      data: PaymentLookupRow[] | null;
      error: { message?: string } | null;
    }>,
  ): Promise<boolean> => {
    try {
      const { data, error } = await result;
      if (error) {
        if (isMissingPaymentLinkColumnError(error.message)) return false;
        console.warn("[mapsite-payment] lookup failed:", error.message);
        return false;
      }
      return Boolean(data?.some((row) => rowIsCompletedPayment(row)));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isMissingPaymentLinkColumnError(message)) return false;
      throw error;
    }
  };

  for (const mapsiteId of options.mapsiteIds) {
    if (
      await completedIn(
        supabase
          .from("talispros_payments")
          .select("id, payment_status")
          .eq("mapsite_id", mapsiteId)
          .limit(20),
      )
    ) {
      return true;
    }
  }

  for (const requestId of options.requestIds) {
    if (
      await completedIn(
        supabase
          .from("talispros_payments")
          .select("id, payment_status")
          .eq("request_id", requestId)
          .limit(20),
      )
    ) {
      return true;
    }
  }

  for (const fastCode of options.fastCodes) {
    if (
      await completedIn(
        supabase
          .from("talispros_payments")
          .select("id, payment_status")
          .ilike("fast_code", fastCode)
          .limit(20),
      )
    ) {
      return true;
    }
  }

  if (options.emails.size > 0) {
    const { data: payments, error } = await supabase
      .from("talispros_payments")
      .select("id, payment_status, email")
      .in("email", [...options.emails])
      .limit(20);

    if (error) {
      console.warn("[mapsite-payment] email lookup failed:", error.message);
    } else if (payments?.some((row) => rowIsCompletedPayment(row))) {
      return true;
    }
  }

  return false;
}

function isMissingPaymentLinkColumnError(message: string | undefined): boolean {
  if (!message) return false;
  return /mapsite_id|request_id|fast_code|column/i.test(message);
}

/**
 * If Stripe already captured activation for this Mapsite™ / Checkout session
 * but `talispros_payments` was never marked completed, run the same activation
 * path as the webhook. Safe to call repeatedly (idempotent).
 */
export async function reconcileMapSitePaymentFromStripe(
  options: MapSitePaymentLookupOptions,
): Promise<boolean> {
  if (!getStripeSecretKey()) return false;

  const mapsiteId = options.mapsiteId?.trim() || "";
  const sessionId = options.stripeCheckoutSessionId?.trim() || "";

  if (!sessionId && !mapsiteId) return false;
  if (mapsiteId && isProtectedPlatformDemoMapSite(mapsiteId)) return false;

  try {
    const stripe = getStripeClient();

    if (sessionId) {
      const { activateMapSiteFromStripeCheckoutSession } = await import(
        "@/lib/talispros/stripe-mapsite-webhook"
      );
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const result = await activateMapSiteFromStripeCheckoutSession(session);
      if (result.success && !result.ignored && !result.error) return true;
      if (result.alreadyProcessed) return true;
    }

    if (!mapsiteId) return false;

    const { activateMapSiteFromStripeCheckoutSession } = await import(
      "@/lib/talispros/stripe-mapsite-webhook"
    );

    if (isSupabaseAdminConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data: pendingRows } = await supabase
        .from("talispros_payments")
        .select("stripe_checkout_session_id")
        .eq("mapsite_id", mapsiteId)
        .not("stripe_checkout_session_id", "is", null)
        .limit(10);
      for (const row of pendingRows || []) {
        const pendingSessionId = row.stripe_checkout_session_id?.trim();
        if (!pendingSessionId || pendingSessionId === sessionId) continue;
        const session = await stripe.checkout.sessions.retrieve(pendingSessionId);
        const result = await activateMapSiteFromStripeCheckoutSession(session);
        if (result.success && !result.ignored && !result.error) return true;
        if (result.alreadyProcessed) return true;
      }
    }

    const sessions = await listPaidStripeCheckoutSessionsForMapSite(mapsiteId);
    for (const session of sessions) {
      const result = await activateMapSiteFromStripeCheckoutSession(session);
      if (result.success && !result.ignored && !result.error) return true;
      if (result.alreadyProcessed) return true;
    }
  } catch (error) {
    console.warn("[mapsite-payment] Stripe reconciliation failed:", error);
  }

  return findCompletedMapSitePayment(options);
}

async function listPaidStripeCheckoutSessionsForMapSite(
  mapsiteId: string,
): Promise<Stripe.Checkout.Session[]> {
  const stripe = getStripeClient();
  const paid: Stripe.Checkout.Session[] = [];

  try {
    const searched = await stripe.checkout.sessions.search({
      query: `metadata["mapSiteId"]:"${mapsiteId}"`,
      limit: 20,
    });
    for (const session of searched.data) {
      paid.push(session);
    }
  } catch (error) {
    console.warn(
      "[mapsite-payment] Checkout session search unavailable:",
      error instanceof Error ? error.message : error,
    );
  }

  if (paid.length === 0) {
    try {
      const searched = await stripe.checkout.sessions.search({
        query: `metadata["mapsiteId"]:"${mapsiteId}"`,
        limit: 20,
      });
      for (const session of searched.data) {
        paid.push(session);
      }
    } catch {
      /* metadata key variant not searchable */
    }
  }

  return paid;
}
