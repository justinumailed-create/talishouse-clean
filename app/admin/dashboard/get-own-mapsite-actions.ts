"use server";

import { revalidatePath } from "next/cache";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { accountHasAdminScope } from "@/lib/admin-constants";
import { setGetOwnMapsiteButtonEnabled } from "@/lib/talispros/get-own-mapsite-settings";

async function requireDashboardAdmin() {
  const account = await getAdminSessionAccount();
  if (!account || account.access === "agent") return null;
  if (!accountHasAdminScope(account, "dashboard")) return null;
  return account;
}

export async function setGetOwnMapsiteButtonAction(
  enabled: boolean,
): Promise<{ ok: true; enabled: boolean } | { ok: false; error: string }> {
  if (!(await requireDashboardAdmin())) {
    return { ok: false, error: "You do not have permission to change this setting." };
  }
  const result = await setGetOwnMapsiteButtonEnabled(enabled);
  if (!result.ok) return result;
  revalidatePath("/admin/dashboard");
  revalidatePath("/home", "layout");
  revalidatePath("/map", "layout");
  return result;
}
