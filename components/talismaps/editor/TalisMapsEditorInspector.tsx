"use client";

import { usePinEngine } from "@/components/talismaps/pin-engine/PinEngineProvider";
import InspectorAppearance from "./inspector/InspectorAppearance";
import InspectorCoordinates from "./inspector/InspectorCoordinates";
import InspectorDescription from "./inspector/InspectorDescription";
import InspectorMedia from "./inspector/InspectorMedia";
import InspectorPublishing from "./inspector/InspectorPublishing";
import InspectorSelectedPin from "./inspector/InspectorSelectedPin";

export default function TalisMapsEditorInspector() {
  const { saveState } = usePinEngine();

  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col border-l border-neutral-200/80 bg-white">
      <div className="border-b border-neutral-200/80 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Inspector
            </p>
            <h2 className="mt-1 text-sm font-semibold text-neutral-900">Pin Properties</h2>
            <p className="mt-1 text-xs text-neutral-500">Changes save automatically.</p>
          </div>
          <span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-medium capitalize text-neutral-600">
            {saveState}
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <InspectorSelectedPin />
        <InspectorCoordinates />
        <InspectorAppearance />
        <InspectorMedia />
        <InspectorDescription />
        <InspectorPublishing />
      </div>
    </aside>
  );
}
