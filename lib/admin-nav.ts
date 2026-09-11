import type { AdminAccessLevel } from "./admin-constants";

export type AdminNavItem = {
  href: string;
  label: string;
};

/** Capabilities Ralph needs today: site CMS, build requests, Mapsites, Talisbooks / shelves. */
export const ADMIN_SITE_OPS_NAV: readonly AdminNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/build-requests", label: "Build requests" },
  { href: "/admin/mapsites", label: "Mapsites" },
  { href: "/admin/talisbooks", label: "Talisbooks™" },
  { href: "/admin/talisbooks/bookshelves", label: "Bookshelves" },
];

const ADMIN_FULL_EXTRA_NAV: readonly AdminNavItem[] = [
  { href: "/admin/associates", label: "Associates" },
  { href: "/admin/talisbot", label: "TalisBOT" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/leads-simulation", label: "Leads Simulation" },
  { href: "/admin/deals", label: "Deals" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/applications", label: "Associate Apps" },
  { href: "/admin/project-applications", label: "Project Apps" },
  { href: "/admin/registrations", label: "Registrations" },
  { href: "/admin/marketing", label: "Marketing" },
  { href: "/admin/talismaps", label: "Talismaps™" },
];

export function getAdminNavItems(access: AdminAccessLevel | null | undefined): AdminNavItem[] {
  if (access === "full") {
    return [...ADMIN_SITE_OPS_NAV, ...ADMIN_FULL_EXTRA_NAV];
  }
  return [...ADMIN_SITE_OPS_NAV];
}

export function isAdminNavItemActive(href: string, pathname: string): boolean {
  if (pathname === href) return true;

  if (href === "/admin/mapsites" && pathname.startsWith("/admin/mapsites/")) {
    return true;
  }

  if (href === "/admin/build-requests" && pathname.startsWith("/admin/marketing")) {
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
