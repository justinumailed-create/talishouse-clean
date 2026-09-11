/**
 * Mapsite™ / published PIN visuals — same defaults as the Build / Claim form
 * (`defaultHomePinLocationValues` in `components/build-mapsite/home-pin-types.ts`).
 * Do not invent a separate marker: hollow drop (`none`) + Google-blue fill.
 */

export const MAPSITE_PIN_DEFAULT_COLOR = "#1A73E8";
export const MAPSITE_PIN_DEFAULT_ICON = "none";
export const MAPSITE_PIN_DEFAULT_BORDER = "none";
export const MAPSITE_PIN_DEFAULT_WHITE_CENTER = false;
export const MAPSITE_PIN_DEFAULT_ANIMATED = false;

/** @deprecated Use MAPSITE_PIN_DEFAULT_COLOR */
export const MAPSITE_MAP_PIN_COLOR = MAPSITE_PIN_DEFAULT_COLOR;
/** @deprecated Use MAPSITE_PIN_DEFAULT_ICON */
export const MAPSITE_MAP_PIN_ICON = MAPSITE_PIN_DEFAULT_ICON;

export interface MapSiteSavedPinStyle {
  pinIcon?: string | null;
  pinColor?: string | null;
  pinBorder?: string | null;
  pinWhiteCenter?: boolean | null;
  pinAnimated?: boolean | null;
  pinCategoryBadge?: string | null;
  customLogoUrl?: string | null;
}

export interface ResolvedMapSitePinStyle {
  pinIcon: string;
  pinColor: string;
  pinBorder: string;
  whiteCenter: boolean;
  pinAnimated: boolean;
  pinCategoryBadge: string | null;
  customLogoUrl: string | null;
}

export function resolveMapSitePinStyle(
  style?: MapSiteSavedPinStyle | null
): ResolvedMapSitePinStyle {
  return {
    pinIcon: style?.pinIcon?.trim() || MAPSITE_PIN_DEFAULT_ICON,
    pinColor: style?.pinColor?.trim() || MAPSITE_PIN_DEFAULT_COLOR,
    pinBorder: style?.pinBorder?.trim() || MAPSITE_PIN_DEFAULT_BORDER,
    whiteCenter: style?.pinWhiteCenter ?? MAPSITE_PIN_DEFAULT_WHITE_CENTER,
    pinAnimated: Boolean(style?.pinAnimated),
    pinCategoryBadge: style?.pinCategoryBadge?.trim() || null,
    customLogoUrl: style?.customLogoUrl?.trim() || null,
  };
}

/** Fields consumed by `TalisMapsPin` / `toMapEnginePin`. */
export function mapSitePinVisualFields(style?: MapSiteSavedPinStyle | null) {
  const resolved = resolveMapSitePinStyle(style);
  return {
    pinIcon: resolved.pinIcon,
    pinColor: resolved.pinColor,
    pinBorder: resolved.pinBorder,
    whiteCenter: resolved.whiteCenter,
    pinAnimated: resolved.pinAnimated,
    categoryBadge: resolved.pinCategoryBadge,
    customLogoUrl: resolved.customLogoUrl,
    categoryColor: resolved.pinColor,
  };
}
