"use client";

import MapEngineCanvas from "@/components/talismaps/map-engine/MapEngineCanvas";
import MapStyleSwitcher from "@/components/talismaps/map-engine/MapStyleSwitcher";

export default function TalisMapsEditorCanvas() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#eef0f3]">
      <MapEngineCanvas className="h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3 sm:justify-end sm:pr-4">
        <div className="pointer-events-auto">
          <MapStyleSwitcher />
        </div>
      </div>
    </div>
  );
}
