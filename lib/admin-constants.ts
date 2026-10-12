export const ADMIN_SESSION_COOKIE = "admin_session";

/** Legacy platform FAST code — still valid for full admin login. */
export const ADMIN_FAST_CODE = "ADMIN123";

/**
 * `agent` = DB-backed Agent Admin (`agent_admins` table). Agents carry their
 * own granted scope list; every other level is a hardcoded account below.
 */
export type AdminAccessLevel = "full" | "superadmin" | "site-ops" | "agent";

export type AdminScope =
  | "dashboard"
  | "site-content"
  | "platform-content"
  | "build-requests"
  | "mapsites"
  | "fast-codes"
  | "talisbooks"
  | "leads"
  | "agents"
  | "ebooks"
  | "pins"
  | "cash-payments"
  | "full-console";

export type AdminAccount = {
  name: string;
  fastCode: string;
  email: string | null;
  access: AdminAccessLevel;
  /** Agent Admin only: granted scopes (never `agents`, `fast-codes`, `full-console`, …). */
  scopes?: readonly AdminScope[];
  /** Agent Admin only: `agent_admins.id`. */
  agentId?: string;
  /** Agent Admin only: Mapsite FAST codes the agent may edit (empty = all, when granted `mapsites`). */
  assignedMapSites?: readonly string[];
  /** Agent Admin only: login ID (agents sign in with login ID + password, not a FAST Code). */
  loginId?: string;
  /** Agent Admin only: temporary password must be changed before using the console. */
  mustChangePassword?: boolean;
};

/**
 * Privileges a superadmin may grant to an Agent Admin, in display order.
 * `dashboard` is the agent's own dashboard (/admin/agent) and is always on.
 * Admin-management scopes (`agents`, `fast-codes`, `platform-content`,
 * `site-content`, `full-console`) are deliberately NOT grantable.
 */
export const AGENT_GRANTABLE_SCOPES = [
  "mapsites",
  "ebooks",
  "pins",
  "cash-payments",
  "talisbooks",
  "build-requests",
  "leads",
] as const satisfies readonly AdminScope[];

export type AgentGrantableScope = (typeof AGENT_GRANTABLE_SCOPES)[number];

export const AGENT_SCOPE_LABELS: Record<AgentGrantableScope, string> = {
  mapsites: "Manage Mapsites (view/edit details & content; no delete, no pricing)",
  ebooks: "Create ebooks and attach them to a FAST Code",
  pins: "Add new PINs to a Mapsite (no Stripe)",
  "cash-payments": "Mark a FAST Code as paid (cash, CAD)",
  talisbooks: "Talisbooks™ (ebooks, bookshelves)",
  "build-requests": "Build requests / registrations queue",
  leads: "Leads",
};

export function sanitizeAgentScopes(input: readonly string[] | null | undefined): AgentGrantableScope[] {
  const allowed = new Set<string>(AGENT_GRANTABLE_SCOPES);
  const seen = new Set<string>();
  const out: AgentGrantableScope[] = [];
  for (const raw of input ?? []) {
    const scope = String(raw).trim();
    if (allowed.has(scope) && !seen.has(scope)) {
      seen.add(scope);
      out.push(scope as AgentGrantableScope);
    }
  }
  return out;
}

/** httpOnly cookie holding an opaque Agent Admin session token (hash stored in DB). */
export const AGENT_SESSION_COOKIE = "agent_session";

export function isAgentAccount(account: AdminAccount | null | undefined): boolean {
  return account?.access === "agent";
}

/** Where to land an account that lacks access to the requested admin page. */
export function adminHomePath(account: AdminAccount | null | undefined): string {
  return isAgentAccount(account) ? "/admin/agent" : "/admin/dashboard";
}

export const ADMIN_SCOPES_BY_ACCESS: Record<AdminAccessLevel, readonly AdminScope[]> = {
  "site-ops": ["dashboard", "site-content", "build-requests", "mapsites", "talisbooks"],
  // Agents get only their per-account `scopes` (see accountHasAdminScope).
  agent: [],
  superadmin: [
    "dashboard",
    "site-content",
    "platform-content",
    "build-requests",
    "mapsites",
    "fast-codes",
    "talisbooks",
    "agents",
    "ebooks",
    "pins",
    "cash-payments",
  ],
  full: [
    "dashboard",
    "site-content",
    "platform-content",
    "build-requests",
    "mapsites",
    "fast-codes",
    "talisbooks",
    "leads",
    "agents",
    "ebooks",
    "pins",
    "cash-payments",
    "full-console",
  ],
};

/**
 * Authorized /admin console operators.
 * Login is the existing FAST-code session (`admin_session` cookie + localStorage).
 *
 * Ralf’s `RM22` is also his live Root Mapsite code — that is intentional.
 * Business-office FastCodeGate still treats only ADMIN123 as a super-admin gate,
 * so entering RM22 on a Mapsite / associate gate does not grant admin.
 */
export const ADMIN_ACCOUNTS: readonly AdminAccount[] = [
  {
    name: "Platform Admin",
    fastCode: ADMIN_FAST_CODE,
    email: null,
    access: "full",
  },
  {
    name: "Ralf",
    fastCode: "RM22",
    email: "remecom@mac.com",
    access: "superadmin",
  },
  {
    name: "Arun",
    fastCode: "ARUN",
    email: "arun@kyptronix.com",
    access: "full",
  },
] as const;

export function normalizeAdminFastCode(code: string | null | undefined): string {
  return (code || "").trim().toUpperCase();
}

export function getAdminAccountByFastCode(
  code: string | null | undefined,
): AdminAccount | null {
  const normalized = normalizeAdminFastCode(code);
  if (!normalized) return null;
  return ADMIN_ACCOUNTS.find((account) => account.fastCode === normalized) ?? null;
}

export function getAdminAccountByEmail(
  email: string | null | undefined,
): AdminAccount | null {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return null;
  return (
    ADMIN_ACCOUNTS.find((account) => account.email?.toLowerCase() === normalized) ??
    null
  );
}

export function isAuthorizedAdminFastCode(code: string | null | undefined): boolean {
  return getAdminAccountByFastCode(code) !== null;
}

export function getAdminScopes(access: AdminAccessLevel | null | undefined): readonly AdminScope[] {
  if (!access) return [];
  return ADMIN_SCOPES_BY_ACCESS[access];
}

export function accountHasAdminScope(
  account: AdminAccount | null | undefined,
  scope: AdminScope,
): boolean {
  if (!account) return false;
  if (account.access === "agent") {
    return sanitizeAgentScopes(account.scopes ?? []).includes(scope as AgentGrantableScope);
  }
  return ADMIN_SCOPES_BY_ACCESS[account.access].includes(scope);
}

export function isElevatedAdminAccess(access: AdminAccessLevel | null | undefined): boolean {
  return access === "full" || access === "superadmin";
}

export const BUILTIN_ADMIN_EMAILS: readonly string[] = ADMIN_ACCOUNTS.map(
  (account) => account.email,
).filter((email): email is string => Boolean(email));
