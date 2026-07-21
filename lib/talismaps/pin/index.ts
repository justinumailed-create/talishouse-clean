export type {
  ResolvedTalisMapsPinVisual,
  TalisMapsPinAnimation,
  TalisMapsPinIcon,
  TalisMapsPinSize,
  TalisMapsPinVisualProps,
} from "./types";

export {
  TALISMAPS_PIN_BASE_SIZE,
  TALISMAPS_PIN_DEFAULT_BORDER,
  TALISMAPS_PIN_DEFAULT_COLOR,
  TALISMAPS_PIN_DEFAULT_ICON,
  TALISMAPS_PIN_SELECTED_SIZE,
  resolvePinSize,
  resolvePinVisual,
} from "./defaults";

export { TALISMAPS_PIN_ICON_PATHS, getPinIconPath } from "./icons";

export {
  buildPinBodySvg,
  escapePinHtml,
  pinVisualCacheKey,
  renderPinMarkerHtml,
  type PinMarkerRenderResult,
} from "./render-html";
