"use client";

import { usePinEngine } from "@/components/talismaps/pin-engine/PinEngineProvider";
import EditorField from "../EditorField";
import EditorSection from "../EditorSection";

export default function InspectorAppearance() {
  const { selectedPin, categories, updatePin } = usePinEngine();
  const category = categories.find((item) => item.id === selectedPin?.categoryId);

  return (
    <EditorSection
      title="Appearance"
      description="Icon, color, and category styling."
      defaultOpen={false}
    >
      <EditorField
        label="Pin Color"
        value={category?.color ?? selectedPin?.categoryColor ?? "#6B7280"}
        placeholder="#3B82F6"
        disabled
        onChange={() => undefined}
      />
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          disabled={!selectedPin}
          checked={selectedPin?.featured ?? false}
          onChange={(event) =>
            selectedPin && updatePin(selectedPin.id, { featured: event.target.checked })
          }
        />
        Featured pin
      </label>
    </EditorSection>
  );
}
