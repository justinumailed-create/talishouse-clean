import { isRetiredAdminFastCode } from "./admin-retired-codes";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  AGENT_SESSION_COOKIE,
  accountHasAdminScope,
  adminHomePath,
  isGlobalAdmin,
  GLOBAL_ADMIN_ACCOUNT,
  getAdminAccountByFastCode,
  grantToAdminAccount,
  isGlobalAdminFastCode,
  normalizeAdminFastCode,
  type AdminAccount,
  type AdminScope,
} from "./admin-constants";
import { ADMIN_ACTIVITY_COOKIE, adminActivityCookieOptions } from "./admin-idle";
import { accountCanAccessAdminPath } from "./admin-route-access";
import { getActiveAdminGrant, getActiveAdminGrantById } from "./admin-access-grants";
import {
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSession,
  resolveAdminSessionToken,
  revokeAdminSessionToken,
  revokeAllAdminSessions,
  type AdminSessionRow,
} from "./admin-sessions";
import {
  AGENT_SESSION_MAX_AGE,
  agentToAdminAccount,
  getAgentBySessionToken,
  recordAgentLogout,
  revokeAgentSessionToken,
} from "./agent-admins";

/** FAST-code admin session cookie lifetime (the DB row also expires; idle cap ~90s). */
export const ADMIN_SESSION_MAX_AGE = ADMIN_SESSION_TTL_SECONDS;

function adminSessionCookieOptions(maxAge: number) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

/** Global Admin, or an active admin access grant (revocation applies on the next request). */
export async function resolveFastCodeAdminAccount(code: string | null | undefined): Promise<AdminAccount | null> {
  const normalized = normalizeAdminFastCode(code);
  if (!normalized || isRetiredAdminFastCode(normalized)) return null;
  const global = getAdminAccountByFastCode(normalized);
  if (global) return global;
  const grant = await getActiveAdminGrant(normalized);
  return grant ? grantToAdminAccount(grant) : null;
}

/** Session row → account. Granted admins are re-checked against their active grant. */
async function accountForAdminSessionRow(row: AdminSessionRow): Promise<AdminAccount | null> {
  if (row.access === "global") return GLOBAL_ADMIN_ACCOUNT;
  if (row.access === "granted") {
    const grant = await getActiveAdminGrantById(row.grant_id);
    return grant ? grantToAdminAccount(grant) : null;
  }
  return null;
}

/**
 * Resolve the signed-in admin account for this request (the single choke
 * point used by the /admin layout, every admin page guard and server action).
 * - Global Admin / granted admins: `admin_session` httpOnly cookie holds a
 *   random token; its SHA-256 hash must match an `admin_sessions` row that is
 *   not revoked, not expired and seen within ~90s (last_seen_at is refreshed).
 *   A FAST Code or any other value in the cookie is rejected.
 * - Agent Admins: `agent_session` httpOnly cookie holds an opaque token; its
 *   SHA-256 hash must match an unexpired row in `agent_admin_sessions` and the
 *   agent must still be `active` (re-checked on every request).
 */
const resolveAdminSessionAccount = cache(async (): Promise<AdminAccount | null> => {
  const cookieStore = await cookies();
  const row = await resolveAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null);
  if (row) {
    const account = await accountForAdminSessionRow(row);
    if (account) return account;
  }

  const token = cookieStore.get(AGENT_SESSION_COOKIE)?.value ?? null;
  if (!token) return null;
  const agent = await getAgentBySessionToken(token);
  return agent ? agentToAdminAccount(agent) : null;
});

/**
 * FAST-code login: Global Admin or an active grant (agents use /agent/login).
 * After the code check, a server-side session is created and only its random
 * token goes into the cookie.
 */
export async function writeAdminSessionCookie(fastCode: string): Promise<AdminAccount | null> {
  const normalized = normalizeAdminFastCode(fastCode);
  if (!normalized || isRetiredAdminFastCode(normalized)) return null;

  let account: AdminAccount | null = null;
  let token: string | null = null;
  if (isGlobalAdminFastCode(normalized)) {
    account = GLOBAL_ADMIN_ACCOUNT;
    token = await createAdminSession({ access: "global", grantId: null });
  } else {
    const grant = await getActiveAdminGrant(normalized);
    if (grant) {
      account = grantToAdminAccount(grant);
      token = await createAdminSession({ access: "granted", grantId: grant.id });
    }
  }
  if (!account || !token) return null;

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions(ADMIN_SESSION_MAX_AGE));
  // Idle cap UX: middleware shows the idle notice once this short-lived cookie
  // lapses; the authoritative cap is admin_sessions.last_seen_at (~90s).
  cookieStore.set(ADMIN_ACTIVITY_COOKIE, "1", adminActivityCookieOptions());
  return account;
}

/** Activity heartbeat: refreshes last_seen_at and slides the idle cookie (FAST-code admins only). */
export async function touchAdminActivityCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  if (!cookieStore.get(ADMIN_ACTIVITY_COOKIE)) return false;
  const row = await resolveAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null);
  if (!row || !(await accountForAdminSessionRow(row))) return false;
  cookieStore.set(ADMIN_ACTIVITY_COOKIE, "1", adminActivityCookieOptions());
  return true;
}

/** Superadmin only: revoke every FAST-code admin session except the caller's. */
export async function revokeAllOtherAdminSessions(): Promise<number> {
  const account = await resolveAdminSessionAccount();
  if (!isGlobalAdmin(account)) throw new Error("Unauthorized");
  const cookieStore = await cookies();
  return revokeAllAdminSessions({ keepToken: cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null });
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

/** Normal + idle logout: revoke the session row server-side, then drop the cookies. */
export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  await revokeAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null).catch(() => {});
  cookieStore.set(ADMIN_SESSION_COOKIE, "", adminSessionCookieOptions(0));
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  cookieStore.set(ADMIN_ACTIVITY_COOKIE, "", adminActivityCookieOptions(0));
  cookieStore.delete(ADMIN_ACTIVITY_COOKIE);
}

/**
 * True only for the Global Admin. Granted admins and Agent Admins are never
 * "admin authenticated" — they must pass an explicit scope check.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  // Only the Global Admin. Everyone else must pass an explicit scope check.
  return isGlobalAdmin(await resolveAdminSessionAccount());
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
