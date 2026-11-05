"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAgent } from "@/lib/agent-collab-server";
import { isFastCodeStage } from "@/lib/talispros/fast-code-tracker";
import { addFastCodeNote, getTrackedCode, setFastCodeStage } from "@/lib/talispros/fast-code-tracker-server";

type Result = { ok: true } | { ok: false; error: "signin" | "forbidden" | "invalid" | "failed" };

async function ownCode(code: unknown) {
  const agent = await getCurrentAgent();
  if (!agent) return { error: "signin" as const };
  if (typeof code !== "string" || !/^[a-z0-9-]{2,40}$/i.test(code)) return { error: "invalid" as const };
  const tracked = await getTrackedCode(code);
  if (!tracked || tracked.agentId !== agent.agentId) return { error: "forbidden" as const };
  return { agent, code: code.toLowerCase() };
}

/** Agent sets the conversation stage of one of their own FAST Codes. */
export async function setFastCodeStageAction(input: { code: string; stage: string }): Promise<Result> {
  const own = await ownCode(input?.code);
  if ("error" in own) return { ok: false, error: own.error! };
  if (!isFastCodeStage(input?.stage)) return { ok: false, error: "invalid" };
  const ok = await setFastCodeStage(own.code, input.stage, { agentId: own.agent.agentId, by: own.agent.name });
  revalidatePath("/admin/agent");
  return ok ? { ok: true } : { ok: false, error: "failed" };
}

/** Agent adds a dated note to one of their own FAST Codes. */
export async function addFastCodeNoteAction(input: { code: string; note: string }): Promise<Result> {
  const own = await ownCode(input?.code);
  if ("error" in own) return { ok: false, error: own.error! };
  const note = typeof input?.note === "string" ? input.note.trim() : "";
  if (!note || note.length > 2000) return { ok: false, error: "invalid" };
  const ok = await addFastCodeNote(own.code, note, { agentId: own.agent.agentId, by: own.agent.name });
  revalidatePath("/admin/agent");
  return ok ? { ok: true } : { ok: false, error: "failed" };
}
