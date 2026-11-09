import "server-only";

import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { hasCompletedMapSiteActivationPayment } from "@/lib/talispros/mapsite-payment";
import { hasProspectAccess } from "@/lib/talispros/prospect-gate-server";
import {
  isSystemFastCodeActor,
  restrictSystemFastCodeFeatures,
} from "@/lib/talispros/system-fast-code-gate";

export type SystemFastCodeFacts = {
  systemGenerated: boolean;
  registeredOrClaimed: boolean;
};

/**
 * Database facts for a FAST Code. Does not read the visitor session.
 * System-generated means the daily job or the system slot seed created it.
 */
export async function readSystemFastCodeFacts(rawCode: string): Promise<SystemFastCodeFacts> {
  const code = rawCode.trim().toLowerCase();
  if (!code || !isSupabaseAdminConfigured()) {
    return { systemGenerated: false, registeredOrClaimed: false };
  }

  const db = getSupabaseAdmin();
  const [status, assigned, mapsite, codeRow, registration, paid] = await Promise.all([
    db.from("fast_code_status").select("fast_code").eq("fast_code", code).maybeSingle(),
    db
      .from("fast_code_updates")
      .select("created_by")
      .eq("fast_code", code)
      .eq("event_type", "assigned")
      .limit(8),
    db.from("mapsites").select("id, account_id").ilike("fast_code", code).limit(1).maybeSingle(),
    db.from("fast_codes").select("request_id").ilike("code", code).maybeSingle(),
    db.from("fast_code_registrations").select("id").ilike("fast_code", code).limit(1),
    hasCompletedMapSiteActivationPayment({
      fastCode: code,
      reconcileFromStripe: false,
    }).catch(() => false),
  ]);

  const mapsiteRow = mapsite.data as { id?: string; account_id?: string | null } | null;
  let prepared = false;
  if (mapsiteRow?.id) {
    const { count } = await db
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

  return {
    systemGenerated: Boolean(status.data) || assignedBySystem || prepared,
    registeredOrClaimed: Boolean(paid || mapsiteRow?.account_id || registeredRow || registrationHit),
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
