/**
 * Trace recent ~$1 Root Mapsite™ Stripe Checkout sessions against
 * talispros_payments / mapsites / build_requests.
 *
 * This environment cannot read live Stripe. Run with production keys:
 *
 *   STRIPE_SECRET_KEY=sk_live_... \
 *   NEXT_PUBLIC_SUPABASE_URL=https://....supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx tsx scripts/trace-stripe-mapsite-root-payment.ts --email rememcom@mac.com
 *
 * After identifying the session (cs_…), heal that Mapsite™ only:
 *
 *   npx tsx scripts/trace-stripe-mapsite-root-payment.ts --activate-session cs_...
 *
 * Dry-run is the default. Does not mark unpaid users paid. Skips the platform
 * demo Mapsite™ id. Ralf Meyer’s checkout email is rememcom@mac.com (not ralf@).
 */
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { DEMO_MAPSITE_ID } from "../lib/talispros/mapsite-state";
import {
  RALF_ROOT_PAYMENT_EMAIL,
  checkoutSessionCustomerEmail,
  checkoutSessionPlanType,
  isPaidRootOneDollarCheckoutSession,
} from "../lib/talispros/stripe-root-checkout-match";
import { stripeMapSiteIdFromCheckoutSession } from "../lib/talispros/stripe-mapsite-session";
import { isCompletedTalisprosPaymentStatus } from "../lib/talispros/mapsite-payment-status";

type Args = {
  email: string | null;
  activateSessionId: string | null;
};

function parseArgs(argv: string[]): Args {
  let email: string | null = RALF_ROOT_PAYMENT_EMAIL;
  let activateSessionId: string | null = null;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--email") {
      email = argv[i + 1]?.trim() || null;
      i += 1;
    } else if (arg === "--all-root-1") {
      email = null;
    } else if (arg === "--activate-session") {
      activateSessionId = argv[i + 1]?.trim() || null;
      i += 1;
    }
  }
  return { email, activateSessionId };
}

function requireStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("Set STRIPE_SECRET_KEY to list live Checkout sessions.");
  }
  return new Stripe(key);
}

function optionalSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function sessionSummary(session: Stripe.Checkout.Session) {
  return {
    id: session.id,
    created: session.created
      ? new Date(session.created * 1000).toISOString()
      : null,
    payment_status: session.payment_status,
    status: session.status,
    amount_total: session.amount_total,
    currency: session.currency,
    email: checkoutSessionCustomerEmail(session),
    planType: checkoutSessionPlanType(session) || null,
    mapsiteId: stripeMapSiteIdFromCheckoutSession(session),
    requestId: session.metadata?.requestId || null,
    fastCode: session.metadata?.fastCode || null,
    payment_intent:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null,
  };
}

async function lookupDb(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session,
) {
  const summary = sessionSummary(session);
  const paymentBySession = summary.id
    ? await supabase
        .from("talispros_payments")
        .select(
          "id, email, plan_type, payment_status, mapsite_id, request_id, fast_code, stripe_checkout_session_id",
        )
        .eq("stripe_checkout_session_id", summary.id)
        .maybeSingle()
    : { data: null, error: null };

  const mapsiteId = summary.mapsiteId;
  const mapsite = mapsiteId
    ? await supabase
        .from("mapsites")
        .select("id, email, fast_code, status, interest_form_enabled")
        .eq("id", mapsiteId)
        .maybeSingle()
    : { data: null, error: null };

  const email = summary.email;
  const mapsitesByEmail = email
    ? await supabase
        .from("mapsites")
        .select("id, email, fast_code, status")
        .ilike("email", email)
        .order("updated_at", { ascending: false })
        .limit(5)
    : { data: [], error: null };

  const requestId = summary.requestId;
  const buildRequest = requestId
    ? await supabase
        .from("build_requests")
        .select(
          "id, email, linked_mapsite_id, requested_fast_code, status, approval_status, activated_at",
        )
        .eq("id", requestId)
        .maybeSingle()
    : { data: null, error: null };

  const paymentRow = paymentBySession.data as {
    payment_status?: string | null;
    mapsite_id?: string | null;
  } | null;
  const mapsiteRow = mapsite.data as {
    status?: string | null;
    fast_code?: string | null;
  } | null;

  return {
    payment: paymentBySession.data,
    mapsite: mapsite.data,
    mapsitesByEmail: mapsitesByEmail.data,
    buildRequest: buildRequest.data,
    unlocked:
      isCompletedTalisprosPaymentStatus(paymentRow?.payment_status) &&
      Boolean(paymentRow?.mapsite_id || mapsiteRow?.status),
    mapsiteActive: (mapsiteRow?.status || "").toLowerCase() === "active",
    paymentCompleted: isCompletedTalisprosPaymentStatus(paymentRow?.payment_status),
  };
}

