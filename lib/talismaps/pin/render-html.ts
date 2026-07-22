import { resolvePinVisual } from "./defaults";
import { getPinIconPath } from "./icons";
import type { ResolvedTalisMapsPinVisual, TalisMapsPinVisualProps } from "./types";

const CATEGORY_LABELS: Record<string, string> = {
  "for-sale": "For Sale",
  "new-listing": "New Listing",
  "open-house": "Open House",
  builder: "Builder",
  fsbo: "FSBO",
};

const PIN_LABEL_MAX_WIDTH = 128;
const PIN_BADGE_HEIGHT = 18;
const PIN_LABEL_HEIGHT = 20;
const PIN_MARKER_GAP = 4;

export function escapePinHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function categoryBadgeLabel(value: string): string {
  return CATEGORY_LABELS[value] ?? value.replaceAll("-", " ");
}

function buildClassicPinBodySvg(visual: ResolvedTalisMapsPinVisual): string {
  const { bodySize: size, ringRadius, centerRadius, pinColor, pinBorderColor } =
    visual;
  const c = size / 2;
  const includeGlyph = !visual.customLogoUrl && visual.pinIcon !== "dot";
  const iconPath = getPinIconPath(visual.pinIcon);
  const iconScale = 0.42 * (size / 66);
  const iconOffset = c - 12 * iconScale;
  const ringOpacity = visual.selectedState ? 1 : 0.96;

  const glyph =
    includeGlyph && iconPath
      ? `<g transform="translate(${iconOffset} ${iconOffset}) scale(${iconScale})" opacity="0.88">
           <path d="${iconPath}" fill="${escapePinHtml(pinColor)}"/>
         </g>`
      : visual.pinIcon === "dot" && !visual.customLogoUrl
        ? `<circle cx="${c}" cy="${c}" r="${Math.max(2.5, centerRadius * 0.28)}" fill="${escapePinHtml(pinColor)}" opacity="0.85"/>`
        : "";

  return `<g filter="url(#pinShadow)">
    <circle cx="${c}" cy="${c}" r="${ringRadius + 2.5}" fill="#ffffff" opacity="0.55"/>
    <circle cx="${c}" cy="${c}" r="${ringRadius}" fill="${escapePinHtml(pinColor)}" opacity="${ringOpacity}"/>
    <circle cx="${c}" cy="${c}" r="${ringRadius}" fill="none" stroke="${escapePinHtml(pinBorderColor)}" stroke-width="1"/>
    <circle cx="${c}" cy="${c}" r="${centerRadius}" fill="#ffffff"/>
    ${glyph}
  </g>`;
}

/** Flag-style marker: solid brand color with a large white icon (reference UI). */
function buildFlagPinBodySvg(visual: ResolvedTalisMapsPinVisual): string {
  const { bodySize: size, ringRadius, pinColor } = visual;
  const c = size / 2;
  const includeGlyph = !visual.customLogoUrl && visual.pinIcon !== "dot";
  const iconPath = getPinIconPath(visual.pinIcon);
  const iconScale = 0.58 * (size / 66);
  const iconOffset = c - 12 * iconScale;
  const ringOpacity = visual.selectedState ? 1 : 0.98;

  const glyph =
    includeGlyph && iconPath
      ? `<g transform="translate(${iconOffset} ${iconOffset}) scale(${iconScale})">
           <path d="${iconPath}" fill="#ffffff"/>
         </g>`
      : !visual.customLogoUrl
        ? `<circle cx="${c}" cy="${c}" r="${Math.max(3, ringRadius * 0.18)}" fill="#ffffff" opacity="0.95"/>`
        : "";

  return `<g filter="url(#pinShadow)">
    <circle cx="${c}" cy="${c}" r="${ringRadius + 3}" fill="#ffffff" opacity="0.92"/>
    <circle cx="${c}" cy="${c}" r="${ringRadius}" fill="${escapePinHtml(pinColor)}" opacity="${ringOpacity}"/>
    <circle cx="${c}" cy="${c}" r="${ringRadius}" fill="none" stroke="#ffffff" stroke-width="2.25" opacity="0.95"/>
    ${glyph}
  </g>`;
}

