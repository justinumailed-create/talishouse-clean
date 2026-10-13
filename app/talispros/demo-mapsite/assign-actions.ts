"use server";

import { revalidatePath } from "next/cache";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { accountHasAdminScope } from "@/lib/admin-constants";
import { agentCanEditMapSite, getMapSiteOwnerSession, getRegisteredMapSiteFastCode } from "@/lib/mapsite-edit-auth";
import { logAgentAudit } from "@/lib/agent-admins";
import {
  assignDemoEbookToAccount,
  normalizeAssignFastCode,
  type AssignDemoEbookActor,
  type AssignDemoEbookResult,
} from "@/lib/talispros/assign-demo-ebook";
import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";
import { pathnameForRevalidate } from "@/lib/talispros/demo-mapsite";

/**
 * Who may ASSIGN TO ACCOUNT:
 * - admins (Global Admin, or a grant with Bookshelves or Mapsites),
 * - agents holding the `ebooks` privilege for that FAST Code,
 * - the signed-in owner of the target account (assigning to themselves).
 */
async function resolveAssignActor(targetCode: string): Promise<AssignDemoEbookActor | null> {
  const account = await getAdminSessionAccount();
  if (account && account.access !== "agent" && (accountHasAdminScope(account, "talisbooks") || accountHasAdminScope(account, "mapsites"))) {
    return { kind: "admin", label: `${account.name} (${account.fastCode})` };
  }
  if (account && agentCanEditMapSite(account, targetCode, "ebooks")) {
    return { kind: "agent", label: `${account.name} (${account.fastCode}) [agent:${account.agentId ?? "?"}]` };
  }
  const owner = (await getMapSiteOwnerSession()) || null;
  const registered = (await getRegisteredMapSiteFastCode()) || null;
  if (owner === targetCode || registered === targetCode) {
    return { kind: "owner", label: `owner (${targetCode.toUpperCase()})` };
  }
  return null;
}

export async function assignDemoEbookAction(input: {
  mapsiteId: string;
  fastCode: string;
}): Promise<AssignDemoEbookResult> {
  const code = normalizeAssignFastCode(input.fastCode);
  if (!code) return { ok: false, reason: "invalid", error: "Enter a valid FAST Code." };
  const actor = await resolveAssignActor(code);
  if (!actor) {
    return {
      ok: false,
      reason: "invalid",
      error: "Sign in to that account (or as an admin / agent with eBook privilege) to assign this eBook.",
    };
  }
  const result = await assignDemoEbookToAccount({ mapsiteId: input.mapsiteId, fastCode: code, actor });
  if (result.ok) {
    if (actor.kind === "agent") {
      const account = await getAdminSessionAccount();
      if (account?.agentId) {
        await logAgentAudit(account.agentId, "agent.ebook.assign", actor.label, {
          fast_code: code,
          source_mapsite_id: input.mapsiteId,
        });
      }
    }
    revalidatePath(MAPSITE_APP_PATH);
    revalidatePath(pathnameForRevalidate(result.href));
  }
  return result;
}
