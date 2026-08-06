/**
 * Talismaps™ PIN visual model — future-ready rendering props.
 * Editing UI is intentionally out of scope; this is the rendering contract only.
 */

export type TalisMapsPinIcon =
  | "home"
  | "star"
  | "building"
  | "map-pin"
  | "landmark"
  | "flag"
  | "dot";

export type TalisMapsPinAnimation = "none" | "pulse" | "breathe";

export type TalisMapsPinSize = "sm" | "md" | "lg" | number;

export interface TalisMapsPinVisualProps {
  /** Fill / brand color for the outer ring. */
  pinColor?: string | null;
  /** Optional hairline border color. Defaults to a soft white rim. */
  pinBorderColor?: string | null;
  /** Glyph rendered in the white center (classic) or as a white flag icon (flag mode). */
  pinIcon?: TalisMapsPinIcon | string | null;
  /** Classic = white center + small glyph. Flag = solid color body + large white icon. */
  whiteCenter?: boolean | null;
  /** Nominal size. `"md"` is the new default (~1.5× prior). */
  pinSize?: TalisMapsPinSize | null;
  /** Caption under the pin body. */
  pinLabel?: string | null;
  /** Motion preset. Rendering only — not editable here. */
  pinAnimation?: TalisMapsPinAnimation | null;
  /** Selected / highlighted appearance. */
  selectedState?: boolean | null;
  /** Optional category chip above the pin. */
  categoryBadge?: string | null;
  /** Optional custom logo in the white center (overrides glyph). */
  customLogoUrl?: string | null;
}

export interface ResolvedTalisMapsPinVisual {
  pinColor: string;
  pinBorderColor: string;
  pinIcon: string;
  whiteCenter: boolean;
  pinSize: number;
  pinLabel: string | null;
  pinAnimation: TalisMapsPinAnimation;
  selectedState: boolean;
  categoryBadge: string | null;
  customLogoUrl: string | null;
  /** Soft outer white halo radius in px (screen). */
  bodySize: number;
  /** Colored ring outer radius. */
  ringRadius: number;
  /** White center radius. */
  centerRadius: number;
  iconScale: number;
}
