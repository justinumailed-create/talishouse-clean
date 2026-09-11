import { getStripeClient, getStripeSecretKey } from "@/lib/stripe";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { isProtectedPlatformDemoMapSite } from "@/lib/talispros/demo-mapsite";
import {
  isCompletedTalisprosPaymentStatus,
  normalizePaymentEmail,
} from "@/lib/talispros/mapsite-payment-status";
import { stripeMapSiteIdFromCheckoutSession } from "@/lib/talispros/stripe-mapsite-session";
import {
  checkoutSessionMatchesEmail,
  checkoutSessionMatchesMapSite,
  isPaidRootOneDollarCheckoutSession,
  selectCheckoutSessionsForMapSite,
  selectPaidRootOneDollarCheckoutSessionsForEmail,
  shouldReconcileClaimedMapSiteFromStripe,
} from "@/lib/talispros/stripe-root-checkout-match";
import type Stripe from "stripe";

export {
  isCompletedTalisprosPaymentStatus,
  normalizePaymentEmail,
} from "@/lib/talispros/mapsite-payment-status";

export { shouldReconcileClaimedMapSiteFromStripe };

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
 * Stripe Checkout rows and historical PayPal rows both use payment_status completed.
 *
 * Lookup order (any completed match unlocks):
 * 1. stripe_checkout_session_id
 * 2. mapsite_id / request_id / fast_code on the payment row
 * 3. emails from the mapsite, linked build request, and account
 */
export async function hasCompletedMapSiteActivationPayment(
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
    console.warn("[mapsite-payment] hasCompletedMapSiteActivationPayment failed:", error);
    return false;
  }
}

/** @deprecated Use hasCompletedMapSiteActivationPayment (Stripe + PayPal). */
export const hasCompletedMapSitePaypalPayment =
  hasCompletedMapSiteActivationPayment;

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

  const sessionId = options.stripeCheckoutSessionId?.trim() || "";
  const mapsiteId = (await resolveMapSiteIdForStripeReconcile(options)) || "";
  const email = normalizePaymentEmail(options.email);

  if (!sessionId && !mapsiteId && !email) return false;
  if (mapsiteId && isProtectedPlatformDemoMapSite(mapsiteId)) return false;

  try {
    const stripe = getStripeClient();
    const { activateMapSiteFromStripeCheckoutSession } = await import(
      "@/lib/talispros/stripe-mapsite-webhook"
    );

    const tryActivate = async (session: Stripe.Checkout.Session) => {
      if (mapsiteId && !checkoutSessionMatchesMapSite(session, mapsiteId)) {
        const linkedId = stripeMapSiteIdFromCheckoutSession(session);
        if (linkedId && linkedId !== mapsiteId) return false;
      }
      const result = await activateMapSiteFromStripeCheckoutSession(session);
      if (result.success && !result.ignored && !result.error) return true;
      return Boolean(result.alreadyProcessed);
    };

    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (await tryActivate(session)) return true;
    }

    if (mapsiteId && isSupabaseAdminConfigured()) {
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
        if (await tryActivate(session)) return true;
      }
    }

    if (mapsiteId) {
      const sessions = await listPaidStripeCheckoutSessionsForMapSite(mapsiteId);
      for (const session of sessions) {
        if (await tryActivate(session)) return true;
      }
    }

    const reconcileEmail =
      email || (mapsiteId ? await emailForMapSiteId(mapsiteId) : null);
    if (reconcileEmail) {
      const byEmail = await listPaidRootOneDollarCheckoutSessionsForEmail(
        reconcileEmail,
      );
      for (const session of byEmail) {
        if (mapsiteId && !sessionBelongsToMapSiteOrEmail(session, mapsiteId, reconcileEmail)) {
          continue;
        }
        if (await tryActivate(session)) return true;
      }
    }
  } catch (error) {
    console.warn("[mapsite-payment] Stripe reconciliation failed:", error);
  }

  return findCompletedMapSitePayment(options);
}

function sessionBelongsToMapSiteOrEmail(
  session: Stripe.Checkout.Session,
  mapsiteId: string,
  email: string,
): boolean {
  if (checkoutSessionMatchesMapSite(session, mapsiteId)) return true;
  const linkedId =
    session.metadata?.mapSiteId?.trim() ||
    session.metadata?.mapsiteId?.trim() ||
    session.client_reference_id?.trim() ||
    "";
  if (linkedId && linkedId !== mapsiteId) return false;
  return checkoutSessionMatchesEmail(session, email);
}

