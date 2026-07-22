"use client";

import { MAP_BASEMAP_VIEW_OPTIONS, type MapBasemapView } from "@/lib/talismaps/map-engine";
import { useMapEngine } from "@/components/talismaps/map-engine/MapEngineProvider";

interface MapStyleSwitcherProps {
  className?: string;
  /** Limit which styles appear. Defaults to all available options. */
  styles?: MapBasemapView[];
}

/**
 * UI control that switches MapLibre styles through MapEngineProvider.
 * Does not touch vendor SDKs — only provider-agnostic style ids.
 */
export default function MapStyleSwitcher({
  className = "",
  styles,
}: MapStyleSwitcherProps) {
  const { basemapView, setBasemapView } = useMapEngine();
  const options = MAP_BASEMAP_VIEW_OPTIONS.filter(
    (option) => !styles || styles.includes(option.id)
  );

  return (
    <div
      className={`inline-flex flex-wrap gap-1 rounded-xl border border-neutral-200 bg-white/95 p-1 shadow-sm backdrop-blur ${className}`}
      role="group"
      aria-label="Map style"
    >
      {options.map((option) => {
        const active = basemapView === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setBasemapView(option.id)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-neutral-900 text-white"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
            aria-pressed={active}
            title={option.description}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
