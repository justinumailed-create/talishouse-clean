"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatCoordinate,
  hasValidCoordinates,
} from "@/lib/home-pin-coordinates";

export interface GoogleMapsPinPickerProps {
  latitude: string;
  longitude: string;
  streetAddress: string;
  onCoordinatesChange: (latitude: string, longitude: string) => void;
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
      existingScript.addEventListener("error", () =>
        reject(new Error("Failed to load Google Maps"))
      );
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

export default function GoogleMapsPinPicker({
  latitude,
  longitude,
  streetAddress,
  onCoordinatesChange,
}: GoogleMapsPinPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const skipGeocodeRef = useRef(false);
  const lastGeocodedAddressRef = useRef("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const onCoordinatesChangeRef = useRef(onCoordinatesChange);

  useEffect(() => {
    onCoordinatesChangeRef.current = onCoordinatesChange;
  }, [onCoordinatesChange]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await loadGoogleMapsScript();
        if (cancelled || !mapRef.current) return;

        const initialCenter = hasValidCoordinates(latitude, longitude)
          ? {
              lat: Number.parseFloat(latitude),
              lng: Number.parseFloat(longitude),
            }
          : DEFAULT_CENTER;

        const map = new window.google.maps.Map(mapRef.current, {
          center: initialCenter,
          zoom: hasValidCoordinates(latitude, longitude) ? 15 : 10,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        const marker = new window.google.maps.Marker({
          position: initialCenter,
          map,
          draggable: true,
          title: "Home PIN",
        });

        marker.addListener("dragend", () => {
          const position = marker.getPosition();
          if (!position) return;
          skipGeocodeRef.current = true;
          onCoordinatesChangeRef.current(
            formatCoordinate(String(position.lat())),
            formatCoordinate(String(position.lng()))
          );
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
        geocoderRef.current = new window.google.maps.Geocoder();
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
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;

    if (hasValidCoordinates(latitude, longitude)) {
      const center = {
        lat: Number.parseFloat(latitude),
        lng: Number.parseFloat(longitude),
      };
      markerRef.current.setPosition(center);
      mapInstanceRef.current.panTo(center);
      mapInstanceRef.current.setCenter(center);
      return;
    }

    const address = streetAddress.trim();
    if (!address || !geocoderRef.current) return;
    if (skipGeocodeRef.current) {
      skipGeocodeRef.current = false;
      return;
    }
    if (address === lastGeocodedAddressRef.current) return;

    const timeout = window.setTimeout(() => {
      geocoderRef.current?.geocode({ address }, (results: any, status: string) => {
        if (status !== "OK" || !results?.[0]?.geometry?.location) return;

        const location = results[0].geometry.location;
        const lat = formatCoordinate(String(location.lat()));
        const lng = formatCoordinate(String(location.lng()));

        lastGeocodedAddressRef.current = address;
        markerRef.current?.setPosition({ lat: location.lat(), lng: location.lng() });
        mapInstanceRef.current?.panTo({ lat: location.lat(), lng: location.lng() });
        onCoordinatesChangeRef.current(lat, lng);
      });
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [latitude, longitude, streetAddress]);

  if (error) {
    return (
      <div className="w-full h-[280px] sm:h-[320px] rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-center text-sm text-neutral-500 px-6 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="relative w-full h-[280px] sm:h-[320px] rounded-xl border border-neutral-200 overflow-hidden">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-50 text-sm text-neutral-500">
          Loading map preview...
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
