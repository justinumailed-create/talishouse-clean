export const ADMIN_SESSION_COOKIE = "admin_session";

/** Legacy platform FAST code — still valid for full admin login. */
export const ADMIN_FAST_CODE = "ADMIN123";

export type AdminAccessLevel = "full" | "superadmin" | "site-ops";

export type AdminScope =
  | "dashboard"
  | "site-content"
  | "platform-content"
  | "build-requests"
  | "mapsites"
  | "fast-codes"
  | "talisbooks"
  | "full-console";

export type AdminAccount = {
  name: string;
  fastCode: string;
  email: string | null;
  access: AdminAccessLevel;
};

export const ADMIN_SCOPES_BY_ACCESS: Record<AdminAccessLevel, readonly AdminScope[]> = {
  "site-ops": ["dashboard", "site-content", "build-requests", "mapsites", "talisbooks"],
  superadmin: [
    "dashboard",
    "site-content",
    "platform-content",
    "build-requests",
    "mapsites",
    "fast-codes",
    "talisbooks",
  ],
  full: [
    "dashboard",
    "site-content",
    "platform-content",
    "build-requests",
    "mapsites",
    "fast-codes",
    "talisbooks",
    "full-console",
  ],
};

/**
 * Authorized /admin console operators.
 * Login is the existing FAST-code session (`admin_session` cookie + localStorage).
 *
 * Ralf’s `RM22` is also his live Root Mapsite™ code — that is intentional.
 * Business-office FastCodeGate still treats only ADMIN123 as a super-admin gate,
 * so entering RM22 on a Mapsite™ / associate gate does not grant admin.
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
  return ADMIN_SCOPES_BY_ACCESS[account.access].includes(scope);
}

export function isElevatedAdminAccess(access: AdminAccessLevel | null | undefined): boolean {
  return access === "full" || access === "superadmin";
}

export const BUILTIN_ADMIN_EMAILS: readonly string[] = ADMIN_ACCOUNTS.map(
  (account) => account.email,
).filter((email): email is string => Boolean(email));
