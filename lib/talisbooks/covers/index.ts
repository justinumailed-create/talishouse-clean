export {
  TALISBOOKS_COVER_ASPECT_RATIO,
  TALISBOOKS_COVER_MARGIN_RATIO,
  TALISBOOKS_COVER_TEMPLATE_IDS,
  type TalisBooksCoverTemplateId,
} from "./constants";
export {
  TALISBOOKS_COVER_TEMPLATES,
  TALISBOOKS_COVER_TEMPLATE_LIST,
} from "./catalog";
export {
  getCoverTemplateById,
  getCoverTemplateBySlug,
  isTalisBooksCoverTemplateId,
  listCoverTemplates,
  selectCoverTemplate,
  selectRandomCoverTemplate,
} from "./select";
export type {
  TalisBooksCoverContent,
  TalisBooksCoverMargins,
  TalisBooksCoverTemplateDefinition,
  TalisBooksCoverTextAlign,
  TalisBooksCoverTitlePlacement,
  TalisBooksCoverTypography,
} from "./types";
