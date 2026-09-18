import type { AdminAccessLevel } from "./admin-constants";

export type AdminNavItem = {
  href: string;
  label: string;
};

/** Site-ops tools: Dashboard, build requests, Mapsites, SEO, bookshelves. */
export const ADMIN_SITE_OPS_NAV: readonly AdminNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/build-requests", label: "Build requests" },
  { href: "/admin/mapsites", label: "Mapsites" },
  { href: "/admin/seo", label: "SEO" },
  { href: "/admin/talisbooks/bookshelves", label: "Bookshelves" },
];

/** SUPERADMIN product tools: FAST Codes. */
export const ADMIN_SUPERADMIN_NAV: readonly AdminNavItem[] = [
  { href: "/admin/fast-codes", label: "FAST Codes" },
];

const ADMIN_FULL_EXTRA_NAV: readonly AdminNavItem[] = [
  { href: "/admin/registrations", label: "Registrations" },
  { href: "/admin/marketing", label: "Marketing" },
];

export function getAdminNavItems(access: AdminAccessLevel | null | undefined): AdminNavItem[] {
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

  if (href === "/admin/dashboard") {
    if (pathname.startsWith("/admin/talismaps")) return true;
    if (
      pathname.startsWith("/admin/talisbooks") &&
      !pathname.startsWith("/admin/talisbooks/bookshelves")
    ) {
      return true;
    }
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
