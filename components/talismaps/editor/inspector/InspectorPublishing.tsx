"use client";

import { usePinEngine } from "@/components/talismaps/pin-engine/PinEngineProvider";
import EditorField from "../EditorField";
import EditorSection from "../EditorSection";

export default function InspectorPublishing() {
  const { selectedPin, updatePin } = usePinEngine();

  return (
    <EditorSection
      title="Publishing"
      description="Visibility, status, and go-live controls."
      defaultOpen={false}
    >
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
          Status
        </span>
        <select
          disabled={!selectedPin}
          value={selectedPin?.status ?? "draft"}
          onChange={(event) =>
            selectedPin &&
            updatePin(selectedPin.id, {
              status: event.target.value as typeof selectedPin.status,
            })
          }
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 disabled:bg-neutral-50"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
          Visibility
        </span>
        <select
          disabled={!selectedPin}
          value={selectedPin?.visibility ?? "network"}
          onChange={(event) =>
            selectedPin &&
            updatePin(selectedPin.id, {
              visibility: event.target.value as typeof selectedPin.visibility,
            })
          }
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 disabled:bg-neutral-50"
        >
          <option value="public">Public</option>
          <option value="network">Network</option>
          <option value="private">Private</option>
        </select>
      </label>
      <EditorField
        label="Owner"
        value={selectedPin?.ownerName ?? ""}
        placeholder="Unassigned owner"
        disabled
        onChange={() => undefined}
      />
      <EditorField
        label="Theme"
        value={selectedPin?.themeName ?? ""}
        placeholder="Default theme"
        disabled
        onChange={() => undefined}
      />
    </EditorSection>
  );
}
