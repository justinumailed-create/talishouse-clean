export const ADMIN_SESSION_COOKIE = "admin_session";

/**
 * The ONE Global Admin. Holds every power (agents, FAST Codes, partner
 * linking, admin access grants, …). Everyone else gets access through a
 * revocable grant in `admin_access_grants` (migration 104).
 */
export const GLOBAL_ADMIN_FAST_CODE = "ARUN";

/**
 * `global` = the single Global Admin (ARUN). `granted` = a FAST Code holding an
 * active admin access grant. `agent` = DB-backed Agent Admin (`agent_admins`).
 */
export type AdminAccessLevel = "global" | "granted" | "agent";

export type AdminScope =
  | "dashboard"
  | "site-content"
  | "platform-content"
  | "build-requests"
  | "registrations"
  | "marketing"
  | "mapsites"
  | "partner-linking"
  | "seo"
  | "fast-codes"
  | "talisbooks"
  | "pmc-pins"
  | "leads"
  | "agents"
  | "ebooks"
  | "pins"
  | "cash-payments"
  | "payments"
  | "admin-access"
  | "full-console"
  | "leads-crm";

export type AdminAccount = {
  name: string;
  fastCode: string;
  email: string | null;
  access: AdminAccessLevel;
  /**
   * Agent Admin: granted agent scopes. Granted admin: scopes derived from
   * `permissions`. Global Admin: unused (holds every scope).
   */
  scopes?: readonly AdminScope[];
  /** Granted admin only: grant permissions ticked by the Global Admin. */
  permissions?: readonly AdminGrantPermission[];
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
 * Privileges an admin with the Agents permission may grant to an Agent Admin, in display order.
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
  "leads-crm",
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
  "leads-crm": "Leads (CRM)",
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

/**
 * Granular permissions the Global Admin can tick per admin access grant.
 * "Grant others" is deliberately absent: only the Global Admin grants.
 */
export const ADMIN_GRANT_PERMISSIONS = [
  "build-requests",
  "registrations",
  "marketing",
  "leads",
  "mapsites",
  "partner-linking",
  "seo",
  "bookshelves",
  "pmc-pins",
  "fast-codes",
  "agents",
  "payments",
] as const;

export type AdminGrantPermission = (typeof ADMIN_GRANT_PERMISSIONS)[number];

export const ADMIN_GRANT_PERMISSION_LABELS: Record<AdminGrantPermission, string> = {
  "build-requests": "Build requests",
  registrations: "Registrations",
  marketing: "Marketing",
  leads: "Leads (incl. contact from leads)",
  mapsites: "Mapsites (edit, Talismaps, content, PINs, ebooks)",
  "partner-linking": "Partner-linked Mapsites",
  seo: "SEO",
  bookshelves: "Bookshelves / Talisbooks™",
  "pmc-pins": "PMC pins & platform content",
  "fast-codes": "FAST Codes",
  agents: "Agents (incl. agent cash payments)",
  payments: "Payments",
};

/** Scopes each grant permission unlocks (routes + server actions check scopes). */
export const ADMIN_GRANT_PERMISSION_SCOPES: Record<AdminGrantPermission, readonly AdminScope[]> = {
  "build-requests": ["build-requests"],
  registrations: ["registrations"],
  marketing: ["marketing"],
  leads: ["leads"],
  mapsites: ["mapsites", "ebooks", "pins", "site-content"],
  "partner-linking": ["partner-linking"],
  seo: ["seo"],
  bookshelves: ["talisbooks"],
  "pmc-pins": ["pmc-pins", "platform-content"],
  "fast-codes": ["fast-codes"],
  agents: ["agents", "cash-payments"],
  payments: ["payments", "cash-payments"],
};

/** Ralf's former superadmin powers, expressed as grant permissions (migration 104 seed). */
export const FORMER_SUPERADMIN_PERMISSIONS: readonly AdminGrantPermission[] = [
  "build-requests",
  "marketing",
  "mapsites",
  "partner-linking",
  "seo",
  "bookshelves",
  "pmc-pins",
  "fast-codes",
  "agents",
];

export const ALL_ADMIN_SCOPES: readonly AdminScope[] = [
  "dashboard",
  "site-content",
  "platform-content",
  "build-requests",
  "registrations",
  "marketing",
  "mapsites",
  "partner-linking",
  "seo",
  "fast-codes",
  "talisbooks",
  "pmc-pins",
  "leads",
  "agents",
  "ebooks",
  "pins",
  "cash-payments",
  "payments",
  "admin-access",
  "full-console",
  "leads-crm",
];

export function sanitizeGrantPermissions(
  input: readonly string[] | null | undefined,
): AdminGrantPermission[] {
  const allowed = new Set<string>(ADMIN_GRANT_PERMISSIONS);
  const out: AdminGrantPermission[] = [];
  for (const raw of input ?? []) {
    const p = String(raw).trim();
    if (allowed.has(p) && !out.includes(p as AdminGrantPermission)) out.push(p as AdminGrantPermission);
  }
  return ADMIN_GRANT_PERMISSIONS.filter((p) => out.includes(p));
}

/** Scopes for a set of grant permissions (dashboard always on, never admin-access). */
export function scopesForGrantPermissions(
  permissions: readonly string[] | null | undefined,
): AdminScope[] {
  const scopes = new Set<AdminScope>(["dashboard"]);
  for (const p of sanitizeGrantPermissions(permissions)) {
    for (const scope of ADMIN_GRANT_PERMISSION_SCOPES[p]) scopes.add(scope);
  }
  return ALL_ADMIN_SCOPES.filter((s) => scopes.has(s));
}

/** Agent scopes imply a few route scopes so agents keep exactly what they had. */
const AGENT_IMPLIED_SCOPES: Partial<Record<AgentGrantableScope, readonly AdminScope[]>> = {
  mapsites: ["seo"],
  "build-requests": ["marketing"],
};

export const GLOBAL_ADMIN_ACCOUNT: AdminAccount = {
  name: "Arun",
  fastCode: GLOBAL_ADMIN_FAST_CODE,
  email: "arun@kyptronix.com",
  access: "global",
};

/**
 * @deprecated Kept for callers that list built-in admins (e.g. chat). There is
 * now exactly one built-in account: the Global Admin. Granted admins live in
 * `admin_access_grants`.
 */
export const ADMIN_ACCOUNTS: readonly AdminAccount[] = [GLOBAL_ADMIN_ACCOUNT];

export function normalizeAdminFastCode(code: string | null | undefined): string {
  return (code || "").trim().toUpperCase();
}

export function isGlobalAdminFastCode(code: string | null | undefined): boolean {
  return normalizeAdminFastCode(code) === GLOBAL_ADMIN_FAST_CODE;
}


export function isGlobalAdmin(account: AdminAccount | null | undefined): boolean {
  return account?.access === "global";
}

/** Global Admin account for its FAST Code; granted admins resolve from the DB. */
export function getAdminAccountByFastCode(
  code: string | null | undefined,
): AdminAccount | null {
  return isGlobalAdminFastCode(code) ? GLOBAL_ADMIN_ACCOUNT : null;
}

export function getAdminAccountByEmail(
  email: string | null | undefined,
): AdminAccount | null {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return null;
  return GLOBAL_ADMIN_ACCOUNT.email?.toLowerCase() === normalized ? GLOBAL_ADMIN_ACCOUNT : null;
}

/** Built-in (cookie-only) check: only the Global Admin. */
export function isAuthorizedAdminFastCode(code: string | null | undefined): boolean {
  return isGlobalAdminFastCode(code);
}

/** Admin access grant → session account. */
export function grantToAdminAccount(grant: {
  fastCode: string;
  displayName: string | null;
  permissions: readonly string[];
  email?: string | null;
}): AdminAccount {
  const permissions = sanitizeGrantPermissions(grant.permissions);
  return {
    name: grant.displayName?.trim() || normalizeAdminFastCode(grant.fastCode),
    fastCode: normalizeAdminFastCode(grant.fastCode),
    email: grant.email ?? null,
    access: "granted",
    permissions,
    scopes: scopesForGrantPermissions(permissions),
  };
}

export function accountHasAdminScope(
  account: AdminAccount | null | undefined,
  scope: AdminScope,
): boolean {
  if (!account) return false;
  if (account.access === "global") return true;
  if (account.access === "agent") {
    const granted = sanitizeAgentScopes(account.scopes ?? []);
    if (granted.includes(scope as AgentGrantableScope)) return true;
    return granted.some((g) => AGENT_IMPLIED_SCOPES[g]?.includes(scope));
  }
  return (account.scopes ?? []).includes(scope);
}

/** Display label for the sidebar user chip. */
export function adminAccessLabel(account: AdminAccount | null | undefined): string {
  if (!account) return "";
  if (account.access === "global") return "Global Admin";
  if (account.access === "agent") return "Agent";
  return "Admin";
}

export const BUILTIN_ADMIN_EMAILS: readonly string[] = GLOBAL_ADMIN_ACCOUNT.email
  ? [GLOBAL_ADMIN_ACCOUNT.email]
  : [];
