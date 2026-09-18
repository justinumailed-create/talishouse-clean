import { isPlanType, PLAN_DETAILS } from "@/lib/registration-plans";
import { tierFromAccountType } from "@/lib/registration-fast-code-routing";
import { isCompletedTalisprosPaymentStatus } from "@/lib/talispros/mapsite-payment-status";

export type AdminRegistrationSource = "registrations" | "talispros_payment";

export type AdminRegistrationRow = {
  id: string;
  source: AdminRegistrationSource;
  email: string;
  account_type: string;
  fast_code: string;
  amount_paid: number;
  registration_number: string;
  status: string;
  created_at: string;
  markable: boolean;
};

export type TalisprosPaymentRegistrationInput = {
  id: string;
  email?: string | null;
  plan_type?: string | null;
  payment_status?: string | null;
  fast_code?: string | null;
  mapsite_id?: string | null;
  paypal_order_id?: string | null;
  paypal_capture_id?: string | null;
  stripe_payment_intent_id?: string | null;
  stripe_checkout_session_id?: string | null;
  created_at?: string | null;
};

function accountTypeFromPlan(planType: string | null | undefined): string {
  const tier = tierFromAccountType(planType);
  if (tier === "root") return "Root Account™";
  if (tier === "derivative") return "Derivative Account™";
  if (tier === "adpro") return "Adpro";
  return planType?.trim() || "Root Account™";
}

function amountFromPlan(planType: string | null | undefined): number {
  if (planType && isPlanType(planType)) {
    return PLAN_DETAILS[planType].price;
  }
  return PLAN_DETAILS.ROOT_ACCOUNT.price;
}

function registrationNumberFromPayment(
  payment: TalisprosPaymentRegistrationInput,
): string {
  return (
    payment.stripe_payment_intent_id?.trim() ||
    payment.stripe_checkout_session_id?.trim() ||
    payment.paypal_capture_id?.trim() ||
    payment.paypal_order_id?.trim() ||
    payment.id
  );
}

export function adminRegistrationFromTalisprosPayment(
  payment: TalisprosPaymentRegistrationInput,
  mapsiteFastCode?: string | null,
): AdminRegistrationRow {
  const completed = isCompletedTalisprosPaymentStatus(payment.payment_status);
  const fastCode =
    payment.fast_code?.trim() || mapsiteFastCode?.trim() || "";
  return {
    id: payment.id,
    source: "talispros_payment",
    email: payment.email?.trim() || "",
    account_type: accountTypeFromPlan(payment.plan_type),
    fast_code: fastCode,
    amount_paid: amountFromPlan(payment.plan_type),
    registration_number: registrationNumberFromPayment(payment),
    status: completed ? "completed" : "pending",
    created_at: payment.created_at || new Date(0).toISOString(),
    markable: false,
  };
}

export function mergeAdminRegistrationRows(
  legacy: AdminRegistrationRow[],
  payments: AdminRegistrationRow[],
): AdminRegistrationRow[] {
  const seen = new Set<string>();
  const merged: AdminRegistrationRow[] = [];

  const keyFor = (row: AdminRegistrationRow) => {
    const code = row.fast_code.trim().toLowerCase();
    const email = row.email.trim().toLowerCase();
    if (code) return `code:${code}`;
    if (email) return `email:${email}`;
    return `id:${row.id}`;
  };

  for (const row of [...payments, ...legacy]) {
    const key = keyFor(row);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
  }

  return merged.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}
