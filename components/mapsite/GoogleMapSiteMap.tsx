"use client";

import { useEffect, useRef, useState } from "react";

export interface GoogleMapSiteMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  title?: string;
}

const DEFAULT_CENTER = { lat: 43.6532, lng: -79.3832 };

declare global {
  interface Window {
    google: any;
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key is missing"));
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export default function GoogleMapSiteMap({
  latitude,
  longitude,
  zoom = 15,
  title = "Property location",
}: GoogleMapSiteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await loadGoogleMapsScript();
        if (cancelled || !mapRef.current) return;

        const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);
        const center = hasCoords
          ? { lat: latitude, lng: longitude }
          : DEFAULT_CENTER;

        const map = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: hasCoords ? zoom : 10,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        if (hasCoords) {
          new window.google.maps.Marker({
            position: center,
            map,
            title,
          });
        }

        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load map preview"
          );
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, zoom, title]);

  if (error) {
    return (
      <div className="w-full h-full min-h-[320px] bg-neutral-50 flex items-center justify-center text-sm text-neutral-500 px-6 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[320px]">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-50 text-sm text-neutral-500">
          Loading map...
        </div>
      )}
      <div ref={mapRef} className="w-full h-full min-h-[320px]" />
    </div>
  );
}
