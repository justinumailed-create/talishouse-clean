"use client";

import { createContext, useContext, type ReactNode } from "react";

/** When true, dashboard tools render as page body (no floating card chrome). */
export const MapSiteDashboardChromeContext = createContext(false);

export function useMapSiteDashboardEmbedded(): boolean {
  return useContext(MapSiteDashboardChromeContext);
}

export function MapSiteDashboardChrome({
  embedded,
  children,
}: {
  embedded: boolean;
  children: ReactNode;
}) {
  return (
    <MapSiteDashboardChromeContext.Provider value={embedded}>
      {children}
    </MapSiteDashboardChromeContext.Provider>
  );
}
