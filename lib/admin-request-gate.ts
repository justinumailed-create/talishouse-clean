import { getAdminAccountByFastCode } from "./admin-constants";
import { accountCanAccessAdminPath } from "./admin-route-access";
import {
  isAdminAppPath,
  isPublicAdminPath,
  isStandaloneAdminPath,
  normalizeAppPath,
} from "./admin-paths";

export const ADMIN_PATHNAME_HEADER = "x-talispros-admin-pathname";

export type AdminRequestGateResult =
  | { action: "next" }
  | { action: "redirect"; to: "/admin/login" | "/admin/dashboard" };

/**
 * Fail-closed gate for `/admin/*`.
 * Login is the only public admin path. A Mapsite / marketing / `auth` cookie
 * is never treated as Global Admin. Standalone `/admin/talismaps` keeps its own
 * chrome but still requires a FAST-code admin session.
 */
export function resolveAdminRequestGate(input: {
  pathname: string | null | undefined;
  adminSessionCookie?: string | null;
  /** Opaque Agent Admin session token (`agent_session` cookie). */
  agentSessionCookie?: string | null;
}): AdminRequestGateResult {
  const pathname = normalizeAppPath(input.pathname);
  if (!isAdminAppPath(pathname)) {
    return { action: "next" };
  }

  if (isPublicAdminPath(pathname)) {
    return { action: "next" };
  }

  const account = getAdminAccountByFastCode(input.adminSessionCookie);

  // Agent Admin session token: the Edge runtime cannot read
  // `agent_admin_sessions`, so let a well-formed token through to the /admin
  // layout, which validates it (hash, expiry, active agent, scopes) on every request.
  if (!account && isAgentSessionShape(input.agentSessionCookie)) {
    return { action: "next" };
  }

  if (isStandaloneAdminPath(pathname)) {
    if (account) {
      return { action: "next" };
    }
    return { action: "redirect", to: "/admin/login" };
  }

  if (!account) {
    return { action: "redirect", to: "/admin/login" };
  }

  if (!accountCanAccessAdminPath(account, pathname)) {
    return { action: "redirect", to: "/admin/dashboard" };
  }

  return { action: "next" };
}

function isAgentSessionShape(value: string | null | undefined): boolean {
  return Boolean(value && /^[A-Za-z0-9_-]{43}$/.test(value));
}
