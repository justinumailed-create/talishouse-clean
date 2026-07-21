import type { LucideIcon } from "lucide-react";
import {
  Download,
  Image,
  Layers,
  Map,
  MapPin,
  Shapes,
} from "lucide-react";

export type TalisMapsEditorSidebarPanelId =
  | "maps"
  | "pins"
  | "categories"
  | "layers"
  | "media"
  | "imports";

export type TalisMapsEditorInspectorSectionId =
  | "selected-pin"
  | "coordinates"
  | "appearance"
  | "media"
  | "description"
  | "publishing";

export interface TalisMapsEditorNavItem<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const TALISMAPS_EDITOR_SIDEBAR_PANELS: TalisMapsEditorNavItem<TalisMapsEditorSidebarPanelId>[] =
  [
    {
      id: "maps",
      label: "Maps",
      icon: Map,
      description: "Switch between map instances and drafts.",
    },
    {
      id: "pins",
      label: "Pins",
      icon: MapPin,
      description: "Browse and select pins on the canvas.",
    },
    {
      id: "categories",
      label: "Categories",
      icon: Shapes,
      description: "Organize pin categories and colors.",
    },
    {
      id: "layers",
      label: "Layers",
      icon: Layers,
      description: "Control visibility and stacking order.",
    },
    {
      id: "media",
      label: "Media",
      icon: Image,
      description: "Manage images and attachments.",
    },
    {
      id: "imports",
      label: "Imports",
      icon: Download,
      description: "Import from Atlist and bulk sources.",
    },
  ];

export const TALISMAPS_EDITOR_INSPECTOR_SECTIONS: TalisMapsEditorNavItem<TalisMapsEditorInspectorSectionId>[] =
  [
    {
      id: "selected-pin",
      label: "Selected PIN",
      icon: MapPin,
      description: "Identity and type for the active pin.",
    },
    {
      id: "coordinates",
      label: "Coordinates",
      icon: Map,
      description: "Latitude, longitude, and map position.",
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: Shapes,
      description: "Icon, color, and category styling.",
    },
    {
      id: "media",
      label: "Media",
      icon: Image,
      description: "Photos and files attached to the pin.",
    },
    {
      id: "description",
      label: "Description",
      icon: Layers,
      description: "Copy, contact details, and metadata.",
    },
    {
      id: "publishing",
      label: "Publishing",
      icon: Download,
      description: "Visibility, status, and go-live controls.",
    },
  ];
