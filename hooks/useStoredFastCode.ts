"use client";

import { useSyncExternalStore } from "react";
import { getFastCode } from "@/lib/fast-code";

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

/** FAST Code remembered in this browser (set by the FAST Code gate), or "". */
export function useStoredFastCode(): string {
  return useSyncExternalStore(subscribe, () => getFastCode() || "", () => "");
}
