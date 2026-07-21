export const TALISBOOKS_ROUTES = {
  HOME: "/talisbooks",
  DASHBOARD: "/talisbooks/dashboard",
  DASHBOARD_BOOKS: "/talisbooks/dashboard/books",
  DASHBOARD_PAGES: "/talisbooks/dashboard/pages",
  DASHBOARD_TEMPLATES: "/talisbooks/dashboard/templates",
  DASHBOARD_IMAGES: "/talisbooks/dashboard/images",
  DASHBOARD_LAYOUTS: "/talisbooks/dashboard/layouts",
  DASHBOARD_AUTHORS: "/talisbooks/dashboard/authors",
  DASHBOARD_SETTINGS: "/talisbooks/dashboard/settings",
  LIBRARY: "/talisbooks/library",
  EDITOR: "/talisbooks/editor",
  VIEWER: "/talisbooks/viewer",
  SETTINGS: "/talisbooks/settings",
  ADMIN: "/admin/talisbooks",
  ADMIN_CENTERFOLDS: "/admin/talisbooks/centerfolds",
  CLIENT_BOOKS: "/client/books",
} as const;

export type TalisBooksRouteKey = keyof typeof TALISBOOKS_ROUTES;
