import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { tryGetSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { hasProspectAccess } from "@/lib/talispros/prospect-gate-server";
import {
  isSystemFastCodeActor,
  restrictSystemFastCodeFeatures,
} from "@/lib/talispros/system-fast-code-gate";

export type SystemFastCodeFacts = {
  systemGenerated: boolean;
  registeredOrClaimed: boolean;
  /** Short non-secret trace for the personal-home data attribute. */
  trace: string;
};

const PLACEHOLDER_CLAIM_EMAIL = "claim@talispros.com";

/**
 * Database facts for a FAST Code. Does not read the visitor session.
 * System-generated means the daily job or the system slot seed created it.
 */
const COMPLETED_PAYMENT = new Set(["completed", "paid", "complete", "succeeded"]);

/**
 * Payment on this FAST Code or its Mapsite row only.
 * Do not use the shared activation helper: system codes are stored with the
 * placeholder inbox claim@talispros.com, and that helper treats any completed
 * payment on the inbox as this code's payment.
 */
function db(): SupabaseClient {
  return (tryGetSupabaseAdmin() ?? supabase) as unknown as SupabaseClient;
}

async function hasOwnActivationPayment(
  code: string,
  mapsiteId: string | null,
): Promise<boolean> {
  const client = db();
  const lookups = [
    client.from("talispros_payments").select("payment_status").ilike("fast_code", code).limit(10),
  ];
  if (mapsiteId) {
    lookups.push(
      client
        .from("talispros_payments")
        .select("payment_status")
        .eq("mapsite_id", mapsiteId)
        .limit(10),
    );
  }
  const results = await Promise.all(lookups);
  for (const result of results) {
    for (const row of (result.data ?? []) as { payment_status?: string | null }[]) {
      if (COMPLETED_PAYMENT.has((row.payment_status || "").trim().toLowerCase())) return true;
    }
  }
  return false;
}

export async function readSystemFastCodeFacts(rawCode: string): Promise<SystemFastCodeFacts> {
  const code = rawCode.trim().toLowerCase();
  if (!code || (!tryGetSupabaseAdmin() && !isSupabaseConfigured)) {
    return { systemGenerated: false, registeredOrClaimed: false, trace: "no-admin" };
  }

  const client = db();
  const [status, assigned, mapsite, codeRow, registration] = await Promise.all([
    client.from("fast_code_status").select("fast_code").eq("fast_code", code).maybeSingle(),
    client
      .from("fast_code_updates")
      .select("created_by")
      .eq("fast_code", code)
      .eq("event_type", "assigned")
      .limit(8),
    client.from("mapsites").select("id, account_id, email").ilike("fast_code", code).limit(1).maybeSingle(),
    client.from("fast_codes").select("request_id").ilike("code", code).maybeSingle(),
    client.from("fast_code_registrations").select("id").ilike("fast_code", code).limit(1),
  ]);
  const mapsiteRowEarly = mapsite.data as {
    id?: string;
    account_id?: string | null;
    email?: string | null;
  } | null;
  const paid = await hasOwnActivationPayment(code, mapsiteRowEarly?.id ?? null);

  const mapsiteRow = mapsiteRowEarly;
  let prepared = false;
  if (mapsiteRow?.id) {
    const { count } = await client
      .from("agent_fast_code_slots")
      .select("id", { count: "exact", head: true })
      .eq("mapsite_id", mapsiteRow.id);
    prepared = (count ?? 0) > 0;
  }

  const assignedBySystem = ((assigned.data ?? []) as { created_by: string | null }[]).some((row) =>
    isSystemFastCodeActor(row.created_by),
  );
  const registeredRow = (codeRow.data as { request_id?: string | null } | null)?.request_id;
  const registrationHit = Array.isArray(registration.data) && registration.data.length > 0;
  const placeholderInbox = (mapsiteRow?.email || "").trim().toLowerCase() === PLACEHOLDER_CLAIM_EMAIL;
  const registeredOrClaimed = Boolean(
    paid || mapsiteRow?.account_id || registeredRow || registrationHit,
  );
  const note = (error: { message?: string } | null | undefined) =>
    error?.message ? error.message.replace(/\s+/g, " ").slice(0, 80) : "";
  const trace = [
    status.data ? "status" : "no-status",
    assignedBySystem ? "assigned" : "no-assigned",
    prepared ? "slot" : "no-slot",
    placeholderInbox ? "placeholder" : "no-placeholder",
    registeredOrClaimed ? "claimed" : "open",
    note(status.error),
    note(assigned.error),
    note(mapsite.error),
    note(codeRow.error),
    note(registration.error),
  ]
    .filter(Boolean)
    .join("|");

  return {
    systemGenerated:
      Boolean(status.data) ||
      assignedBySystem ||
      prepared ||
      (placeholderInbox && !registeredOrClaimed),
    registeredOrClaimed,
    trace,
  };
}

/**
 * True when this visitor must not receive owner, dashboard, PIN, or editor
 * access for the code. Agents and registered or claimed owners are false.
 */
export async function isPublicSystemFastCode(
  rawCode: string,
  options?: { registeredOwner?: boolean },
): Promise<boolean> {
  const code = rawCode.trim().toLowerCase();
  if (!code) return false;
  const [facts, agentAccess] = await Promise.all([
    readSystemFastCodeFacts(code),
    hasProspectAccess().catch(() => false),
  ]);
  return restrictSystemFastCodeFeatures({
    systemGenerated: facts.systemGenerated,
    registeredOrClaimed: facts.registeredOrClaimed || Boolean(options?.registeredOwner),
    agentAccess,
  });
}
