import type {
  ResolvedTalisMapsPinVisual,
  TalisMapsPinAnimation,
  TalisMapsPinSize,
  TalisMapsPinVisualProps,
} from "./types";

/** Previous default body was 44px; new default is ~1.5×. */
export const TALISMAPS_PIN_BASE_SIZE = 66;
export const TALISMAPS_PIN_SELECTED_SIZE = 78;

export const TALISMAPS_PIN_DEFAULT_COLOR = "#1C1C1E";
export const TALISMAPS_PIN_DEFAULT_BORDER = "rgba(255,255,255,0.92)";
export const TALISMAPS_PIN_DEFAULT_ICON = "dot";

/**
 * Logo fill of the pin body. Was 0.64 (~18% inset); now 0.50 so ~25% of the
 * diameter is white margin around the logo. Pair with larger body sizes (or
 * LOGO_BODY_SCALE) so the logo stays about the same absolute pixel size.
 */
export const TALISMAPS_PIN_LOGO_RATIO = 0.5;

/** Previous logo ratio — used to grow logo-marker bodies without shrinking the art. */
export const TALISMAPS_PIN_LOGO_RATIO_LEGACY = 0.64;

/** Grow factor applied to preset/default bodies when a custom logo is present. */
export const TALISMAPS_PIN_LOGO_BODY_SCALE =
  TALISMAPS_PIN_LOGO_RATIO_LEGACY / TALISMAPS_PIN_LOGO_RATIO;

/** Classic pin colored ring outer radius as a fraction of body size. */
export const TALISMAPS_PIN_RING_RATIO = 0.34;

/**
 * White-center radius as a fraction of body size. Was 0.168 (ring thickness
 * 0.172). Halved ring thickness → 0.34 - 0.086 = 0.254.
 */
export const TALISMAPS_PIN_CENTER_RATIO = 0.254;

/** Classic pin hairline border stroke width (px). Was 1; halved to 0.5. */
export const TALISMAPS_PIN_BORDER_WIDTH = 0.5;

const SIZE_PRESETS: Record<Exclude<TalisMapsPinSize, number>, number> = {
  sm: 54,
  md: TALISMAPS_PIN_BASE_SIZE,
  lg: 84,
};

export function resolvePinSize(
  size: TalisMapsPinSize | null | undefined,
  selected: boolean
): number {
  let base: number;
  if (typeof size === "number" && Number.isFinite(size) && size > 0) {
    base = size;
  } else if (size === "sm" || size === "md" || size === "lg") {
    base = SIZE_PRESETS[size];
  } else {
    base = TALISMAPS_PIN_BASE_SIZE;
  }

  if (selected && typeof size !== "number") {
    return Math.round(base * (TALISMAPS_PIN_SELECTED_SIZE / TALISMAPS_PIN_BASE_SIZE));
  }

  return Math.round(base);
}

export function pinLogoSizePx(bodySize: number): number {
  return Math.max(8, Math.round(bodySize * TALISMAPS_PIN_LOGO_RATIO));
}

/** CSS % inset for a centered logo at TALISMAPS_PIN_LOGO_RATIO. */
export function pinLogoInsetPercent(): number {
  return ((1 - TALISMAPS_PIN_LOGO_RATIO) / 2) * 100;
}

export function resolvePinVisual(
  props: TalisMapsPinVisualProps = {}
): ResolvedTalisMapsPinVisual {
  const selectedState = Boolean(props.selectedState);
  const hasCustomLogo = Boolean(props.customLogoUrl?.trim());
  let pinSize = resolvePinSize(props.pinSize, selectedState);
  // Preset/default bodies grow when hosting a logo so absolute logo px stay stable
  // after the fill ratio drop (0.64 → 0.50). Explicit numeric pinSize is left alone
  // (callers that pass px already account for the new geometry).
  if (hasCustomLogo && typeof props.pinSize !== "number") {
    pinSize = Math.round(pinSize * TALISMAPS_PIN_LOGO_BODY_SCALE);
  }
  const ringRadius = pinSize * TALISMAPS_PIN_RING_RATIO;
  const centerRadius = pinSize * TALISMAPS_PIN_CENTER_RATIO;
  const iconScale = pinSize / 120;

  const animation: TalisMapsPinAnimation =
    props.pinAnimation === "pulse" ||
    props.pinAnimation === "breathe" ||
    props.pinAnimation === "none"
      ? props.pinAnimation
      : "none";

  return {
    pinColor: props.pinColor?.trim() || TALISMAPS_PIN_DEFAULT_COLOR,
    pinBorderColor: props.pinBorderColor?.trim() || TALISMAPS_PIN_DEFAULT_BORDER,
    pinIcon: props.pinIcon?.trim() || TALISMAPS_PIN_DEFAULT_ICON,
    whiteCenter: props.whiteCenter !== false,
    pinSize,
    pinLabel: props.pinLabel?.trim() || null,
    pinAnimation: animation,
    selectedState,
    categoryBadge: props.categoryBadge?.trim() || null,
    customLogoUrl: props.customLogoUrl?.trim() || null,
    bodySize: pinSize,
    ringRadius,
    centerRadius,
    iconScale,
  };
}
