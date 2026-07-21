"use client";

import { PIN_KIND_CONFIG } from "@/lib/talismaps/pin-engine";
import { usePinEngine } from "@/components/talismaps/pin-engine/PinEngineProvider";
import EditorField from "../EditorField";
import EditorSection from "../EditorSection";

export default function InspectorSelectedPin() {
  const { selectedPin, updatePin, categories } = usePinEngine();

  return (
    <EditorSection title="Selected PIN" description="Identity and type for the active pin.">
      <EditorField
        label="Pin Name"
        value={selectedPin?.name ?? ""}
        placeholder="Select a pin on the canvas"
        disabled={!selectedPin}
        onChange={(value) => selectedPin && updatePin(selectedPin.id, { name: value })}
      />
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
          Pin Type
        </span>
        <select
          disabled={!selectedPin}
          value={selectedPin?.pinType ?? "root"}
          onChange={(event) =>
            selectedPin &&
            updatePin(selectedPin.id, {
              pinType: event.target.value as typeof selectedPin.pinType,
            })
          }
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 disabled:bg-neutral-50"
        >
          {Object.entries(PIN_KIND_CONFIG).map(([kind, config]) => (
            <option key={kind} value={kind}>
              {config.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
          Category
        </span>
        <select
          disabled={!selectedPin}
          value={selectedPin?.categoryId ?? ""}
          onChange={(event) =>
            selectedPin &&
            updatePin(selectedPin.id, {
              categoryId: event.target.value || null,
            })
          }
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 disabled:bg-neutral-50"
        >
          <option value="">Unassigned</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
    </EditorSection>
  );
}
