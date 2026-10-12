"use server";

import { revalidatePath } from "next/cache";
import { requireAdminScope } from "@/lib/admin-auth";
import type { AdminAccount } from "@/lib/admin-constants";
import {
  createAgent,
  generateTemporaryPassword,
  setAgentPassword,
  setAgentStatus,
  updateAgent,
  updateAgentPage,
  type AgentInput,
  type AgentPageInput,
  type AgentStatus,
} from "@/lib/agent-admins";
import { reverseManualCashPayment } from "@/lib/manual-payments";

export type AgentActionResult = { ok: true; id?: string } | { ok: false; error: string };

/** Only hardcoded full/superadmin accounts hold `agents`; agents never can. */
async function requireAgentManager(): Promise<AdminAccount | null> {
  try {
    const account = await requireAdminScope("agents");
    return account.access === "agent" ? null : account;
  } catch {
    return null;
  }
}

function actorLabel(account: AdminAccount): string {
  return `${account.name} (${account.fastCode})`;
}

function revalidateAgents(id?: string) {
  revalidatePath("/admin/agents");
  if (id) {
    revalidatePath(`/admin/agents/${id}`);
    revalidatePath(`/admin/agents/${id}/preview`);
  }
}

export async function createAgentAction(input: AgentInput): Promise<AgentActionResult> {
  const account = await requireAgentManager();
  if (!account) return { ok: false, error: "Unauthorized" };
  const result = await createAgent(input, actorLabel(account));
  if (!result.ok) return result;
  revalidateAgents(result.agent.id);
  return { ok: true, id: result.agent.id };
}

export async function updateAgentAction(id: string, input: AgentInput): Promise<AgentActionResult> {
  const account = await requireAgentManager();
  if (!account) return { ok: false, error: "Unauthorized" };
  const result = await updateAgent(id, input, actorLabel(account));
  if (!result.ok) return result;
  revalidateAgents(id);
  return { ok: true, id };
}

export async function setAgentStatusAction(id: string, status: AgentStatus): Promise<AgentActionResult> {
  const account = await requireAgentManager();
  if (!account) return { ok: false, error: "Unauthorized" };
  const result = await setAgentStatus(id, status === "disabled" ? "disabled" : "active", actorLabel(account));
  if (!result.ok) return result;
  revalidateAgents(id);
  return { ok: true, id };
}

export async function updateAgentPageAsManagerAction(
  id: string,
  input: AgentPageInput,
): Promise<AgentActionResult> {
  const account = await requireAgentManager();
  if (!account) return { ok: false, error: "Unauthorized" };
  const result = await updateAgentPage(id, input, actorLabel(account));
  if (!result.ok) return result;
  revalidateAgents(id);
  revalidatePath(`/associate/${result.agent.loginId}`);
  return { ok: true, id };
}

/**
 * Set or reset an agent's password. Empty input generates a strong temporary
 * password, returned ONCE to the superadmin's browser (never logged/stored in
 * plaintext). The agent must change it at next login; existing sessions end.
 */
export async function setAgentPasswordAction(
  id: string,
  password: string | null,
): Promise<{ ok: true; temporaryPassword: string | null } | { ok: false; error: string }> {
  const account = await requireAgentManager();
  if (!account) return { ok: false, error: "Unauthorized" };
  const chosen = password && password.length > 0 ? password : generateTemporaryPassword();
  const result = await setAgentPassword(id, chosen, actorLabel(account));
  if (!result.ok) return result;
  revalidateAgents(id);
  return { ok: true, temporaryPassword: password ? null : chosen };
}

/** Superadmin/full only: reverse a recorded cash payment (audit-logged). */
export async function reverseCashPaymentAction(input: {
  paymentId: string;
  note?: string | null;
}): Promise<AgentActionResult> {
  const account = await requireAgentManager();
  if (!account) return { ok: false, error: "Unauthorized" };
  const id = String(input.paymentId ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: "Invalid payment." };
  const result = await reverseManualCashPayment({
    paymentId: id,
    reversedBy: actorLabel(account),
    note: input.note,
  });
  if (!result.ok) return result;
  revalidatePath("/admin/agents/payments");
  revalidatePath("/admin/mapsites");
  return { ok: true, id };
}
