"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAgent } from "@/lib/agent-collab-server";
import {
  addFastCodeSlot,
  loadOwnSlotList,
  removeFastCodeSlot,
  type SlotMutationError,
} from "@/lib/talispros/fast-code-slots-server";
import type { OwnSlotList } from "@/lib/talispros/fast-code-slots";
import { DEMO_MAPSITE_BUILD_PATH } from "@/lib/talispros/demo-mapsite";

type SlotActionResult = { ok: true; list: OwnSlotList } | { ok: false; error: SlotMutationError };

/** Add a FAST Code to the signed-in agent's own list (existing Mapsites only, 15 max). */
export async function addFastCodeSlotAction(input: { code: string }): Promise<SlotActionResult> {
  const agent = await getCurrentAgent();
  if (!agent) return { ok: false, error: "signin" };
  const res = await addFastCodeSlot(agent, input?.code);
  if (!res.ok) return res;
  revalidatePath(DEMO_MAPSITE_BUILD_PATH);
  return { ok: true, list: await loadOwnSlotList(agent) };
}

/** Remove one slot from the signed-in agent's own list. */
export async function removeFastCodeSlotAction(input: { slotId: string }): Promise<SlotActionResult> {
  const agent = await getCurrentAgent();
  if (!agent) return { ok: false, error: "signin" };
  const res = await removeFastCodeSlot(agent, input?.slotId);
  if (!res.ok) return res;
  revalidatePath(DEMO_MAPSITE_BUILD_PATH);
  return { ok: true, list: await loadOwnSlotList(agent) };
}
