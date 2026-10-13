import type { AdminAccount, AdminScope } from "./admin-constants";
import { accountHasAdminScope, sanitizeAgentScopes } from "./admin-constants";

export type AdminNavItem = {
  href: string;
  label: string;
};

/**
 * FAST-code admin nav (Global Admin + granted admins). Each entry is shown only
 * when the account holds its scope; the Global Admin holds every scope.
 */
export const ADMIN_SCOPED_NAV: ReadonlyArray<AdminNavItem & { scope: AdminScope }> = [
  { href: "/admin/dashboard", label: "Dashboard", scope: "dashboard" },
  { href: "/admin/notifications", label: "Notifications", scope: "dashboard" },
  { href: "/admin/build-requests", label: "Build requests", scope: "build-requests" },
  { href: "/admin/registrations", label: "Registrations", scope: "registrations" },
  { href: "/admin/marketing", label: "Marketing", scope: "marketing" },
  { href: "/admin/leads", label: "Leads", scope: "leads" },
  { href: "/admin/contact-from-leads", label: "Contact from leads", scope: "leads" },
  { href: "/admin/mapsites", label: "Mapsites", scope: "mapsites" },
  { href: "/admin/seo", label: "SEO", scope: "seo" },
  { href: "/admin/talisbooks/bookshelves", label: "Bookshelves", scope: "talisbooks" },
  { href: "/admin/pmc", label: "PMC pins", scope: "pmc-pins" },
  { href: "/admin/payments", label: "Payments", scope: "payments" },
  { href: "/admin/fast-codes", label: "FAST Codes", scope: "fast-codes" },
  { href: "/admin/agents", label: "Agents", scope: "agents" },
  { href: "/admin/access", label: "Admin access", scope: "admin-access" },
];

/** Agent Admin nav: own dashboard plus one entry per granted privilege. */
export function getAgentNavItems(scopes: readonly string[] | null | undefined): AdminNavItem[] {
  const granted = new Set<AdminScope>(sanitizeAgentScopes(scopes ?? []));
  const items: AdminNavItem[] = [
    { href: "/admin/agent", label: "My dashboard" },
    { href: "/admin/agent/notes", label: "Daily notes" },
    { href: "/chat", label: "Chat" },
  ];
  if (granted.has("mapsites")) {
    items.push({ href: "/admin/mapsites", label: "Mapsites" });
    items.push({ href: "/admin/seo", label: "SEO" });
  }
  if (granted.has("build-requests")) items.push({ href: "/admin/build-requests", label: "Build requests" });
  if (granted.has("talisbooks")) {
    items.push({ href: "/admin/talisbooks", label: "Talisbooks™" });
    items.push({ href: "/admin/talisbooks/bookshelves", label: "Bookshelves" });
  }
  if (granted.has("leads")) items.push({ href: "/admin/leads", label: "Leads" });
  return items;
}

/** Sidebar items for any admin account, from its scopes (never from a role name). */
export function getAdminNavItems(account: AdminAccount | null | undefined): AdminNavItem[] {
  if (!account) return [];
  if (account.access === "agent") {
    return getAgentNavItems(account.scopes);
  }
  const items: AdminNavItem[] = ADMIN_SCOPED_NAV.filter((item) =>
    accountHasAdminScope(account, item.scope),
  ).map(({ href, label }) => ({ href, label }));
  // Chat stays available to every FAST-code admin (as before).
  items.push({ href: "/chat", label: "Chat" });
  return items;
}

export function isAdminNavItemActive(href: string, pathname: string): boolean {
  if (pathname === href) return true;

  if (href === "/admin/agents" && pathname.startsWith("/admin/agents/")) {
    return true;
  }

  if (href === "/admin/dashboard") {
    if (pathname.startsWith("/admin/talismaps")) return true;
    if (
      pathname.startsWith("/admin/talisbooks") &&
      !pathname.startsWith("/admin/talisbooks/bookshelves")
    ) {
      return true;
    }
  }

  if (href === "/admin/notifications" && pathname.startsWith("/admin/notifications")) {
    return true;
  }

  if (href === "/admin/mapsites" && pathname.startsWith("/admin/mapsites/")) {
    return true;
  }

  if (href === "/admin/seo" && pathname.startsWith("/admin/seo")) {
    return true;
  }

  if (href === "/admin/build-requests" && pathname.startsWith("/admin/marketing")) {
    return true;
  }

  if (href === "/admin/platform-content") {
    return (
      pathname.startsWith("/admin/platform-content") ||
      pathname.startsWith("/talispros/marketing")
    );
  }

  if (href === "/admin/access" && pathname.startsWith("/admin/access")) {
    return true;
  }

  if (href === "/admin/fast-codes" && pathname.startsWith("/admin/fast-codes")) {
    return true;
  }

  if (href === "/admin/talisbooks/bookshelves") {
    return pathname.startsWith("/admin/talisbooks/bookshelves");
  }

  if (
    href === "/admin/talisbooks" &&
    pathname.startsWith("/admin/talisbooks/") &&
    !pathname.startsWith("/admin/talisbooks/bookshelves")
  ) {
    return true;
  }

  return false;
}
