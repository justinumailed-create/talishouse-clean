import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { planTypeForClaimAccountType } from "@/lib/registration-plans";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { ensureMapSiteActiveAfterPayment } from "@/lib/talispros/mapsite-activation";

/**
 * Manual (cash, CAD) FAST Code activation payments.
 * Recording one inserts a completed `talispros_payments` row (provider `cash`)
 * and activates the Mapsite through the same step Stripe/PayPal use.
 * Reversal (superadmin only) marks both rows reversed and restores the
 * Mapsite's previous status. Every write is audit-logged in activity_logs.
 */

export const MANUAL_PAYMENT_AUDIT_TABLE = "manual_payments";
export const MANUAL_PAYMENT_MAX_CAD = 99999.99;

export type ManualPaymentStatus = "recorded" | "reversed";

export interface ManualPaymentRecord {
  id: string;
  mapsiteId: string;
  fastCode: string;
  amountCad: number;
  method: "cash";
  paidOn: string;
  note: string | null;
  recordedBy: string;
  recordedByAgentId: string | null;
  status: ManualPaymentStatus;
  reversedBy: string | null;
  reversedAt: string | null;
  reversalNote: string | null;
  createdAt: string;
}

type Row = {
  id: string;
  mapsite_id: string;
  fast_code: string;
  amount_cad: number | string;
  method: string;
  paid_on: string;
  note: string | null;
  recorded_by: string;
  recorded_by_agent_id: string | null;
  talispros_payment_id: string | null;
  previous_mapsite_status: string | null;
  status: string;
  reversed_by: string | null;
  reversed_at: string | null;
  reversal_note: string | null;
  created_at: string;
};

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

function toRecord(row: Row): ManualPaymentRecord {
  return {
    id: row.id,
    mapsiteId: row.mapsite_id,
    fastCode: row.fast_code,
    amountCad: Number(row.amount_cad),
    method: "cash",
    paidOn: row.paid_on,
    note: row.note,
    recordedBy: row.recorded_by,
    recordedByAgentId: row.recorded_by_agent_id,
    status: row.status === "reversed" ? "reversed" : "recorded",
    reversedBy: row.reversed_by,
    reversedAt: row.reversed_at,
    reversalNote: row.reversal_note,
    createdAt: row.created_at,
  };
}

/** Parse "123", "123.4", "1,234.50" → cents-precise number, or null. */
export function parseCadAmount(raw: unknown): number | null {
  const text = String(raw ?? "").replace(/[,$\s]/g, "").replace(/CAD$/i, "");
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(text)) return null;
  const value = Math.round(Number(text) * 100) / 100;
  if (!(value > 0) || value > MANUAL_PAYMENT_MAX_CAD) return null;
  return value;
}

