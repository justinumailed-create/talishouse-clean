"use client";

import { usePinEngine } from "@/components/talismaps/pin-engine/PinEngineProvider";
import EditorField from "../EditorField";
import EditorSection from "../EditorSection";

export default function InspectorDescription() {
  const { selectedPin, updatePin } = usePinEngine();

  return (
    <EditorSection
      title="Description"
      description="Copy, contact details, and metadata."
      defaultOpen={false}
    >
      <EditorField
        label="Description"
        value={selectedPin?.description ?? ""}
        placeholder="Pin description"
        multiline
        disabled={!selectedPin}
        onChange={(value) => selectedPin && updatePin(selectedPin.id, { description: value })}
      />
      <EditorField
        label="Phone"
        value={selectedPin?.phone ?? ""}
        placeholder="+1 (000) 000-0000"
        disabled={!selectedPin}
        onChange={(value) => selectedPin && updatePin(selectedPin.id, { phone: value })}
      />
      <EditorField
        label="Website"
        value={selectedPin?.website ?? ""}
        placeholder="https://"
        disabled={!selectedPin}
        onChange={(value) => selectedPin && updatePin(selectedPin.id, { website: value })}
      />
      <EditorField
        label="Email"
        value={selectedPin?.email ?? ""}
        placeholder="contact@example.com"
        disabled={!selectedPin}
        onChange={(value) => selectedPin && updatePin(selectedPin.id, { email: value })}
      />
    </EditorSection>
  );
}
