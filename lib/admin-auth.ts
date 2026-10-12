import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  AGENT_SESSION_COOKIE,
  accountHasAdminScope,
  adminHomePath,
  isAgentAccount,
  getAdminAccountByFastCode,
  isAuthorizedAdminFastCode,
  type AdminAccount,
  type AdminScope,
} from "./admin-constants";
import { accountCanAccessAdminPath } from "./admin-route-access";
import {
  AGENT_SESSION_MAX_AGE,
  agentToAdminAccount,
  getAgentBySessionToken,
  recordAgentLogout,
  revokeAgentSessionToken,
} from "./agent-admins";

/** FAST-code Global Admin session — 24 hours after a successful login. */
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24;

function adminSessionCookieOptions(maxAge: number) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

/** Raw cookie value when it names a hardcoded admin account. */
export async function getAdminSessionValue(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null;
  return isAuthorizedAdminFastCode(value) ? value : null;
}

/**
 * Resolve the signed-in admin account for this request.
 * - Hardcoded accounts (ADMIN123 / RM22 / ARUN): `admin_session` cookie is the FAST code.
 * - Agent Admins: `agent_session` httpOnly cookie holds an opaque token; its
 *   SHA-256 hash must match an unexpired row in `agent_admin_sessions` and the
 *   agent must still be `active` (re-checked on every request).
 */
const resolveAdminSessionAccount = cache(async (): Promise<AdminAccount | null> => {
  const cookieStore = await cookies();
  const builtin = getAdminAccountByFastCode(cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null);
  if (builtin) return builtin;

  const token = cookieStore.get(AGENT_SESSION_COOKIE)?.value ?? null;
  if (!token) return null;
  const agent = await getAgentBySessionToken(token);
  return agent ? agentToAdminAccount(agent) : null;
});

/** FAST-code login for hardcoded admin accounts only (agents use /agent/login). */
export async function writeAdminSessionCookie(fastCode: string): Promise<AdminAccount | null> {
  const account = getAdminAccountByFastCode(fastCode);
  if (!account) return null;

  const cookieStore = await cookies();
  cookieStore.set(
    ADMIN_SESSION_COOKIE,
    account.fastCode,
    adminSessionCookieOptions(ADMIN_SESSION_MAX_AGE),
  );
  return account;
}

export async function writeAgentSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AGENT_SESSION_COOKIE, token, adminSessionCookieOptions(AGENT_SESSION_MAX_AGE));
}

export async function readAgentSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AGENT_SESSION_COOKIE)?.value ?? null;
}

/** Sign the agent out: delete the server-side session row and the cookie. */
export async function clearAgentSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AGENT_SESSION_COOKIE)?.value ?? null;
  await recordAgentLogout(token).catch(() => {});
  await revokeAgentSessionToken(token).catch(() => {});
  cookieStore.set(AGENT_SESSION_COOKIE, "", adminSessionCookieOptions(0));
  cookieStore.delete(AGENT_SESSION_COOKIE);
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", adminSessionCookieOptions(0));
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

/**
 * True only for hardcoded Global Admin accounts. Agent Admins are never
 * "admin authenticated" — they must pass an explicit scope check.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const account = await resolveAdminSessionAccount();
  return Boolean(account) && !isAgentAccount(account);
}

export async function getAdminSessionAccount(): Promise<AdminAccount | null> {
  return resolveAdminSessionAccount();
}

/** Any admin account (hardcoded or agent) holding `scope`. */
export async function hasAdminScope(scope: AdminScope): Promise<boolean> {
  return accountHasAdminScope(await resolveAdminSessionAccount(), scope);
}

export async function requireAdminSession(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }
}

/** Any signed-in admin account (hardcoded or agent); route scopes are enforced by the /admin layout. */
export async function requireAdminPage(): Promise<void> {
  if (!(await resolveAdminSessionAccount())) {
    redirect("/admin/login");
  }
}

export async function requireAdminScope(scope: AdminScope): Promise<AdminAccount> {
  const account = await getAdminSessionAccount();
  if (!account || !accountHasAdminScope(account, scope)) {
    throw new Error("Unauthorized");
  }
  return account;
}

export async function requireAdminScopePage(scope: AdminScope): Promise<AdminAccount> {
  const account = await getAdminSessionAccount();
  if (!account) {
    redirect("/admin/login");
  }
  if (!accountHasAdminScope(account, scope)) {
    redirect(adminHomePath(account));
  }
  return account;
}

export async function requireAdminPathAccess(pathname: string): Promise<AdminAccount> {
  const account = await getAdminSessionAccount();
  if (!account) {
    redirect("/admin/login");
  }
  if (!accountCanAccessAdminPath(account, pathname)) {
    redirect(adminHomePath(account));
  }
  return account;
}
