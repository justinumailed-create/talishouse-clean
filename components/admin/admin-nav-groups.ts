import type { AdminNavItem } from "@/lib/admin-nav";

/** Visual grouping for the admin sidebar. Items still come from getAdminNavItems (permissions unchanged). */
const GROUP_OF: Record<string, string> = {
  "/admin/dashboard": "Overview",
  "/admin/notifications": "Overview",
  "/admin/agent": "Workspace",
  "/admin/agent/notes": "Workspace",
  "/admin/agent/chat": "Workspace",
  "/admin/build-requests": "Operations",
  "/admin/registrations": "Operations",
  "/admin/marketing": "Operations",
  "/admin/contact-from-leads": "Operations",
  "/admin/leads": "Operations",
  "/admin/mapsites": "Mapsites & content",
  "/admin/seo": "Mapsites & content",
  "/admin/talisbooks": "Mapsites & content",
  "/admin/talisbooks/bookshelves": "Mapsites & content",
  "/admin/pmc": "Mapsites & content",
  "/admin/fast-codes": "Superadmin",
  "/admin/agents": "Superadmin",
};
const ORDER = ["Overview", "Workspace", "Operations", "Mapsites & content", "Superadmin", "More"];

export function groupAdminNav(items: readonly AdminNavItem[]): Array<{ title: string; items: AdminNavItem[] }> {
  const map = new Map<string, AdminNavItem[]>();
  for (const item of items) {
    const g = GROUP_OF[item.href] ?? "More";
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(item);
  }
  return ORDER.filter((g) => map.has(g)).map((title) => ({ title, items: map.get(title)! }));
}

/** 24×24 stroke icon path per nav href (falls back to a dot). */
export const NAV_ICON: Record<string, string> = {
  "/admin/dashboard": "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z",
  "/admin/notifications": "M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0",
  "/admin/agent": "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z",
  "/admin/agent/notes": "M7 3h7l5 5v13H7V3Zm7 0v5h5M10 13h6M10 17h6",
  "/admin/agent/chat": "M4 5h16v11H8l-4 4V5Z",
  "/admin/build-requests": "M4 7h16M4 12h16M4 17h10",
  "/admin/registrations": "M9 5h6M9 3h6v4H9V3ZM6 5H5v16h14V5h-1M9 12h6M9 16h4",
  "/admin/marketing": "M3 11v2l13 5V6L3 11Zm13-5 4-2v16l-4-2",
  "/admin/contact-from-leads": "M4 6h16v12H4V6Zm0 0 8 7 8-7",
  "/admin/leads": "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0ZM4 21a8 8 0 0 1 16 0",
  "/admin/mapsites": "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14",
  "/admin/seo": "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm10 3-5-5",
  "/admin/talisbooks": "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm0 14a2 2 0 0 1 2-2h13",
  "/admin/talisbooks/bookshelves": "M4 4h4v16H4V4Zm6 0h4v16h-4V4Zm6.5 1 3.5 1-3.5 14-3.5-1 3.5-14Z",
  "/admin/pmc": "M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  "/admin/fast-codes": "M15 7a4 4 0 1 1-3.9 5H8v3H5v-3H3V9h8.1A4 4 0 0 1 15 7Z",
  "/admin/agents": "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 9a6 6 0 0 1 12 0M17 11a3 3 0 1 0 0-6M21 20a6 6 0 0 0-4-5.7",
};
