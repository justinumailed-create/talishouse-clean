import type { MapEnginePin } from "./types";
import {
  pinVisualCacheKey,
  renderPinMarkerHtml,
  type TalisMapsPinAnimation,
  type TalisMapsPinVisualProps,
} from "@/lib/talismaps/pin";

export interface MapEnginePinStyle {
  icon: string;
  border: string;
  whiteCenter: boolean;
  animated: boolean;
  categoryBadge: string | null;
  customLogoUrl: string | null;
  pinBorderColor: string | null;
  pinSize: number | null;
}

function readBorderColor(metadata: Record<string, unknown>): string | null {
  if (typeof metadata.pinBorderColor === "string" && metadata.pinBorderColor.trim()) {
    return metadata.pinBorderColor.trim();
  }
  if (metadata.border === "none") return "transparent";
  return null;
}

export function readMapEnginePinStyle(pin: MapEnginePin): MapEnginePinStyle {
  const metadata = pin.metadata ?? {};
  return {
    icon: typeof metadata.icon === "string" ? metadata.icon : "dot",
    border: typeof metadata.border === "string" ? metadata.border : "solid",
    whiteCenter:
      metadata.whiteCenter === undefined ? true : Boolean(metadata.whiteCenter),
    animated: Boolean(metadata.animated),
    categoryBadge:
      typeof metadata.categoryBadge === "string" && metadata.categoryBadge.trim()
        ? metadata.categoryBadge
        : null,
    customLogoUrl:
      typeof metadata.customLogoUrl === "string" && metadata.customLogoUrl.trim()
        ? metadata.customLogoUrl
        : null,
    pinBorderColor: readBorderColor(metadata),
    pinSize:
      typeof metadata.pinSize === "number" && Number.isFinite(metadata.pinSize)
        ? metadata.pinSize
        : null,
  };
}

function toPinVisualProps(
  pin: MapEnginePin,
  highlighted: boolean
): TalisMapsPinVisualProps {
  const style = readMapEnginePinStyle(pin);
  const animation: TalisMapsPinAnimation = style.animated ? "pulse" : "none";

  return {
    pinColor: pin.color,
    pinBorderColor: style.pinBorderColor,
    pinIcon: style.customLogoUrl ? "dot" : style.icon,
    pinSize: style.pinSize,
    pinLabel: pin.label,
    pinAnimation: animation,
    selectedState: highlighted,
    categoryBadge: style.categoryBadge,
    customLogoUrl: style.customLogoUrl,
  };
}

export function pinStyleCacheKey(pin: MapEnginePin, highlighted: boolean): string {
  return pinVisualCacheKey(toPinVisualProps(pin, highlighted));
}

/** @deprecated Prefer renderPinMarkerHtml via the pin engine. Kept for SVG callers. */
export function buildPinMarkerSvg(
  pin: MapEnginePin,
  highlighted: boolean,
  _options: { includeIcon: boolean } = { includeIcon: true }
): string {
  void _options;
  const result = renderPinMarkerHtml(toPinVisualProps(pin, highlighted));
  const match = result.html.match(/src="data:image\/svg\+xml;charset=UTF-8,([^"]+)"/);
  if (!match?.[1]) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return "";
  }
}

export function buildPinMarkerHtml(
  pin: MapEnginePin,
  highlighted: boolean
): {
  html: string;
  className: string;
  iconSize: [number, number];
  iconAnchor: [number, number];
} {
  return renderPinMarkerHtml(toPinVisualProps(pin, highlighted));
}
