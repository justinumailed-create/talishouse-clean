import {
  BookOpen,
  FileText,
  Image,
  LayoutDashboard,
  LayoutTemplate,
  Library,
  Settings,
  Shapes,
  Users,
} from "lucide-react";
import { TALISBOOKS_ROUTES } from "./routes";
import { TALISBOOKS_ECOSYSTEM_CHAIN, TALISBOOKS_TABLE_MAP } from "./ecosystem";

export { TALISBOOKS_ECOSYSTEM_CHAIN, TALISBOOKS_TABLE_MAP };
export type { TalisBooksDomainModel, TalisBooksEcosystemLinks } from "./ecosystem";

export const TALISBOOKS_PRODUCT_NAME = "TalisBooks™";

export const TALISBOOKS_SIDEBAR_ITEMS = [
  { href: TALISBOOKS_ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { href: TALISBOOKS_ROUTES.LIBRARY, label: "Library", icon: Library },
  { href: TALISBOOKS_ROUTES.DASHBOARD_BOOKS, label: "Books", icon: BookOpen },
  { href: TALISBOOKS_ROUTES.DASHBOARD_PAGES, label: "Pages", icon: FileText },
  { href: TALISBOOKS_ROUTES.DASHBOARD_TEMPLATES, label: "Templates", icon: Shapes },
  { href: TALISBOOKS_ROUTES.DASHBOARD_IMAGES, label: "Images", icon: Image },
  { href: TALISBOOKS_ROUTES.DASHBOARD_LAYOUTS, label: "Layouts", icon: LayoutTemplate },
  { href: TALISBOOKS_ROUTES.DASHBOARD_AUTHORS, label: "Authors", icon: Users },
  { href: TALISBOOKS_ROUTES.DASHBOARD_SETTINGS, label: "Settings", icon: Settings },
] as const;

export const TALISBOOKS_DATABASE_MODELS = [
  "books",
  "book_pages",
  "book_templates",
  "book_media",
  "book_assets",
  "book_themes",
  "book_analytics",
  "book_versions",
  "book_settings",
] as const;

export const TALISBOOKS_FUTURE_FEATURES = [
  "Book Editor",
  "MapSites™ Integration",
  "TalisTV™ Video Shelf (TTV)",
  "FAST Code Libraries",
  "Template Marketplace",
  "Media Library",
  "Theme Engine",
  "Version History",
  "Publish Workflows",
  "Client Portal",
  "Audio Narration",
] as const;

/**
 * Official brokerage publish sequence (scaffolded — not used by FSBO demo).
 * Book size: 12–22 pages (10–20 content + front cover + back cover).
 * Pages 2–3 require full brokerage compliance; final page duplicates page 3.
 *
 * Live sample / FSBO onboarding uses TALISBOOKS_FSBO_DEMO_PAGE_STRUCTURE instead.
 */
export const TALISBOOKS_PAGE_STRUCTURE = [
  { page: 1, role: "cover", label: "Cover" },
  {
    page: 2,
    role: "agent_brokerage",
    label: "Brokerage + Agent (compliance)",
  },
  {
    page: 3,
    role: "agent_brokerage",
    label: "Brokerage + Agent (compliance)",
  },
  { page: "4–21", role: "property_content", label: "Property Content" },
  { page: "final", role: "agent_brokerage", label: "Duplicate Page 3 layout" },
] as const;

/**
 * FSBO demonstration sequence (sample viewer + owner-seller onboarding).
 * Broker branding and pages 2–3 brokerage layouts are intentionally omitted.
 * Permanent Glasshouse™ brochure pages always sit before the back cover.
 */
export const TALISBOOKS_FSBO_DEMO_PAGE_STRUCTURE = [
  { page: 1, role: "cover", label: "Cover" },
  { page: 2, role: "property_content", label: "MapSite™ location" },
  { page: "3–(n-3)", role: "property_content", label: "Property story" },
  {
    page: "(n-2)–(n-1)",
    role: "property_content",
    label: "Glasshouse™ brochure (permanent)",
  },
  { page: "final", role: "cover", label: "Soft back cover" },
] as const;

/** Mandatory brokerage fields on pages 2, 3, and the final page. */
export const TALISBOOKS_BROKERAGE_COMPLIANCE_FIELDS = [
  "Broker logo",
  "Broker name",
  "Agent photo",
  "Agent contact information",
  "Headline",
  "Biography",
] as const;
