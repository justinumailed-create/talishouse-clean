"use server";

import { requireAdminPage } from "@/lib/admin-auth";
import { markAdminNotificationRead } from "@/lib/talispros/admin-notifications";

export async function markNotificationReadAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdminPage();
  return markAdminNotificationRead(id);
}
