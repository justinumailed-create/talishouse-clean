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

export function resolvePinVisual(
  props: TalisMapsPinVisualProps = {}
): ResolvedTalisMapsPinVisual {
  const selectedState = Boolean(props.selectedState);
  const pinSize = resolvePinSize(props.pinSize, selectedState);
  const ringRadius = pinSize * 0.34;
  const centerRadius = pinSize * 0.168;
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
