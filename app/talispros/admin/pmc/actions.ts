"use server";

import { revalidatePath } from "next/cache";
import { requireTalisprosAdminPage } from "@/lib/talispros-admin-auth";
import { isMarketingManagerAuthenticated } from "@/lib/marketing-manager-auth";
import {
  upsertPmcRegionalPin,
  upsertPmcRegionalPins,
  type PmcRegionalPinUpdate,
} from "@/lib/talispros/pmc-pins-service";

async function requirePmcEditorAccess() {
  if (await isMarketingManagerAuthenticated()) return;
  await requireTalisprosAdminPage();
}

export async function savePmcRegionalPinAction(
  update: PmcRegionalPinUpdate
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requirePmcEditorAccess();
  const result = await upsertPmcRegionalPin(update);
  if (!result.ok) return result;
  revalidatePath("/talispros/mapsite");
  revalidatePath("/talispros/admin/pmc");
  return { ok: true };
}

export async function savePmcRegionalPinsAction(
  updates: PmcRegionalPinUpdate[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requirePmcEditorAccess();
  const result = await upsertPmcRegionalPins(updates);
  if (!result.ok) return result;
  revalidatePath("/talispros/mapsite");
  revalidatePath("/talispros/admin/pmc");
  return { ok: true };
}
