"use client";

import { usePinEngine } from "@/components/talismaps/pin-engine/PinEngineProvider";
import EditorField from "../EditorField";
import EditorSection from "../EditorSection";

export default function InspectorCoordinates() {
  const { selectedPin, updatePin } = usePinEngine();

  return (
    <EditorSection title="Coordinates" description="Latitude, longitude, and map position.">
      <div className="grid grid-cols-2 gap-3">
        <EditorField
          label="Latitude"
          value={selectedPin ? String(selectedPin.latitude) : ""}
          placeholder="0.000000"
          disabled={!selectedPin}
          onChange={(value) =>
            selectedPin && updatePin(selectedPin.id, { latitude: Number(value) || 0 })
          }
        />
        <EditorField
          label="Longitude"
          value={selectedPin ? String(selectedPin.longitude) : ""}
          placeholder="0.000000"
          disabled={!selectedPin}
          onChange={(value) =>
            selectedPin && updatePin(selectedPin.id, { longitude: Number(value) || 0 })
          }
        />
      </div>
      <EditorField
        label="Address"
        value={selectedPin?.address ?? ""}
        placeholder="Street address"
        disabled={!selectedPin}
        onChange={(value) => selectedPin && updatePin(selectedPin.id, { address: value })}
      />
      <p className="text-xs text-neutral-400">Drag pins on the canvas to reposition automatically.</p>
    </EditorSection>
  );
}
