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
      <div className="w-full h-full min-h-[300px] lg:min-h-[500px] bg-gray-100 flex items-center justify-center text-gray-500 flex-col p-4 text-center">
        <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="text-sm font-medium">Map unavailable</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[300px] lg:min-h-[500px]">
      {loading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-500 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          Loading map...
        </div>
      )}
      <div ref={mapRef} className="w-full h-full min-h-[300px] lg:min-h-[500px]" />
    </div>
  );
}
