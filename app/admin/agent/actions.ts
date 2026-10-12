"use server";

import { revalidatePath } from "next/cache";
import { getAdminSessionAccount, requireAdminScope } from "@/lib/admin-auth";
import { logAgentAudit, updateAgentPage, type AgentPageInput } from "@/lib/agent-admins";
import { accountHasAdminScope, type AdminAccount, type AdminScope } from "@/lib/admin-constants";
import { agentCanEditMapSite } from "@/lib/mapsite-edit-auth";
import { parseCadAmount, parsePaidOnDate, recordManualCashPayment } from "@/lib/manual-payments";
import { grantFreePinCreditsForFastCode } from "@/lib/talispros/mapsite-additional-pins-service";
import type { AgentActionResult } from "@/app/admin/agents/actions";

/** Signed-in Agent Admin edits ONLY their own landing page (needs the Pages privilege). */
export async function updateOwnAgentPageAction(input: AgentPageInput): Promise<AgentActionResult> {
  let account;
  try {
    account = await requireAdminScope("agent-pages");
  } catch {
    return { ok: false, error: "Unauthorized" };
  }
  if (account.access !== "agent" || !account.agentId) {
    return { ok: false, error: "Only Agent Admin accounts have an agent page." };
  }
  const result = await updateAgentPage(
    account.agentId,
    input,
    `${account.name} (${account.fastCode}) [self]`,
  );
  if (!result.ok) return result;
  revalidatePath("/admin/agent");
  revalidatePath("/admin/agent/page");
  revalidatePath(`/associate/${result.agent.loginId}`);
  return { ok: true, id: account.agentId };
}

const AGENT_MAX_PINS_PER_ACTION = 25;

export type AgentWorkResult = { ok: true; message: string } | { ok: false; error: string };

/**
 * Agent work actions. Every call re-checks, server-side: an active agent
 * session, the specific privilege, and the agent's Mapsite assignment.
 * Built-in admins use the existing admin tools instead.
 */
async function requireAgentWith(
  scope: AdminScope,
  fastCode: string,
): Promise<{ account: AdminAccount & { agentId: string } } | { error: string }> {
  const account = await getAdminSessionAccount();
  if (!account || account.access !== "agent" || !account.agentId) {
    return { error: "Unauthorized." };
  }
  if (!accountHasAdminScope(account, scope)) {
    return { error: "You do not have this privilege." };
  }
  if (!fastCode) return { error: "Enter a FAST Code™." };
  if (!agentCanEditMapSite(account, fastCode, scope)) {
    return { error: "This FAST Code™ is not assigned to you." };
  }
  return { account: account as AdminAccount & { agentId: string } };
}

function agentActor(account: AdminAccount & { agentId: string }): string {
  return `${account.name} (${account.fastCode}) [agent:${account.agentId}]`;
}

/** Agent with `pins`: add free (no-Stripe) PIN credits to a Mapsite, then place them on the map. */
export async function agentAddPinsAction(input: {
  fastCode: string;
  count: number;
  note?: string | null;
}): Promise<AgentWorkResult> {
  const fastCode = String(input.fastCode ?? "").trim();
  const gate = await requireAgentWith("pins", fastCode);
  if ("error" in gate) return { ok: false, error: gate.error };
  const count = Math.trunc(Number(input.count));
  if (!Number.isFinite(count) || count < 1 || count > AGENT_MAX_PINS_PER_ACTION) {
    return { ok: false, error: `Choose 1–${AGENT_MAX_PINS_PER_ACTION} PINs.` };
  }
  const actor = agentActor(gate.account);
  const result = await grantFreePinCreditsForFastCode({
    fastCode,
    delta: count,
    grantedBy: actor,
    note: input.note,
  });
  if (!result.success || !result.snapshot) {
    return { ok: false, error: result.error || "Could not add PINs." };
  }
  const resolved = result.snapshot.fastCode.trim();
  await logAgentAudit(gate.account.agentId, "agent_pins_added", actor, {
    fast_code: resolved,
    count: result.applied ?? count,
    note: input.note?.trim() || null,
  });
  revalidatePath(`/admin/mapsites/${resolved}`);
  revalidatePath("/talispros/mapsite", "layout");
  revalidatePath(`/mapsite/${resolved.toLowerCase()}`);
  return {
    ok: true,
    message: `Added ${result.applied ?? count} PIN credit(s) to ${resolved}. Open the Mapsite to place them.`,
  };
}

/** Agent with `cash-payments`: record a cash payment (CAD) and activate the Mapsite. */
export async function agentRecordCashPaymentAction(input: {
  fastCode: string;
  amountCad: string;
  paidOn: string;
  note?: string | null;
}): Promise<AgentWorkResult> {
  const fastCode = String(input.fastCode ?? "").trim();
  const gate = await requireAgentWith("cash-payments", fastCode);
  if ("error" in gate) return { ok: false, error: gate.error };
  const amount = parseCadAmount(input.amountCad);
  if (amount === null) return { ok: false, error: "Enter a valid amount in CAD (e.g. 499.00)." };
  const paidOn = parsePaidOnDate(input.paidOn);
  if (!paidOn) return { ok: false, error: "Enter a valid payment date (not in the future)." };

  const actor = agentActor(gate.account);
  const result = await recordManualCashPayment({
    fastCode,
    amountCad: amount,
    paidOn,
    note: input.note,
    recordedBy: actor,
    agentId: gate.account.agentId,
  });
  if (!result.ok) return result;
  await logAgentAudit(gate.account.agentId, "agent_cash_payment_recorded", actor, {
    fast_code: result.payment.fastCode,
    amount_cad: amount,
    paid_on: paidOn,
    manual_payment_id: result.payment.id,
  });
  revalidatePath("/admin/agent");
  revalidatePath("/admin/agents/payments");
  revalidatePath(`/admin/mapsites/${result.payment.fastCode}`);
  revalidatePath(`/mapsite/${result.payment.fastCode.toLowerCase()}`);
  return {
    ok: true,
    message: `Recorded CA$${amount.toFixed(2)} cash for ${result.payment.fastCode}. Mapsite is active.`,
  };
}
