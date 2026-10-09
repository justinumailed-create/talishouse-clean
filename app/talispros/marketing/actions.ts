"use server";

import { redirect } from "next/navigation";
import { clearAdminSessionCookie } from "@/lib/admin-auth";

/** Marketing Manager uses the Global Admin FAST-code session. */
export async function signOutMarketingManager(): Promise<void> {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}
