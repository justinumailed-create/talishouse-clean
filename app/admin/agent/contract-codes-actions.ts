"use server";

import { getAdminSessionAccount } from "@/lib/admin-auth";
import { accountHasAdminScope, type AdminAccount } from "@/lib/admin-constants";
import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import {
  createContractAccessCode,
  listContractAccessCodes,
  revokeContractAccessCode,
  type ContractCodeSummary,
} from "@/lib/talispros/mapsite-contract-service";
import { formatContractCode } from "@/lib/talispros/mapsite-contract";

type Err = { error: string };

/** Agents (assigned Mapsites, or all when unassigned), the Global Admin, or admins with Mapsites scope. */
async function authorize(
  fastCode?: string,
): Promise<{ account: AdminAccount; actor: string; agentId: string | null } | Err> {
  const account = await getAdminSessionAccount();
  if (!account) return { error: "Please sign in again." };
  if (account.access === "agent") {
    if (!account.agentId || account.mustChangePassword) return { error: "Please sign in again." };
    const assigned = (account.assignedMapSites ?? []).map((c) => c.trim().toLowerCase());
    if (fastCode && assigned.length > 0 && !assigned.includes(fastCode)) {
      return { error: "This Mapsite is not assigned to you." };
    }
    return {
      account,
      actor: `${account.name} (${account.fastCode}) [agent:${account.agentId}]`,
      agentId: account.agentId,
    };
  }
  if (account.access === "global" || accountHasAdminScope(account, "mapsites")) {
    return { account, actor: `${account.name} (${account.fastCode}) [${account.access}]`, agentId: null };
  }
  return { error: "You do not have access to contract codes." };
}

export async function generateContractCodeAction(input: {
  fastCode: string;
  label?: string;
  days?: number;
}): Promise<{ code: string; summary: ContractCodeSummary } | Err> {
  const fastCode = String(input.fastCode || "").trim().toLowerCase();
  if (!/^[a-z0-9-]{2,32}$/.test(fastCode)) return { error: "Enter a valid FAST Code." };
  const auth = await authorize(fastCode);
  if ("error" in auth) return auth;
  const mapsite = await getMapSiteByFastCode(fastCode).catch(() => null);
  if (!mapsite) return { error: "Mapsite not found for that FAST Code." };
  const created = await createContractAccessCode({
    fastCode,
    label: input.label,
    days: input.days,
    actor: auth.actor,
    agentId: auth.agentId,
  });
  if ("error" in created) return created;
  return { code: formatContractCode(created.code), summary: created.summary };
}

export async function listContractCodesAction(): Promise<{ codes: ContractCodeSummary[] } | Err> {
  const auth = await authorize();
  if ("error" in auth) return auth;
  return { codes: await listContractAccessCodes({ agentId: auth.agentId }) };
}

export async function revokeContractCodeAction(id: string): Promise<{ ok: true } | Err> {
  const auth = await authorize();
  if ("error" in auth) return auth;
  return revokeContractAccessCode({ id: String(id || ""), actor: auth.actor, agentId: auth.agentId });
}
