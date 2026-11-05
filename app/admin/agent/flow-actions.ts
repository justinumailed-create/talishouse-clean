"use server";

import { revalidatePath } from "next/cache";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { flowAccess } from "@/lib/talispros/call-flow";
import { saveCheckpointComment, saveLeadDetails, saveStepResponse, type FlowActor } from "@/lib/talispros/call-flow-server";

async function actor(): Promise<FlowActor | null> {
  const account = await getAdminSessionAccount();
  const access = flowAccess(account);
  if (!account || !access) return null;
  if (account.access === "agent" && account.mustChangePassword) return null;
  return { access, agentId: account.agentId ?? null, name: account.name };
}

function refresh(code: string) {
  revalidatePath("/admin/agent");
  revalidatePath("/admin/agent/review");
  revalidatePath(`/admin/agent/flow/${code}`);
  revalidatePath("/admin/dashboard");
}

export async function saveLeadAction(input: {
  code: string;
  decisionMakerName: string;
  position: string;
  cellPhone: string;
  email: string;
  brokerageName: string;
  brokerageWebsite: string;
  brokerageAddress: string;
  officePhone: string;
  country: string;
  market: string;
  town: string;
  agentCount: string;
  source: string;
  notes: string;
}): Promise<{ ok: true } | { ok: false; error: "signin" | "forbidden" | "invalid" | "failed" }> {
  const me = await actor();
  if (!me) return { ok: false, error: "signin" };
  const result = await saveLeadDetails(input.code, me, input);
  if (result.ok) refresh(input.code.toLowerCase());
  return result;
}

export async function saveStepAction(input: {
  code: string;
  step: string;
  outcome: string;
  response: string;
}): Promise<{ ok: true } | { ok: false; error: "signin" | "forbidden" | "locked" | "invalid" | "failed" }> {
  const me = await actor();
  if (!me) return { ok: false, error: "signin" };
  const result = await saveStepResponse(input.code, me, input.step, input.outcome, input.response);
  if (result.ok) refresh(input.code.toLowerCase());
  return result;
}

export async function saveCheckpointCommentAction(input: {
  code: string;
  checkpoint: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: "signin" | "forbidden" | "invalid" | "failed" }> {
  const me = await actor();
  if (!me) return { ok: false, error: "signin" };
  const result = await saveCheckpointComment(input.code, me, input.checkpoint, input.body);
  if (result.ok) refresh(input.code.toLowerCase());
  return result;
}