/**
 * Soft, apple-quality circular PIN body.
 * Classic: white center + colored glyph. Flag: solid color + large white icon.
 */
export function buildPinBodySvg(visual: ResolvedTalisMapsPinVisual): string {
  const { bodySize: size } = visual;
  const body = visual.whiteCenter
    ? buildClassicPinBodySvg(visual)
    : buildFlagPinBodySvg(visual);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none">
  <defs>
    <filter id="pinShadow" x="-40%" y="-20%" width="180%" height="180%">
      <feDropShadow dx="0" dy="2.5" stdDeviation="2.2" flood-color="#000000" flood-opacity="0.18"/>
      <feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#000000" flood-opacity="0.10"/>
    </filter>
  </defs>
  ${body}
</svg>`;
}

export interface PinMarkerRenderResult {
  html: string;
  className: string;
  iconSize: [number, number];
  iconAnchor: [number, number];
}

/**
 * Provider-agnostic HTML marker payload used by Leaflet (and future adapters).
 */
export function renderPinMarkerHtml(
  props: TalisMapsPinVisualProps
): PinMarkerRenderResult {
  const visual = resolvePinVisual(props);
  const size = visual.bodySize;
  const label = visual.pinLabel;
  const badge = visual.categoryBadge
    ? categoryBadgeLabel(visual.categoryBadge)
    : "";
  const svg = buildPinBodySvg(visual);

  const animationClass =
    visual.pinAnimation === "pulse"
      ? " talismaps-pin--pulse"
      : visual.pinAnimation === "breathe"
        ? " talismaps-pin--breathe"
        : "";
  const selectedClass = visual.selectedState ? " talismaps-pin--selected" : "";

  const labelHtml = label
    ? `<div class="talismaps-pin-label">${escapePinHtml(label)}</div>`
    : "";
  const badgeHtml = badge
    ? `<div class="talismaps-pin-badge">${escapePinHtml(badge)}</div>`
    : "";
  const logoHtml = visual.customLogoUrl
    ? `<img class="talismaps-pin-logo" src="${escapePinHtml(visual.customLogoUrl)}" alt="" />`
    : "";

  const markerWidth = Math.max(size, PIN_LABEL_MAX_WIDTH);
  const badgeBlockHeight = badge ? PIN_BADGE_HEIGHT + PIN_MARKER_GAP : 0;
  const labelBlockHeight = label ? PIN_LABEL_HEIGHT + PIN_MARKER_GAP : 0;
  const totalHeight = badgeBlockHeight + size + labelBlockHeight;
  const pinBodyTop = badgeBlockHeight;
  const anchorY = pinBodyTop + size / 2;

  return {
    html: `<div class="talismaps-pin-marker${animationClass}${selectedClass}" style="width:${markerWidth}px">
      ${badgeHtml}
      <div class="talismaps-pin-body" style="width:${size}px;height:${size}px">
        <img class="talismaps-pin-svg" src="data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}" width="${size}" height="${size}" alt="" />
        ${logoHtml}
      </div>
      ${labelHtml}
    </div>`,
    className: visual.selectedState
      ? "talismaps-pin-icon talismaps-pin-icon--highlighted"
      : "talismaps-pin-icon",
    iconSize: [markerWidth, totalHeight],
    iconAnchor: [markerWidth / 2, anchorY],
  };
}

export function pinVisualCacheKey(props: TalisMapsPinVisualProps): string {
  const visual = resolvePinVisual(props);
  return [
    visual.pinColor,
    visual.pinBorderColor,
    visual.pinIcon,
    visual.whiteCenter ? 1 : 0,
    visual.pinSize,
    visual.pinLabel ?? "",
    visual.pinAnimation,
    visual.selectedState ? 1 : 0,
    visual.categoryBadge ?? "",
    visual.customLogoUrl ?? "",
  ].join("|");
}
