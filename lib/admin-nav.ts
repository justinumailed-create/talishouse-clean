import type { AdminAccessLevel, AdminScope } from "./admin-constants";
import { sanitizeAgentScopes } from "./admin-constants";

export type AdminNavItem = {
  href: string;
  label: string;
};

/** Site-ops tools: Dashboard, build requests, Mapsites, SEO, bookshelves. */
export const ADMIN_SITE_OPS_NAV: readonly AdminNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/build-requests", label: "Build requests" },
  { href: "/admin/mapsites", label: "Mapsites" },
  { href: "/admin/seo", label: "SEO" },
  { href: "/admin/talisbooks/bookshelves", label: "Bookshelves" },
];

/** SUPERADMIN product tools: FAST Codes. */
export const ADMIN_SUPERADMIN_NAV: readonly AdminNavItem[] = [
  { href: "/admin/fast-codes", label: "FAST Codes" },
  { href: "/admin/pmc", label: "PMC pins" },
  { href: "/admin/agents", label: "Agents" },
];

/** Agent Admin nav: own dashboard plus one entry per granted privilege. */
export function getAgentNavItems(scopes: readonly string[] | null | undefined): AdminNavItem[] {
  const granted = new Set<AdminScope>(sanitizeAgentScopes(scopes ?? []));
  const items: AdminNavItem[] = [{ href: "/admin/agent", label: "My dashboard" }];
  if (granted.has("agent-pages")) items.push({ href: "/admin/agent/page", label: "My page" });
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

const ADMIN_FULL_EXTRA_NAV: readonly AdminNavItem[] = [
  { href: "/admin/registrations", label: "Registrations" },
  { href: "/admin/marketing", label: "Marketing" },
  { href: "/admin/contact-from-leads", label: "Contact from leads" },
];

export function getAdminNavItems(
  access: AdminAccessLevel | null | undefined,
  scopes?: readonly string[] | null,
): AdminNavItem[] {
  if (access === "agent") {
    return getAgentNavItems(scopes);
  }
  if (access === "full") {
    return [...ADMIN_SITE_OPS_NAV, ...ADMIN_SUPERADMIN_NAV, ...ADMIN_FULL_EXTRA_NAV];
  }
  if (access === "superadmin") {
    return [...ADMIN_SITE_OPS_NAV, ...ADMIN_SUPERADMIN_NAV];
  }
  return [...ADMIN_SITE_OPS_NAV];
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
