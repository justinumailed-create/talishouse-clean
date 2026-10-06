export type {
  ResolvedTalisMapsPinVisual,
  TalisMapsPinAnimation,
  TalisMapsPinIcon,
  TalisMapsPinSize,
  TalisMapsPinVisualProps,
} from "./types";

export {
  TALISMAPS_PIN_BASE_SIZE,
  TALISMAPS_PIN_BORDER_WIDTH,
  TALISMAPS_PIN_CENTER_RATIO,
  TALISMAPS_PIN_DEFAULT_BORDER,
  TALISMAPS_PIN_DEFAULT_COLOR,
  TALISMAPS_PIN_DEFAULT_ICON,
  TALISMAPS_PIN_LOGO_BODY_SCALE,
  TALISMAPS_PIN_LOGO_RATIO,
  TALISMAPS_PIN_RING_RATIO,
  TALISMAPS_PIN_SELECTED_SIZE,
  pinLogoInsetPercent,
  pinLogoSizePx,
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
