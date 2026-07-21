export {
  TALISBOOKS_DOUBLE_IMAGE_COUNT,
  TALISBOOKS_GALLERY_MAX_IMAGES,
  TALISBOOKS_LAYOUT_ENGINE_VERSION,
  TALISBOOKS_LAYOUT_PLACEMENTS,
  TALISBOOKS_MEDIA_KINDS,
} from "./constants";
export { classifyLayoutAsset, classifyLayoutAssets } from "./classify";
export { decidePlacementForAsset, decidePlacements, preferCenterfoldHalves } from "./decide";
export {
  generatePageFromDecision,
  generatePagesFromDecisions,
  pagesNeededForDecision,
} from "./generate-pages";
export {
  generateBookPagesFromUploads,
  maxPropertyPageBudget,
  minPropertyPageBudget,
  propertyPagesFitBookRules,
} from "./generate-book";
export type {
  GenerateBookPagesOptions,
  TalisBooksClassifiedAsset,
  TalisBooksGeneratedPage,
  TalisBooksGeneratedPageContent,
  TalisBooksLayoutDecision,
  TalisBooksLayoutEngineResult,
  TalisBooksLayoutImageRef,
  TalisBooksLayoutOrientation,
  TalisBooksLayoutPlacement,
  TalisBooksMediaKind,
  TalisBooksPlacementSlot,
} from "./types";
