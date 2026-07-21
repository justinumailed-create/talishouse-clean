"use client";

import type { TalisMapsEditorSidebarPanelId } from "@/lib/talismaps/editor/constants";
import { usePinEngine } from "@/components/talismaps/pin-engine/PinEngineProvider";
import EditorPinsPanel from "./EditorPinsPanel";

interface EditorSidebarPanelProps {
  panelId: TalisMapsEditorSidebarPanelId;
}

export default function EditorSidebarPanel({ panelId }: EditorSidebarPanelProps) {
  const { map, categories, pins } = usePinEngine();

  if (panelId === "pins") {
    return <EditorPinsPanel />;
  }

  if (panelId === "maps") {
    return (
      <div className="flex h-full flex-col p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Map Instances</h2>
        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="font-medium text-neutral-900">{map?.name ?? "Untitled Map"}</p>
          <p className="mt-1 text-xs text-neutral-500">{map?.slug}</p>
          <p className="mt-3 text-xs capitalize text-neutral-600">Status: {map?.status}</p>
          <p className="mt-1 text-xs text-neutral-600">{pins.length} pins on canvas</p>
        </div>
      </div>
    );
  }

  if (panelId === "categories") {
    return (
      <div className="flex h-full flex-col p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Categories</h2>
        <ul className="mt-4 space-y-2">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2.5"
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm text-neutral-800">{category.name}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const placeholderCopy: Record<
    Exclude<TalisMapsEditorSidebarPanelId, "pins" | "maps" | "categories">,
    { title: string; description: string }
  > = {
    layers: {
      title: "Layers",
      description: "Layer controls will stack above the map engine in a future release.",
    },
    media: {
      title: "Media Library",
      description: "Shared media assets will be managed here.",
    },
    imports: {
      title: "Imports",
      description: "Atlist and bulk import workflows will connect here.",
    },
  };

  const panel = placeholderCopy[panelId as keyof typeof placeholderCopy];

  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="text-sm font-semibold text-neutral-900">{panel.title}</h2>
      <p className="mt-2 text-xs text-neutral-500">{panel.description}</p>
    </div>
  );
}
