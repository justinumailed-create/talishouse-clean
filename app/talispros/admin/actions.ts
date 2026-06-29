"use server";

import { cookies } from "next/headers";
import { ADMIN_FAST_CODE, ADMIN_SESSION_COOKIE } from "@/lib/admin-constants";

export async function establishTalisprosAdminSession(
  fastCode: string
): Promise<{ success: boolean; error?: string }> {
  const normalized = (fastCode || "").trim().toUpperCase();

  if (!normalized) {
    return { success: false, error: "Enter your FAST code" };
  }

  if (normalized !== ADMIN_FAST_CODE) {
    return { success: false, error: "Invalid FAST code" };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, ADMIN_FAST_CODE, {
    path: "/",
    maxAge: 60 * 60 * 24,
    sameSite: "lax",
  });

  return { success: true };
}
