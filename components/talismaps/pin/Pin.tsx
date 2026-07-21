"use client";

import { useId, type CSSProperties } from "react";
import { resolvePinVisual } from "@/lib/talismaps/pin/defaults";
import { getPinIconPath } from "@/lib/talismaps/pin/icons";
import type { TalisMapsPinVisualProps } from "@/lib/talismaps/pin/types";

export type PinProps = TalisMapsPinVisualProps & {
  className?: string;
  style?: CSSProperties;
};

/**
 * Reusable TalisMaps™ PIN.
 * Rendering-only — no editing / inspector wiring yet.
 */
export default function Pin({
  className = "",
  style,
  ...visualProps
}: PinProps) {
  const shadowId = `pin-shadow-${useId().replace(/:/g, "")}`;
  const visual = resolvePinVisual(visualProps);
  const size = visual.bodySize;
  const c = size / 2;
  const iconPath = getPinIconPath(visual.pinIcon);
  const showGlyph = !visual.customLogoUrl && visual.pinIcon !== "dot" && iconPath;
  const iconScale = 0.42 * (size / 66);
  const iconOffset = c - 12 * iconScale;

  const animationClass =
    visual.pinAnimation === "pulse"
      ? "talismaps-pin--pulse"
      : visual.pinAnimation === "breathe"
        ? "talismaps-pin--breathe"
        : "";
  const selectedClass = visual.selectedState ? "talismaps-pin--selected" : "";

  return (
    <div
      className={`talismaps-pin-marker ${animationClass} ${selectedClass} ${className}`.trim()}
      style={{ width: Math.max(size, 128), ...style }}
      data-pin-selected={visual.selectedState ? "true" : "false"}
    >
      {visual.categoryBadge ? (
        <div className="talismaps-pin-badge">{visual.categoryBadge}</div>
      ) : null}

      <div className="talismaps-pin-body" style={{ width: size, height: size }}>
        <svg
          className="talismaps-pin-svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <filter
              id={shadowId}
              x="-40%"
              y="-20%"
              width="180%"
              height="180%"
            >
              <feDropShadow
                dx="0"
                dy="2.5"
                stdDeviation="2.2"
                floodColor="#000000"
                floodOpacity="0.18"
              />
              <feDropShadow
                dx="0"
                dy="8"
                stdDeviation="7"
                floodColor="#000000"
                floodOpacity="0.1"
              />
            </filter>
          </defs>
          <g filter={`url(#${shadowId})`}>
            <circle
              cx={c}
              cy={c}
              r={visual.ringRadius + 2.5}
              fill="#ffffff"
              opacity={0.55}
            />
            <circle
              cx={c}
              cy={c}
              r={visual.ringRadius}
              fill={visual.pinColor}
              opacity={visual.selectedState ? 1 : 0.96}
            />
            <circle
              cx={c}
              cy={c}
              r={visual.ringRadius}
              fill="none"
              stroke={visual.pinBorderColor}
              strokeWidth={1}
            />
            <circle cx={c} cy={c} r={visual.centerRadius} fill="#ffffff" />
            {showGlyph ? (
              <g
                transform={`translate(${iconOffset} ${iconOffset}) scale(${iconScale})`}
                opacity={0.88}
              >
                <path d={iconPath} fill={visual.pinColor} />
              </g>
            ) : null}
            {visual.pinIcon === "dot" && !visual.customLogoUrl ? (
              <circle
                cx={c}
                cy={c}
                r={Math.max(2.5, visual.centerRadius * 0.28)}
                fill={visual.pinColor}
                opacity={0.85}
              />
            ) : null}
          </g>
        </svg>

        {visual.customLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="talismaps-pin-logo"
            src={visual.customLogoUrl}
            alt=""
          />
        ) : null}
      </div>

      {visual.pinLabel ? (
        <div className="talismaps-pin-label">{visual.pinLabel}</div>
      ) : null}
    </div>
  );
}
