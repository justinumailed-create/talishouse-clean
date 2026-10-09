"use server";

import { revalidatePath } from "next/cache";
import { requireAdminScope } from "@/lib/admin-auth";
import {
  upsertPmcRegionalPin,
  upsertPmcRegionalPins,
  type PmcRegionalPinUpdate,
} from "@/lib/talispros/pmc-pins-service";

export async function savePmcRegionalPinAction(
  update: PmcRegionalPinUpdate
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdminScope("mapsites");
  const result = await upsertPmcRegionalPin(update);
  if (!result.ok) return result;
  revalidatePath("/talispros/mapsite");
  revalidatePath("/admin/pmc");
  return { ok: true };
}

export async function savePmcRegionalPinsAction(
  updates: PmcRegionalPinUpdate[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdminScope("mapsites");
  const result = await upsertPmcRegionalPins(updates);
  if (!result.ok) return result;
  revalidatePath("/talispros/mapsite");
  revalidatePath("/admin/pmc");
  return { ok: true };
}
