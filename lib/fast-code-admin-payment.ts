import { isCompletedTalisprosPaymentStatus, normalizePaymentEmail } from "@/lib/talispros/mapsite-payment-status";

export interface FastCodePaymentMatchInput {
  code: string;
  mapsite_id?: string | null;
  request_id?: string | null;
  email?: string | null;
  emails?: Array<string | null | undefined>;
}

export interface TalisprosPaymentMatchRow {
  payment_status?: string | null;
  fast_code?: string | null;
  mapsite_id?: string | null;
  request_id?: string | null;
  email?: string | null;
  stripe_payment_intent_id?: string | null;
  stripe_checkout_session_id?: string | null;
}

export interface FastCodePaymentSummary {
  paymentSuccessful: boolean;
  stripeTransactionId: string | null;
}

function stripeTransactionId(row: TalisprosPaymentMatchRow): string | null {
  const intent = row.stripe_payment_intent_id?.trim() || "";
  if (intent) return intent;
  const session = row.stripe_checkout_session_id?.trim() || "";
  return session || null;
}

function paymentMatchesCode(
  code: FastCodePaymentMatchInput,
  payment: TalisprosPaymentMatchRow,
): boolean {
  const paymentCode = payment.fast_code?.trim().toLowerCase() || "";
  const rowCode = code.code.trim().toLowerCase();
  if (paymentCode && rowCode && paymentCode === rowCode) return true;

  const mapsiteId = code.mapsite_id?.trim() || "";
  if (mapsiteId && payment.mapsite_id?.trim() === mapsiteId) return true;

  const requestId = code.request_id?.trim() || "";
  if (requestId && payment.request_id?.trim() === requestId) return true;

  const paymentEmail = normalizePaymentEmail(payment.email);
  if (paymentEmail) {
    const emails = new Set(
      [code.email, ...(code.emails ?? [])]
        .map((value) => normalizePaymentEmail(value))
        .filter((value): value is string => Boolean(value)),
    );
    if (emails.has(paymentEmail)) return true;
  }

  return false;
}

/** Paid unlock for delete protection — FAST code or Mapsite™ id only (not email). */
export function paymentProtectsMapSiteFromDelete(
  mapsite: { id?: string | null; fastCode: string },
  payments: TalisprosPaymentMatchRow[],
): boolean {
  const mapsiteId = mapsite.id?.trim() || "";
  const code = mapsite.fastCode.trim().toLowerCase();
  return payments.some((payment) => {
    if (!isCompletedTalisprosPaymentStatus(payment.payment_status)) return false;
    if (mapsiteId && payment.mapsite_id?.trim() === mapsiteId) return true;
    const paymentCode = payment.fast_code?.trim().toLowerCase() || "";
    return Boolean(code && paymentCode && paymentCode === code);
  });
}

export function summarizeFastCodePayment(
  code: FastCodePaymentMatchInput,
  payments: TalisprosPaymentMatchRow[],
): FastCodePaymentSummary {
  const matches = payments.filter(
    (payment) =>
      isCompletedTalisprosPaymentStatus(payment.payment_status) &&
      paymentMatchesCode(code, payment),
  );
  if (matches.length === 0) {
    return { paymentSuccessful: false, stripeTransactionId: null };
  }

  const withIntent = matches.find((row) => row.stripe_payment_intent_id?.trim());
  const chosen = withIntent || matches[0]!;
  return {
    paymentSuccessful: true,
    stripeTransactionId: stripeTransactionId(chosen),
  };
}

export function attachFastCodePayments<T extends FastCodePaymentMatchInput>(
  codes: T[],
  payments: TalisprosPaymentMatchRow[],
): Array<T & FastCodePaymentSummary> {
  return codes.map((code) => ({
    ...code,
    ...summarizeFastCodePayment(code, payments),
  }));
}
