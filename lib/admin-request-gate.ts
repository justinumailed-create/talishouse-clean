import { getAdminAccountByFastCode } from "./admin-constants";
import { accountCanAccessAdminPath } from "./admin-route-access";
import {
  isAdminAppPath,
  isPublicAdminPath,
  isStandaloneAdminPath,
  normalizeAppPath,
} from "./admin-paths";

export const TALISPROS_ADMIN_MARKER_COOKIE = "talispros_admin_session";
export const ADMIN_PATHNAME_HEADER = "x-talispros-admin-pathname";

export type AdminRequestGateResult =
  | { action: "next" }
  | { action: "redirect"; to: "/admin/login" | "/admin/dashboard" };

/**
 * Fail-closed gate for `/admin/*`.
 * Login is the only public admin path. A Mapsite / marketing / `auth` cookie
 * is never treated as Global Admin. Standalone `/admin/talismaps` may use the
 * Talispros admin marker in addition to a FAST-code admin session.
 */
export function resolveAdminRequestGate(input: {
  pathname: string | null | undefined;
  adminSessionCookie?: string | null;
  talisprosAdminMarker?: string | null;
}): AdminRequestGateResult {
  const pathname = normalizeAppPath(input.pathname);
  if (!isAdminAppPath(pathname)) {
    return { action: "next" };
  }

  if (isPublicAdminPath(pathname)) {
    return { action: "next" };
  }

  const account = getAdminAccountByFastCode(input.adminSessionCookie);
  const hasTalisprosMarker = input.talisprosAdminMarker === "1";

  if (isStandaloneAdminPath(pathname)) {
    if (account || hasTalisprosMarker) {
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
