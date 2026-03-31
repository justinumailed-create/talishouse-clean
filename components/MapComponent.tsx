"use client";

import React, { useEffect, useRef, useState } from "react";

interface MapComponentProps {
  associateId?: string;
  location?: { lat: number; lng: number };
}

declare global {
  interface Window {
    google: any;
  }
}

export default function MapComponent({ associateId, location }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  console.log("Map props:", { associateId, location });

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error("Google Maps API Key is missing");
      setError("Map unavailable: API key missing");
      setLoading(false);
      return;
    }

    const loadScript = () => {
      if (window.google && window.google.maps) {
        initMap();
        return;
      }

      const existingScript = document.getElementById("google-maps-script");
      if (existingScript) {
        existingScript.addEventListener("load", initMap);
        return;
      }

      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => {
        setError("Failed to load Google Maps script");
        setLoading(false);
      };
      document.head.appendChild(script);
    };

    const initMap = () => {
      try {
        if (!mapRef.current) return;

        const center = location || {
          lat: 28.6139,
          lng: 77.2090,
        };

        const map = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 12,
          styles: [
            {
              "featureType": "administrative",
              "elementType": "geometry",
              "stylers": [{ "visibility": "off" }]
            },
            {
              "featureType": "poi",
              "stylers": [{ "visibility": "off" }]
            },
            {
              "featureType": "road",
              "elementType": "labels.icon",
              "stylers": [{ "visibility": "off" }]
            },
            {
              "featureType": "transit",
              "stylers": [{ "visibility": "off" }]
            }
          ]
        });

        new window.google.maps.Marker({
          position: center,
          map: map,
          title: "Associate Location"
        });

        setLoading(false);
      } catch (err) {
        console.error("Error initializing map:", err);
        setError("Error initializing map");
        setLoading(false);
      }
    };

    loadScript();
  }, [location]);

  if (error) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500 flex-col p-4 text-center">
        <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-500 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          Loading map...
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
