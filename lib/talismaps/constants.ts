import {
  BarChart3,
  Download,
  Image,
  LayoutDashboard,
  Map,
  MapPin,
  Palette,
  Settings,
  Shapes,
} from "lucide-react";
import { TALISMAPS_ROUTES } from "./routes";

export const TALISMAPS_PRODUCT_NAME = "Talismaps™";

export const TALISMAPS_SIDEBAR_ITEMS = [
  { href: TALISMAPS_ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { href: TALISMAPS_ROUTES.DASHBOARD_MAPS, label: "Maps", icon: Map },
  { href: TALISMAPS_ROUTES.DASHBOARD_PINS, label: "Pins", icon: MapPin },
  { href: TALISMAPS_ROUTES.DASHBOARD_MEDIA, label: "Media", icon: Image },
  { href: TALISMAPS_ROUTES.DASHBOARD_ANALYTICS, label: "Analytics", icon: BarChart3 },
  { href: TALISMAPS_ROUTES.DASHBOARD_THEMES, label: "Themes", icon: Palette },
  { href: TALISMAPS_ROUTES.DASHBOARD_TEMPLATES, label: "Templates", icon: Shapes },
  { href: TALISMAPS_ROUTES.DASHBOARD_IMPORTS, label: "Imports", icon: Download },
  { href: TALISMAPS_ROUTES.DASHBOARD_SETTINGS, label: "Settings", icon: Settings },
] as const;

export const TALISMAPS_FUTURE_FEATURES = [
  "Root Accounts",
  "Derivative Accounts",
  "Adpro PINs",
  "Property Listings",
  "Interactive Maps",
  "Search",
  "Categories",
  "QR Codes",
  "Analytics",
  "Marketing Integrations",
] as const;
