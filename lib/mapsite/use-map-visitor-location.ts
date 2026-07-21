"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TalisMapsPin } from "@/lib/talismaps";
import type { MapCoordinates } from "@/lib/talismaps/map-engine";
import {
  buildNearbyListings,
  hasAskedVisitorLocationThisSession,
  hasDismissedVisitorLocationNotice,
  markVisitorLocationNoticeDismissed,
  markVisitorLocationPrompted,
  type NearbyListing,
  type VisitorLocationStatus,
} from "./visitor-location";

interface UseMapVisitorLocationOptions {
  pins: TalisMapsPin[];
  enabled?: boolean;
}

interface UseMapVisitorLocationResult {
  status: VisitorLocationStatus;
  coordinates: MapCoordinates | null;
  nearbyListings: NearbyListing[];
  showLocationNotice: boolean;
  dismissNotice: () => void;
}

export function useMapVisitorLocation({
  pins,
  enabled = true,
}: UseMapVisitorLocationOptions): UseMapVisitorLocationResult {
  const [status, setStatus] = useState<VisitorLocationStatus>("idle");
  const [coordinates, setCoordinates] = useState<MapCoordinates | null>(null);
  const [noticeDismissed, setNoticeDismissed] = useState(
    () => hasDismissedVisitorLocationNotice()
  );

  const dismissNotice = useCallback(() => {
    setNoticeDismissed(true);
    markVisitorLocationNoticeDismissed();
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }

    const alreadyPrompted = hasAskedVisitorLocationThisSession();
    let cancelled = false;
    setStatus("requesting");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setStatus("granted");
        markVisitorLocationPrompted();
      },
      (error) => {
        if (cancelled) return;
        if (error.code === error.PERMISSION_DENIED) {
          setStatus("denied");
          if (!alreadyPrompted) {
            markVisitorLocationPrompted();
          }
          return;
        }
        setStatus("unavailable");
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: 12_000,
      }
    );

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const nearbyListings = useMemo(() => {
    if (!coordinates || pins.length === 0) return [];
    return buildNearbyListings(pins, coordinates);
  }, [coordinates, pins]);

  const showLocationNotice = !noticeDismissed && status === "denied";

  return {
    status,
    coordinates,
    nearbyListings,
    showLocationNotice,
    dismissNotice,
  };
}
