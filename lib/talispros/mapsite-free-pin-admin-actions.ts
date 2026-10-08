"use server";

import { revalidatePath } from "next/cache";
import { requireAdminScope } from "@/lib/admin-auth";
import type { AdminAccount } from "@/lib/admin-constants";
import {
  grantFreePinCreditsForFastCode,
  listFreePinGrants,
  loadFreePinAdminSnapshot,
  type FreePinAdminSnapshot,
  type FreePinGrantRecord,
} from "@/lib/talispros/mapsite-additional-pins-service";

export type FreePinAdminActionResult = {
  success: boolean;
  error?: string;
  applied?: number;
  snapshot?: FreePinAdminSnapshot | null;
  grants?: FreePinGrantRecord[];
};

async function requireFreePinAdmin(): Promise<AdminAccount | null> {
  try {
    return await requireAdminScope("mapsites");
  } catch {
    return null;
  }
}

function adminIdentity(account: AdminAccount): string {
  const email = account.email ? ` <${account.email}>` : "";
  return `${account.name} (${account.fastCode})${email}`;
}

/** Global Admin: look up a FAST Code™'s free PIN balance + its grant history. */
export async function lookupMapSiteFreePinsAction(
  fastCode: string,
): Promise<FreePinAdminActionResult> {
  if (!(await requireFreePinAdmin())) {
    return { success: false, error: "Only Global Admin can manage free PINs." };
  }
  const code = fastCode.trim();
  if (!code) return { success: false, error: "Enter a FAST Code™." };
  const snapshot = await loadFreePinAdminSnapshot(code);
  if (!snapshot) {
    return { success: false, error: "No Mapsite found for that FAST Code™." };
  }
  const grants = await listFreePinGrants({ mapsiteId: snapshot.mapsiteId, limit: 20 });
  return { success: true, snapshot, grants };
}

/**
 * Global Admin: grant (count > 0) or remove (count < 0) free additional PINs
 * for a FAST Code™. Writes an audit row (who / when / count / balance after).
 */
export async function grantMapSiteFreePinsAction(input: {
  fastCode: string;
  count: number;
  note?: string | null;
}): Promise<FreePinAdminActionResult> {
  const account = await requireFreePinAdmin();
  if (!account) {
    return { success: false, error: "Only Global Admin can grant free PINs." };
  }
  const code = input.fastCode.trim();
  if (!code) return { success: false, error: "Enter a FAST Code™." };

  const result = await grantFreePinCreditsForFastCode({
    fastCode: code,
    delta: Math.trunc(Number(input.count)),
    grantedBy: adminIdentity(account),
    note: input.note,
  });
  if (!result.success || !result.snapshot) {
    return { success: false, error: result.error || "Could not grant free PINs." };
  }

  const resolved = result.snapshot.fastCode.trim();
  revalidatePath("/admin/mapsites");
  revalidatePath(`/admin/mapsites/${resolved}`);
  revalidatePath("/talispros/mapsite", "layout");
  revalidatePath(`/mapsite/${resolved.toLowerCase()}`);

  const grants = await listFreePinGrants({
    mapsiteId: result.snapshot.mapsiteId,
    limit: 20,
  });
  return {
    success: true,
    applied: result.applied,
    snapshot: result.snapshot,
    grants,
  };
}
