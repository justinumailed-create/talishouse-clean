"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_MAP_BASEMAP_VIEW,
  DEFAULT_MAP_PROVIDER_ID,
  type MapBasemapView,
  type MapProviderId,
} from "@/lib/talismaps/map-engine";

export interface TalisMapsMapDefaults {
  providerId: MapProviderId;
  basemapView: MapBasemapView;
}

const FALLBACK_DEFAULTS: TalisMapsMapDefaults = {
  providerId: DEFAULT_MAP_PROVIDER_ID,
  basemapView: DEFAULT_MAP_BASEMAP_VIEW,
};

/**
 * Loads global Talismaps™ map defaults for client surfaces.
 * Falls back to env/registry defaults if the settings API is unavailable.
 */
export function useTalisMapsMapDefaults(
  override?: Partial<TalisMapsMapDefaults>
): TalisMapsMapDefaults {
  const [defaults, setDefaults] = useState<TalisMapsMapDefaults>({
    providerId: override?.providerId ?? FALLBACK_DEFAULTS.providerId,
    basemapView: override?.basemapView ?? FALLBACK_DEFAULTS.basemapView,
  });

  useEffect(() => {
    if (override?.providerId && override?.basemapView) {
      setDefaults({
        providerId: override.providerId,
        basemapView: override.basemapView,
      });
      return;
    }

    let cancelled = false;

    void fetch("/api/talismaps/settings")
      .then(async (response) => {
        if (!response.ok) return FALLBACK_DEFAULTS;
        const payload = (await response.json()) as {
          defaultProviderId?: MapProviderId;
          defaultBasemapView?: MapBasemapView;
        };
        return {
          providerId: payload.defaultProviderId ?? FALLBACK_DEFAULTS.providerId,
          basemapView:
            payload.defaultBasemapView ?? FALLBACK_DEFAULTS.basemapView,
        };
      })
      .then((next) => {
        if (cancelled) return;
        setDefaults({
          providerId: override?.providerId ?? next.providerId,
          basemapView: override?.basemapView ?? next.basemapView,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setDefaults({
            providerId: override?.providerId ?? FALLBACK_DEFAULTS.providerId,
            basemapView: override?.basemapView ?? FALLBACK_DEFAULTS.basemapView,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [override?.providerId, override?.basemapView]);

  return defaults;
}
