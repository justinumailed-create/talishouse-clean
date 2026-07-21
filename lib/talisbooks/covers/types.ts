import type { TalisBooksCoverTemplateId } from "./constants";

export type TalisBooksCoverTitlePlacement =
  | "hero-center"
  | "bottom-band"
  | "top-band"
  | "top-left-bottom-right"
  | "hero-lower-left";

export type TalisBooksCoverTextAlign = "left" | "center" | "right";

export interface TalisBooksCoverMargins {
  top: number;
  bottom: number;
  unit: "ratio";
}

export interface TalisBooksCoverTypography {
  titleWeight: 500 | 600 | 700;
  titleTracking: string;
  titleCase: "none" | "uppercase";
  subtitleWeight: 300 | 400 | 500;
  subtitleTracking: string;
}

export interface TalisBooksCoverTemplateDefinition {
  id: TalisBooksCoverTemplateId;
  slug: string;
  name: string;
  description: string;
  templateType: "cover";
  layoutType: "cover";
  titlePlacement: TalisBooksCoverTitlePlacement;
  titleAlign: TalisBooksCoverTextAlign;
  subtitleAlign: TalisBooksCoverTextAlign;
  margins: TalisBooksCoverMargins;
  typography: TalisBooksCoverTypography;
  cssClasses: string;
  previewGradient: string;
  config: {
    hero: { fit: "cover"; role: "hero" };
    regions: {
      topMargin: "white";
      bottomMargin: "white";
      hero: "image";
    };
    fields: ["title", "subtitle", "heroImage"];
  };
}

export interface TalisBooksCoverContent {
  title: string;
  subtitle: string;
  heroImageUrl: string;
  heroImageAlt?: string;
}
