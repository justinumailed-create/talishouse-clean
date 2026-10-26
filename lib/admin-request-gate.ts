import {
  isAdminAppPath,
  isPublicAdminPath,
  isStandaloneAdminPath,
  normalizeAppPath,
} from "./admin-paths";
import { agentLoginPath, isAgentPortalPath } from "./agent-return-path";

export const ADMIN_PATHNAME_HEADER = "x-talispros-admin-pathname";

export type AdminRequestGateResult =
  | { action: "next" }
  | { action: "redirect"; to: string };

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
  /** Request query string (`?a=b`), kept in the agent portal return path. */
  search?: string | null;
}): AdminRequestGateResult {
  const pathname = normalizeAppPath(input.pathname);
  if (!isAdminAppPath(pathname)) {
    return { action: "next" };
  }

  if (isPublicAdminPath(pathname)) {
    return { action: "next" };
  }

  // Cheap presence check only. The Edge runtime does not query Supabase, so a
  // well-formed opaque session token (admin_session or agent_session) goes on
  // to the /admin layout and server actions, which validate it against
  // `admin_sessions` / `agent_admin_sessions` (hash, revoked, expiry, idle cap,
  // grant/agent still active, path scopes) on every request — fail closed.
  // A FAST Code or any other non-token value in the cookie is refused here.
  if (isSessionTokenShape(input.adminSessionCookie) || isSessionTokenShape(input.agentSessionCookie)) {
    return { action: "next" };
  }

  // Agents sign in at /agent/login; send them back to the page they asked for.
  if (isAgentPortalPath(pathname) && !isStandaloneAdminPath(pathname)) {
    return { action: "redirect", to: agentLoginPath(`${pathname}${input.search || ""}`) };
  }
  return { action: "redirect", to: "/admin/login" };
}

/** 32 random bytes, base64url (43 chars): admin and agent session tokens. */
export function isSessionTokenShape(value: string | null | undefined): boolean {
  return Boolean(value && /^[A-Za-z0-9_-]{43}$/.test(value));
}
