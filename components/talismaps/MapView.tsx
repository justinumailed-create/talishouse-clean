"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { TalisMapsPin } from "@/lib/talismaps";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  pins: TalisMapsPin[];
  selectedPin: TalisMapsPin | null;
  onSelectPin: (pin: TalisMapsPin | null) => void;
  center?: [number, number];
  zoom?: number;
}

function createCustomIcon(color: string, featured: boolean): L.DivIcon {
  const size = featured ? 40 : 32;
  const dotSize = featured ? 18 : 14;

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: ${dotSize}px;
          height: ${dotSize}px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3), 0 0 0 ${featured ? 3 : 2}px ${color}40;
          transition: transform 0.15s ease;
          cursor: pointer;
        "></div>
      </div>
    `,
  });
}

function createHighlightedIcon(color: string, featured: boolean): L.DivIcon {
  const size = featured ? 52 : 44;
  const dotSize = featured ? 22 : 18;

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: ${dotSize}px;
          height: ${dotSize}px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 0 0 4px ${color}60, 0 4px 12px rgba(0,0,0,0.3);
          transform: scale(1.15);
          transition: transform 0.15s ease;
          cursor: pointer;
        "></div>
      </div>
    `,
  });
}

export default function MapView({ pins, selectedPin, onSelectPin, center, zoom }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [ready, setReady] = useState(false);

  const fitBounds = useCallback(() => {
    if (!mapRef.current || pins.length === 0) return;
    const bounds = L.latLngBounds(
      pins.map((p) => [p.latitude, p.longitude] as [number, number])
    );
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [pins]);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
      }).setView(center || [43.6532, -79.3832], zoom || 10);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      map.on("click", () => {
        onSelectPin(null);
      });

      mapRef.current = map;
      setReady(true);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !ready) return;

    markersRef.current.forEach((marker) => {
      marker.remove();
    });
    markersRef.current.clear();

    pins.forEach((pin) => {
      const isSelected = selectedPin?.id === pin.id;
      const icon = isSelected
        ? createHighlightedIcon(pin.categoryColor, pin.featured)
        : createCustomIcon(pin.categoryColor, pin.featured);

      const marker = L.marker([pin.latitude, pin.longitude], { icon }).addTo(mapRef.current!);

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectPin(pin);
      });

      markersRef.current.set(pin.id, marker);
    });

    if (selectedPin) {
      mapRef.current?.setView([selectedPin.latitude, selectedPin.longitude], 15, { animate: true });
    } else if (pins.length > 0 && !selectedPin) {
      fitBounds();
    }
  }, [pins, selectedPin, ready, onSelectPin, fitBounds]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}
