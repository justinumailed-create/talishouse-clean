"use client";

import { createContext, useContext } from "react";
import type { TalisBooksViewerOrigin } from "@/lib/talisbooks/viewer/origin";

const ViewerOriginContext = createContext<TalisBooksViewerOrigin | null>(null);

export const TalisBooksViewerOriginProvider = ViewerOriginContext.Provider;

export function useTalisBooksViewerOrigin(): TalisBooksViewerOrigin | null {
  return useContext(ViewerOriginContext);
}
