"use server";

import {
  clearAdminSessionCookie,
  clearAgentSessionCookie,
  touchAdminActivityCookie,
  writeAdminSessionCookie,
} from "@/lib/admin-auth";
import { normalizeAdminFastCode } from "@/lib/admin-constants";

export async function loginAdminWithFastCodeAction(
  code: string,
): Promise<
  | { ok: true; fastCode: string; name: string; isGlobalAdmin: boolean }
  | { ok: false; error: string }
> {
  const normalized = normalizeAdminFastCode(code);
  if (!normalized) {
    return { ok: false, error: "Enter your FAST code" };
  }

  const account = await writeAdminSessionCookie(normalized);
  if (!account) {
    return { ok: false, error: "Invalid FAST code" };
  }

  return {
    ok: true,
    fastCode: account.fastCode,
    name: account.name,
    isGlobalAdmin: account.access === "global",
  };
}

export async function logoutAdminAction(): Promise<void> {
  await clearAdminSessionCookie();
  await clearAgentSessionCookie();
}

/** Idle-logout heartbeat from an active admin tab (slides the server idle cap). */
export async function touchAdminActivityAction(): Promise<boolean> {
  return touchAdminActivityCookie();
}
