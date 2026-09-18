"use client";

import { useEffect } from "react";

/** Keep claimed Mapsite™ views viewport-locked — no document or rubber-band scroll. */
export default function MapSiteViewportLock() {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("mapsite-scroll-lock");
    return () => {
      html.classList.remove("mapsite-scroll-lock");
    };
  }, []);

  return null;
}
