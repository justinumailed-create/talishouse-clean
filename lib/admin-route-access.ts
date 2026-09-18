import type { AdminAccount, AdminScope } from "./admin-constants";
import { accountHasAdminScope } from "./admin-constants";

const ADMIN_ROUTE_SCOPES: ReadonlyArray<{ prefix: string; scope: AdminScope | null }> = [
  { prefix: "/admin/login", scope: null },
  { prefix: "/admin/talismaps", scope: null },
  { prefix: "/admin/platform-content", scope: "platform-content" },
  { prefix: "/admin/fast-codes", scope: "fast-codes" },
  { prefix: "/admin/content", scope: "site-content" },
  { prefix: "/admin/build-requests", scope: "build-requests" },
  { prefix: "/admin/marketing", scope: "build-requests" },
  { prefix: "/admin/mapsites", scope: "mapsites" },
  { prefix: "/admin/seo", scope: "mapsites" },
  { prefix: "/admin/talisbooks", scope: "talisbooks" },
  { prefix: "/admin/bookshelves", scope: "talisbooks" },
  { prefix: "/admin/products", scope: "platform-content" },
  { prefix: "/admin/dashboard", scope: "dashboard" },
  { prefix: "/admin/associates", scope: "full-console" },
  { prefix: "/admin/talisbot", scope: "full-console" },
  { prefix: "/admin/leads-simulation", scope: "full-console" },
  { prefix: "/admin/leads", scope: "full-console" },
  { prefix: "/admin/deals", scope: "full-console" },
  { prefix: "/admin/users", scope: "full-console" },
  { prefix: "/admin/applications", scope: "full-console" },
  { prefix: "/admin/project-applications", scope: "full-console" },
  { prefix: "/admin/registrations", scope: "full-console" },
  { prefix: "/admin/pricing", scope: "full-console" },
  { prefix: "/admin/payments", scope: "full-console" },
  { prefix: "/admin/projects", scope: "full-console" },
  { prefix: "/admin/forms-manager", scope: "full-console" },
  { prefix: "/admin/production-queue", scope: "full-console" },
];

export function getRequiredAdminScopeForPath(pathname: string): AdminScope | null {
  const path = pathname.split("?")[0].trim() || "/";

  if (path === "/admin") {
    return "full-console";
  }

  const match = ADMIN_ROUTE_SCOPES.find(
    (entry) => path === entry.prefix || path.startsWith(`${entry.prefix}/`),
  );
  return match ? match.scope : "dashboard";
}

export function accountCanAccessAdminPath(
  account: AdminAccount | null | undefined,
  pathname: string,
): boolean {
  const scope = getRequiredAdminScopeForPath(pathname);
  if (scope === null) return true;
  return accountHasAdminScope(account, scope);
}