/** YYYY-MM-DD, not in the future (1 day slack for timezones), not before 2020. */
export function parsePaidOnDate(raw: unknown, now = new Date()): string | null {
  const text = String(raw ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const time = Date.parse(`${text}T00:00:00Z`);
  if (Number.isNaN(time)) return null;
  if (time > now.getTime() + 36 * 3600 * 1000) return null;
  if (time < Date.parse("2020-01-01T00:00:00Z")) return null;
  return text;
}

async function audit(input: {
  paymentId: string;
  action: string;
  performedBy: string;
  details: Record<string, unknown>;
}) {
  try {
    await db().from("activity_logs").insert({
      table_name: MANUAL_PAYMENT_AUDIT_TABLE,
      record_id: input.paymentId,
      action: input.action,
      performed_by: input.performedBy,
      details: input.details,
    });
  } catch (error) {
    console.warn("[manual-payments] audit log failed:", error);
  }
}

export async function listManualPayments(options: {
  limit?: number;
  agentId?: string | null;
} = {}): Promise<ManualPaymentRecord[]> {
  let query = db()
    .from("manual_payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 50);
  if (options.agentId) query = query.eq("recorded_by_agent_id", options.agentId);
  const { data, error } = await query;
  if (error) {
    console.warn("[manual-payments] list failed:", error.message);
    return [];
  }
  return ((data ?? []) as Row[]).map(toRecord);
}

export type RecordManualPaymentResult =
  | { ok: true; payment: ManualPaymentRecord; alreadyActive: boolean }
  | { ok: false; error: string };

export async function recordManualCashPayment(input: {
  fastCode: string;
  amountCad: number;
  paidOn: string;
  note?: string | null;
  recordedBy: string;
  agentId?: string | null;
}): Promise<RecordManualPaymentResult> {
  const code = input.fastCode.trim();
  if (!code) return { ok: false, error: "Enter a FAST Code™." };
  const client = db();

  const { data: mapsite } = await client
    .from("mapsites")
    .select("id, fast_code, status, email, is_demonstration")
    .ilike("fast_code", code)
    .maybeSingle();
  if (!mapsite?.id) return { ok: false, error: "No Mapsite found for that FAST Code™." };
  if (mapsite.is_demonstration) {
    return { ok: false, error: "Demonstration Mapsites cannot be marked paid." };
  }

  const { data: existing } = await client
    .from("manual_payments")
    .select("id")
    .eq("mapsite_id", mapsite.id)
    .eq("status", "recorded")
    .limit(1);
  if (existing && existing.length > 0) {
    return { ok: false, error: "A cash payment is already recorded for this FAST Code™. Ask a superadmin to reverse it first." };
  }

  const { data: request } = await client
    .from("build_requests")
    .select("id, email, requested_account_type, account_type")
    .eq("linked_mapsite_id", mapsite.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const fastCode = String(mapsite.fast_code || code).trim();
  const email =
    String(request?.email || mapsite.email || "").trim() ||
    `cash+${fastCode.toLowerCase()}@payments.talishouse.invalid`;
  const accountType = String(request?.requested_account_type || request?.account_type || "");
  const planType = accountType ? planTypeForClaimAccountType(accountType) : "ROOT_ACCOUNT";

  const { data: payment, error: paymentError } = await client
    .from("talispros_payments")
    .insert({
      email,
      plan_type: planType,
      payment_status: "completed",
      payment_provider: "cash",
      mapsite_id: mapsite.id,
      request_id: request?.id ?? null,
      fast_code: fastCode,
    })
    .select("id")
    .single();
  if (paymentError || !payment?.id) {
    console.error("[manual-payments] talispros_payments insert failed:", paymentError?.message);
    return { ok: false, error: "Could not record the payment." };
  }

  const { data: manual, error: manualError } = await client
    .from("manual_payments")
    .insert({
      mapsite_id: mapsite.id,
      fast_code: fastCode,
      amount_cad: input.amountCad,
      method: "cash",
      paid_on: input.paidOn,
      note: input.note?.trim() || null,
      recorded_by: input.recordedBy,
      recorded_by_agent_id: input.agentId ?? null,
      talispros_payment_id: payment.id,
      previous_mapsite_status: mapsite.status ?? null,
    })
    .select("*")
    .single();
  if (manualError || !manual) {
    console.error("[manual-payments] manual_payments insert failed:", manualError?.message);
    await client.from("talispros_payments").update({ payment_status: "failed" }).eq("id", payment.id);
    return { ok: false, error: "Could not record the payment." };
  }

  await ensureMapSiteActiveAfterPayment({
    mapsiteId: mapsite.id,
    requestId: request?.id ?? null,
    accountType,
    fastCode,
  });

  const record = toRecord(manual as Row);
  await audit({
    paymentId: record.id,
    action: "cash_payment_recorded",
    performedBy: input.recordedBy,
    details: {
      fast_code: fastCode,
      mapsite_id: mapsite.id,
      amount_cad: record.amountCad,
      method: "cash",
      paid_on: record.paidOn,
      note: record.note,
      agent_id: input.agentId ?? null,
      talispros_payment_id: payment.id,
      previous_mapsite_status: mapsite.status ?? null,
    },
  });
  return { ok: true, payment: record, alreadyActive: mapsite.status === "active" };
}

export async function reverseManualCashPayment(input: {
  paymentId: string;
  reversedBy: string;
  note?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = db();
  const { data: row } = await client
    .from("manual_payments")
    .select("*")
    .eq("id", input.paymentId)
    .maybeSingle();
  if (!row) return { ok: false, error: "Payment not found." };
  const payment = row as Row;
  if (payment.status === "reversed") return { ok: false, error: "Already reversed." };

  const now = new Date().toISOString();
  const { error } = await client
    .from("manual_payments")
    .update({
      status: "reversed",
      reversed_by: input.reversedBy,
      reversed_at: now,
      reversal_note: input.note?.trim() || null,
    })
    .eq("id", payment.id)
    .eq("status", "recorded");
  if (error) return { ok: false, error: "Could not reverse the payment." };

  if (payment.talispros_payment_id) {
    await client
      .from("talispros_payments")
      .update({ payment_status: "reversed" })
      .eq("id", payment.talispros_payment_id);
  }
  const restoreStatus = payment.previous_mapsite_status;
  if (restoreStatus && restoreStatus !== "active") {
    await client.from("mapsites").update({ status: restoreStatus }).eq("id", payment.mapsite_id);
  }

  await audit({
    paymentId: payment.id,
    action: "cash_payment_reversed",
    performedBy: input.reversedBy,
    details: {
      fast_code: payment.fast_code,
      amount_cad: Number(payment.amount_cad),
      recorded_by: payment.recorded_by,
      recorded_by_agent_id: payment.recorded_by_agent_id,
      restored_mapsite_status: restoreStatus,
      note: input.note?.trim() || null,
    },
  });
  return { ok: true };
}
