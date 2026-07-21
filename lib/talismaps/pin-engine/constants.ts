import type { TalisMapsPinKind } from "./types";

export const PIN_KIND_CONFIG: Record<
  TalisMapsPinKind,
  { label: string; color: string; description: string }
> = {
  root: {
    label: "Root PIN",
    color: "#F59E0B",
    description: "Primary market anchor for a root account map.",
  },
  derivative: {
    label: "Derivative PIN",
    color: "#22C55E",
    description: "Network child placement linked to a derivative account.",
  },
  adpro: {
    label: "Adpro PIN",
    color: "#3B82F6",
    description: "Professional services placement on the map.",
  },
  property: {
    label: "Property Listing PIN",
    color: "#8B5CF6",
    description: "Active property listing with media and publishing controls.",
  },
};

export const DEFAULT_EDITOR_MAP_SLUG = "editor-draft";

export const DEFAULT_PIN_CATEGORIES = [
  { slug: "root", name: "Root", color: "#F59E0B" },
  { slug: "derivative", name: "Derivative", color: "#22C55E" },
  { slug: "adpro", name: "Adpro", color: "#3B82F6" },
  { slug: "property", name: "Property", color: "#8B5CF6" },
] as const;
