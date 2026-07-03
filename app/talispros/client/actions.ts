"use server";

import { redirect } from "next/navigation";
import {
  clearClientAnalyticsSession,
  signInClientAnalytics,
} from "@/lib/client-analytics-auth";
import { CLIENT_DASHBOARD_PATH, CLIENT_LOGIN_PATH } from "@/lib/mapsite-account-session";

export async function establishClientAnalyticsSession(
  email: string,
  fastCode: string
): Promise<{ success: boolean; error?: string }> {
  const result = await signInClientAnalytics(email, fastCode);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true };
}

export async function signOutClientAnalytics(): Promise<void> {
  await clearClientAnalyticsSession();
  redirect(CLIENT_LOGIN_PATH);
}
