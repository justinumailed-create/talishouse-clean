"use client";

import { useState } from "react";
import { PinEngineProvider } from "@/components/talismaps/pin-engine/PinEngineProvider";
import type { TalisMapsEditorSidebarPanelId } from "@/lib/talismaps/editor/constants";
import TalisMapsEditorCanvas from "./TalisMapsEditorCanvas";
import TalisMapsEditorInspector from "./TalisMapsEditorInspector";
import TalisMapsEditorLeftSidebar from "./TalisMapsEditorLeftSidebar";
import TalisMapsEditorStatusBar from "./TalisMapsEditorStatusBar";
import TalisMapsEditorToolbar from "./TalisMapsEditorToolbar";

function TalisMapsEditorWorkspace() {
  const [activePanel, setActivePanel] = useState<TalisMapsEditorSidebarPanelId>("pins");

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f5f5f7] text-neutral-900">
      <TalisMapsEditorToolbar />

      <div className="flex min-h-0 flex-1">
        <TalisMapsEditorLeftSidebar
          activePanel={activePanel}
          onPanelChange={setActivePanel}
        />
        <TalisMapsEditorCanvas />
        <TalisMapsEditorInspector />
      </div>

      <TalisMapsEditorStatusBar />
    </div>
  );
}

export default function TalisMapsEditorShell() {
  return (
    <PinEngineProvider>
      <TalisMapsEditorWorkspace />
    </PinEngineProvider>
  );
}
