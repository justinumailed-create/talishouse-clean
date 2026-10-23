import type { AdminAccount, AdminScope } from "./admin-constants";
import { accountHasAdminScope } from "./admin-constants";

const ADMIN_ROUTE_SCOPES: ReadonlyArray<{ prefix: string; scope: AdminScope | null }> = [
  { prefix: "/admin/login", scope: null },
  // Agent's own dashboard: any signed-in admin account (page adapts).
  // Agent-only tools (pages also require an agent session themselves).
  { prefix: "/admin/agent/notes", scope: null },
  { prefix: "/admin/agent/chat", scope: null },
  { prefix: "/admin/agent/leads", scope: "leads-crm" },
  { prefix: "/admin/agents", scope: "agents" },
  { prefix: "/admin/access", scope: "admin-access" },
  { prefix: "/admin/talismaps", scope: "mapsites" },
  { prefix: "/admin/platform-content", scope: "platform-content" },
  { prefix: "/admin/fast-codes", scope: "fast-codes" },
  { prefix: "/admin/content", scope: "site-content" },
  { prefix: "/admin/build-requests", scope: "build-requests" },
  { prefix: "/admin/marketing", scope: "marketing" },
  { prefix: "/admin/mapsites", scope: "mapsites" },
  { prefix: "/admin/contracts", scope: "mapsites" },
  { prefix: "/admin/pmc", scope: "pmc-pins" },
  { prefix: "/admin/seo", scope: "seo" },
  { prefix: "/admin/talisbooks", scope: "talisbooks" },
  { prefix: "/admin/bookshelves", scope: "talisbooks" },
  { prefix: "/admin/products", scope: "platform-content" },
  { prefix: "/admin/notifications", scope: "dashboard" },
  { prefix: "/admin/dashboard", scope: "dashboard" },
  { prefix: "/admin/talisbot", scope: "full-console" },
  { prefix: "/admin/leads-simulation", scope: "full-console" },
  { prefix: "/admin/leads", scope: "leads" },
  { prefix: "/admin/contact-from-leads", scope: "leads" },
  { prefix: "/admin/deals", scope: "full-console" },
  { prefix: "/admin/users", scope: "full-console" },
  { prefix: "/admin/registrations", scope: "registrations" },
  { prefix: "/admin/pricing", scope: "full-console" },
  { prefix: "/admin/payments", scope: "payments" },
  { prefix: "/admin/projects", scope: "full-console" },
  { prefix: "/admin/forms-manager", scope: "full-console" },
  { prefix: "/admin/production-queue", scope: "full-console" },
];

export function getRequiredAdminScopeForPath(pathname: string): AdminScope | null {
  const path = pathname.split("?")[0].trim() || "/";

  if (path === "/admin") {
    return "full-console";
  }

  if (path === "/admin/agent") {
    return null;
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