async function resolveMapSiteIdForStripeReconcile(
  options: MapSitePaymentLookupOptions,
): Promise<string | null> {
  const direct = options.mapsiteId?.trim() || "";
  if (direct) return direct;
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = getSupabaseAdmin();
  const fastCode = options.fastCode?.trim();
  if (fastCode) {
    const { data: byCode } = await supabase
      .from("mapsites")
      .select("id")
      .ilike("fast_code", fastCode)
      .maybeSingle();
    if (byCode?.id) return byCode.id;
  }

  const requestId = options.requestId?.trim();
  if (requestId) {
    const { data: request } = await supabase
      .from("build_requests")
      .select("linked_mapsite_id")
      .eq("id", requestId)
      .maybeSingle();
    if (request?.linked_mapsite_id) return request.linked_mapsite_id;
  }

  return null;
}

async function emailForMapSiteId(mapsiteId: string): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("mapsites")
    .select("email")
    .eq("id", mapsiteId)
    .maybeSingle();
  return normalizePaymentEmail(data?.email);
}

/**
 * Stripe Node v22 types dropped Checkout.Sessions.search while the runtime
 * Search API still exists. Call it through a narrow helper so typecheck passes
 * and the existing list() fallback still runs if search is missing.
 */
async function searchCheckoutSessions(
  stripe: Stripe,
  query: string,
): Promise<Stripe.Checkout.Session[]> {
  const search = (
    stripe.checkout.sessions as {
      search?: (params: {
        query: string;
        limit?: number;
      }) => Promise<{ data: Stripe.Checkout.Session[] }>;
    }
  ).search;
  if (typeof search !== "function") return [];
  const searched = await search({ query, limit: 20 });
  return searched.data;
}

async function listPaidStripeCheckoutSessionsForMapSite(
  mapsiteId: string,
): Promise<Stripe.Checkout.Session[]> {
  const stripe = getStripeClient();
  const collected = new Map<string, Stripe.Checkout.Session>();
  const add = (sessions: Stripe.Checkout.Session[]) => {
    for (const session of selectCheckoutSessionsForMapSite(sessions, mapsiteId)) {
      collected.set(session.id, session);
    }
  };

  try {
    add(await searchCheckoutSessions(stripe, `metadata["mapSiteId"]:"${mapsiteId}"`));
  } catch (error) {
    console.warn(
      "[mapsite-payment] Checkout session search unavailable:",
      error instanceof Error ? error.message : error,
    );
  }

  if (collected.size === 0) {
    try {
      add(await searchCheckoutSessions(stripe, `metadata["mapsiteId"]:"${mapsiteId}"`));
    } catch {
      /* metadata key variant not searchable */
    }
  }

  if (collected.size === 0) {
    try {
      const listed = await stripe.checkout.sessions.list({
        limit: 100,
        status: "complete",
      });
      add(listed.data);
    } catch (error) {
      console.warn(
        "[mapsite-payment] Checkout session list unavailable:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return [...collected.values()];
}

async function listPaidRootOneDollarCheckoutSessionsForEmail(
  email: string,
): Promise<Stripe.Checkout.Session[]> {
  const stripe = getStripeClient();
  const collected = new Map<string, Stripe.Checkout.Session>();
  const add = (sessions: Stripe.Checkout.Session[]) => {
    for (const session of selectPaidRootOneDollarCheckoutSessionsForEmail(
      sessions,
      email,
    )) {
      collected.set(session.id, session);
    }
  };

  const escaped = email.replace(/"/g, "");
  try {
    add(await searchCheckoutSessions(stripe, `customer_details.email:"${escaped}"`));
  } catch (error) {
    console.warn(
      "[mapsite-payment] Checkout email search unavailable:",
      error instanceof Error ? error.message : error,
    );
  }

  if (collected.size === 0) {
    try {
      const listed = await stripe.checkout.sessions.list({
        limit: 100,
        status: "complete",
      });
      add(listed.data);
    } catch (error) {
      console.warn(
        "[mapsite-payment] Checkout session list unavailable:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return [...collected.values()].filter((session) =>
    isPaidRootOneDollarCheckoutSession(session),
  );
}
