export const TALISMAPS_ROUTES = {
  HOME: "/talismaps",
  DASHBOARD: "/talismaps/dashboard",
  DASHBOARD_MAPS: "/talismaps/dashboard/maps",
  DASHBOARD_PINS: "/talismaps/dashboard/pins",
  DASHBOARD_MEDIA: "/talismaps/dashboard/media",
  DASHBOARD_ANALYTICS: "/talismaps/dashboard/analytics",
  DASHBOARD_THEMES: "/talismaps/dashboard/themes",
  DASHBOARD_TEMPLATES: "/talismaps/dashboard/templates",
  DASHBOARD_IMPORTS: "/talismaps/dashboard/imports",
  DASHBOARD_SETTINGS: "/talismaps/dashboard/settings",
  EDITOR: "/talismaps/editor",
  SETTINGS: "/talismaps/settings",
  ADMIN: "/admin/talismaps",
} as const;

export type TalisMapsRouteKey = keyof typeof TALISMAPS_ROUTES;