async function activateSession(
  stripe: Stripe,
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!isPaidRootOneDollarCheckoutSession(session)) {
    throw new Error(
      `${sessionId} is not a paid ~$1 ROOT_ACCOUNT_1 Checkout session.`,
    );
  }
  const mapsiteId = stripeMapSiteIdFromCheckoutSession(session);
  if (!mapsiteId) {
    throw new Error(`${sessionId} has no mapSiteId / client_reference_id.`);
  }
  if (mapsiteId === DEMO_MAPSITE_ID) {
    throw new Error("Refusing to activate the platform demo Mapsite™.");
  }

  const email =
    checkoutSessionCustomerEmail(session) ||
    session.metadata?.email ||
    "";
  const requestId = session.metadata?.requestId?.trim() || null;
  const fastCode = session.metadata?.fastCode?.trim() || null;
  const planType = checkoutSessionPlanType(session) || "ROOT_ACCOUNT_1";
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;

  const { data: existing } = await supabase
    .from("talispros_payments")
    .select("id")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  const paymentPatch = {
    email: email.toLowerCase(),
    plan_type: planType,
    payment_provider: "stripe",
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntent,
    payment_status: "completed",
    mapsite_id: mapsiteId,
    request_id: requestId,
    fast_code: fastCode,
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("talispros_payments")
      .update(paymentPatch)
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("talispros_payments").insert(paymentPatch);
    if (error) {
      const { mapsite_id: _omitMap, request_id: _omitReq, fast_code: _omitFast, ...legacy } =
        paymentPatch;
      const retry = await supabase.from("talispros_payments").insert(legacy);
      if (retry.error) throw new Error(retry.error.message);
    }
  }

  const mapsiteUpdate = await supabase
    .from("mapsites")
    .update({ status: "active", interest_form_enabled: true })
    .eq("id", mapsiteId);
  if (mapsiteUpdate.error) throw new Error(mapsiteUpdate.error.message);

  if (requestId) {
    const requestUpdate = await supabase
      .from("build_requests")
      .update({
        status: "Mapsite™ Active",
        approval_status: "Approved",
        activated_at: new Date().toISOString(),
        linked_mapsite_id: mapsiteId,
      })
      .eq("id", requestId);
    if (requestUpdate.error) throw new Error(requestUpdate.error.message);
  }

  return { session: sessionSummary(session), mapsiteId, requestId, fastCode };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const stripe = requireStripe();
  const supabase = optionalSupabase();

  if (args.activateSessionId) {
    if (!supabase) {
      throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to heal.");
    }
    const result = await activateSession(stripe, supabase, args.activateSessionId);
    console.log(JSON.stringify({ healed: true, ...result }, null, 2));
    return;
  }

  const listed = await stripe.checkout.sessions.list({
    limit: 100,
    status: "complete",
  });
  const recentRoot = listed.data.filter((session) => {
    if (!isPaidRootOneDollarCheckoutSession(session)) return false;
    if (!args.email) return true;
    const sessionEmail = checkoutSessionCustomerEmail(session);
    return sessionEmail === args.email.toLowerCase();
  });

  const rows = [];
  for (const session of recentRoot) {
    const summary = sessionSummary(session);
    const db = supabase ? await lookupDb(supabase, session) : null;
    rows.push({ stripe: summary, db });
  }

  console.log(
    JSON.stringify(
      {
        filterEmail: args.email,
        ralfEmail: RALF_ROOT_PAYMENT_EMAIL,
        listed: listed.data.length,
        matchedRootOneDollar: rows.length,
        note:
          rows.length === 0
            ? "No matching paid ~$1 Root sessions in the last 100 complete Checkouts. Confirm live-mode STRIPE_SECRET_KEY and that the charge is Checkout (not a PaymentIntent-only)."
            : "Most recent matching session is rows[0]. If db.paymentCompleted is false, Mapsite paid chrome is still locked on production until webhook/return/heal.",
        rows,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
