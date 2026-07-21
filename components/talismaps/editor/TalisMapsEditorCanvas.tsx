"use client";

import MapEngineCanvas from "@/components/talismaps/map-engine/MapEngineCanvas";

export default function TalisMapsEditorCanvas() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#eef0f3]">
      <MapEngineCanvas className="h-full w-full" />
    </div>
  );
}
