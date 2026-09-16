"use server";

import { writeAdminSessionCookie, clearAdminSessionCookie } from "@/lib/admin-auth";
import { normalizeAdminFastCode } from "@/lib/admin-constants";

export async function loginAdminWithFastCodeAction(
  code: string,
): Promise<{ ok: true; fastCode: string; name: string } | { ok: false; error: string }> {
  const normalized = normalizeAdminFastCode(code);
  if (!normalized) {
    return { ok: false, error: "Enter your FAST code" };
  }

  const account = await writeAdminSessionCookie(normalized);
  if (!account) {
    return { ok: false, error: "Invalid FAST code" };
  }

  return { ok: true, fastCode: account.fastCode, name: account.name };
}

export async function logoutAdminAction(): Promise<void> {
  await clearAdminSessionCookie();
}
