"use server";

import { headers } from "next/headers";
import {
  clearAgentSessionCookie,
  getAdminSessionAccount,
  readAgentSessionToken,
  writeAgentSessionCookie,
} from "@/lib/admin-auth";
import { changeOwnAgentPassword, loginAgent } from "@/lib/agent-admins";

type Result = { ok: true; next: string } | { ok: false; error: string };

// Best-effort per-IP throttle (per server instance). Per-account lockout in
// lib/agent-admins.ts is the durable control.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 20;
const attempts = new Map<string, { count: number; resetAt: number }>();

function throttled(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    if (attempts.size > 5000) attempts.clear();
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function agentLoginAction(loginId: string, password: string): Promise<Result> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || h.get("x-real-ip") || "unknown").split(",")[0].trim();
  if (throttled(ip)) {
    return { ok: false, error: "Too many attempts from this network. Try again later." };
  }
  const result = await loginAgent(String(loginId || ""), String(password || ""));
  if (!result.ok) return result;
  await writeAgentSessionCookie(result.token);
  return { ok: true, next: result.agent.mustChangePassword ? "/agent/change-password" : "/admin/agent" };
}

export async function agentChangePasswordAction(
  currentPassword: string,
  newPassword: string,
): Promise<Result> {
  const account = await getAdminSessionAccount();
  if (!account || account.access !== "agent" || !account.agentId) {
    return { ok: false, error: "Please sign in again." };
  }
  const result = await changeOwnAgentPassword(
    account.agentId,
    String(currentPassword || ""),
    String(newPassword || ""),
    await readAgentSessionToken(),
  );
  if (!result.ok) return result;
  return { ok: true, next: "/admin/agent" };
}

export async function agentLogoutAction(): Promise<void> {
  await clearAgentSessionCookie();
}
