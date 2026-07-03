"use server";

import { redirect } from "next/navigation";
import { clearTalisprosAdminSession, signInTalisprosAdminWithPassword } from "@/lib/talispros-admin-auth";
import { MARKETING_LOGIN_PATH } from "@/lib/mapsite-account-session";

export async function establishMarketingManagerSession(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  return signInTalisprosAdminWithPassword(email, password);
}

export async function signOutMarketingManager(): Promise<void> {
  await clearTalisprosAdminSession();
  redirect(MARKETING_LOGIN_PATH);
}
