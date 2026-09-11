export const ADMIN_SESSION_COOKIE = "admin_session";

/** Legacy platform FAST code — still valid for full admin login. */
export const ADMIN_FAST_CODE = "ADMIN123";

export type AdminAccessLevel = "full" | "site-ops";

export type AdminAccount = {
  name: string;
  fastCode: string;
  email: string | null;
  access: AdminAccessLevel;
};

/**
 * Authorized /admin console operators.
 * Login is the existing FAST-code session (`admin_session` cookie + localStorage).
 *
 * Ralph’s `RM22` is also his live Root Mapsite™ code — that is intentional.
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
    name: "Ralph",
    fastCode: "RM22",
    email: "remecom@mac.com",
    access: "site-ops",
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

export const BUILTIN_ADMIN_EMAILS: readonly string[] = ADMIN_ACCOUNTS.map(
  (account) => account.email,
).filter((email): email is string => Boolean(email));
