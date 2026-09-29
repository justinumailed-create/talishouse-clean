"use client";

import { useEffect } from "react";
import type { MapCoordinates, MapFitPadding } from "@/lib/talismaps/map-engine";
import { useMapEngine } from "./MapEngineProvider";

interface MapEngineFitBoundsProps {
  coordinates: MapCoordinates[];
  padding?: MapFitPadding;
}

export default function MapEngineFitBounds({
  coordinates,
  padding = 72,
}: MapEngineFitBoundsProps) {
  const { fitToCoordinates, isReady } = useMapEngine();
  const coordinateKey = coordinates
    .map((coordinate) => `${coordinate.latitude},${coordinate.longitude}`)
    .join("|");

  useEffect(() => {
    if (!isReady || coordinates.length === 0) return;
    fitToCoordinates(coordinates, padding);
  }, [coordinateKey, coordinates, fitToCoordinates, isReady, padding]);

  return null;
}
