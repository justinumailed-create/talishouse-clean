/**
 * Associate portal (`/admin/agent/*`) sign-in routing. Safe for Edge middleware.
 *
 * Signed-out visitors to the associate portal go to `/associate?next=<path>`;
 * `next` is only ever honoured as a same-origin relative path inside
 * `/admin/agent`, so it cannot become an open redirect.
 *
 * Internal session auth remains `access: "agent"` and the dashboard stays at
 * `/admin/agent`. `/agent/login` and `/associate/login` redirect to `/associate`.
 */

export const AGENT_LOGIN_PATH = "/associate";
export const AGENT_CHANGE_PASSWORD_PATH = "/associate/change-password";
export const AGENT_RETURN_PARAM = "next";

const AGENT_PORTAL_PREFIX = "/admin/agent";
const MAX_RETURN_LENGTH = 2048;

export function isAgentPortalPath(pathname: string | null | undefined): boolean {
  const path = (pathname || "").split(/[?#]/)[0];
  return path === AGENT_PORTAL_PREFIX || path.startsWith(`${AGENT_PORTAL_PREFIX}/`);
}

/** Returns a normalised `/admin/agent…` path (with query/hash), or null if unsafe. */
export function safeAgentReturnPath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value || value.length > MAX_RETURN_LENGTH) return null;
  // Relative, single leading slash only; no backslashes or control characters.
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return null;
  let url: URL;
  try {
    url = new URL(value, "https://agent-return.invalid");
  } catch {
    return null;
  }
  if (url.origin !== "https://agent-return.invalid") return null;
  if (!isAgentPortalPath(url.pathname)) return null;
  // Reject encoded traversal / slashes that could resolve outside the portal.
  let decoded: string;
  try {
    decoded = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  if (decoded.includes("..") || decoded.includes("\\") || decoded.includes("//")) return null;
  if (!isAgentPortalPath(decoded)) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

function withReturn(base: string, returnTo: string | null | undefined): string {
  const safe = safeAgentReturnPath(returnTo);
  return safe ? `${base}?${AGENT_RETURN_PARAM}=${encodeURIComponent(safe)}` : base;
}

/** `/associate`, with `?next=` when `returnTo` is a safe associate portal path. */
export function agentLoginPath(returnTo?: string | null): string {
  return withReturn(AGENT_LOGIN_PATH, returnTo);
}

/** `/associate/change-password`, carrying a safe `?next=` through the forced change. */
export function agentChangePasswordPath(returnTo?: string | null): string {
  return withReturn(AGENT_CHANGE_PASSWORD_PATH, returnTo);
}

/** Read the first `next` value from Next.js page searchParams. */
export function agentReturnFromSearchParams(
  params: Record<string, string | string[] | undefined> | undefined,
): string | null {
  const raw = params?.[AGENT_RETURN_PARAM];
  return safeAgentReturnPath(Array.isArray(raw) ? raw[0] : raw);
}
