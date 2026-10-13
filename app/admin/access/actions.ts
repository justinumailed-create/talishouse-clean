"use server";

import { revalidatePath } from "next/cache";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { isGlobalAdmin } from "@/lib/admin-constants";
import { createAdminGrant, revokeAdminGrant, updateAdminGrant } from "@/lib/admin-access-grants";

type Result = { ok: boolean; error?: string };

/** Only the Global Admin may grant, edit or revoke admin access. */
async function requireGlobalAdmin() {
  const account = await getAdminSessionAccount();
  return isGlobalAdmin(account) ? account : null;
}

export async function createAdminGrantAction(input: {
  fastCode: string;
  displayName?: string;
  email?: string;
  permissions: string[];
}): Promise<Result> {
  const actor = await requireGlobalAdmin();
  if (!actor) return { ok: false, error: "Only the Global Admin can grant admin access." };
  const result = await createAdminGrant({ ...input, actor: actor.fastCode });
  if (result.ok) revalidatePath("/admin/access");
  return result;
}

export async function updateAdminGrantAction(input: {
  id: string;
  displayName?: string;
  email?: string;
  permissions: string[];
}): Promise<Result> {
  const actor = await requireGlobalAdmin();
  if (!actor) return { ok: false, error: "Only the Global Admin can edit admin access." };
  const result = await updateAdminGrant({ ...input, actor: actor.fastCode });
  if (result.ok) revalidatePath("/admin/access");
  return result;
}

export async function revokeAdminGrantAction(id: string): Promise<Result> {
  const actor = await requireGlobalAdmin();
  if (!actor) return { ok: false, error: "Only the Global Admin can revoke admin access." };
  const result = await revokeAdminGrant(id, actor.fastCode);
  if (result.ok) revalidatePath("/admin/access");
  return result;
}
