"use server";

import { revalidatePath } from "next/cache";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { isGlobalAdmin } from "@/lib/admin-constants";
import { flowAccess } from "@/lib/talispros/call-flow";
import { getTrackedCode } from "@/lib/talispros/fast-code-tracker-server";
import { disqualifyBrokerage, restoreBrokerage } from "@/lib/talispros/market-disqualify-server";

function refresh(code?: string | null) {
  revalidatePath("/admin/agent");
  revalidatePath("/admin/agent/review");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/mapsites");
  const normalized = code?.trim().toLowerCase();
  if (normalized) {
    revalidatePath(`/admin/agent/flow/${normalized}`);
    revalidatePath(`/talispros/home/${normalized}`);
  }
}

export async function disqualifyBrokerageAction(input: {
  fastCode?: string | null;
  prospectQueueId?: string | null;
  reason: string;
}): Promise<
  | { ok: true; market: string; qualified: number; needsNext: boolean }
  | { ok: false; error: "signin" | "forbidden" | "invalid" | "missing" | "failed" }
> {
  const account = await getAdminSessionAccount();
  const access = flowAccess(account);
  if (!account || !access) return { ok: false, error: "signin" };
  if (account.access === "agent" && account.mustChangePassword) return { ok: false, error: "forbidden" };
  if (access === "reviewer") return { ok: false, error: "forbidden" };

  const fastCode = input.fastCode?.trim().toLowerCase() || "";
  if (access === "agent") {
    if (!fastCode || !account.agentId) return { ok: false, error: "forbidden" };
    const tracked = await getTrackedCode(fastCode);
    if (!tracked || tracked.agentId !== account.agentId) return { ok: false, error: "forbidden" };
  }

  const result = await disqualifyBrokerage({
    fastCode: fastCode || null,
    prospectQueueId: input.prospectQueueId,
    reason: input.reason,
    actorName: account.name,
    actorRole: access === "admin" ? "superadmin" : "agent",
    actorId: account.agentId ?? account.fastCode ?? null,
  });
  if (!result.ok) return result;
  refresh(fastCode);
  return result;
}

export async function restoreBrokerageAction(input: {
  fastCode?: string | null;
  prospectQueueId?: string | null;
  reason?: string | null;
}): Promise<{ ok: true } | { ok: false; error: "signin" | "forbidden" | "missing" | "failed" }> {
  const account = await getAdminSessionAccount();
  if (!account) return { ok: false, error: "signin" };
  if (!isGlobalAdmin(account)) return { ok: false, error: "forbidden" };
  const result = await restoreBrokerage({
    fastCode: input.fastCode,
    prospectQueueId: input.prospectQueueId,
    reason: input.reason,
    actorName: account.name,
  });
  if (!result.ok) return result;
  refresh(input.fastCode);
  return result;
}
