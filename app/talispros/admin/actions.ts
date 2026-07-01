"use server";

import {
  clearTalisprosAdminSession,
  signInTalisprosAdminWithPassword,
} from "@/lib/talispros-admin-auth";

export async function establishTalisprosAdminSession(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  return signInTalisprosAdminWithPassword(email, password);
}

export async function clearTalisprosAdminAuthSession(): Promise<void> {
  await clearTalisprosAdminSession();
}
