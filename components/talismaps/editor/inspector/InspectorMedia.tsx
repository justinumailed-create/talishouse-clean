"use client";

import { usePinEngine } from "@/components/talismaps/pin-engine/PinEngineProvider";
import EditorField from "../EditorField";
import EditorSection from "../EditorSection";

export default function InspectorMedia() {
  const { selectedPin, updatePin } = usePinEngine();
  const primaryMedia = selectedPin?.media.find((item) => item.isPrimary) ?? selectedPin?.media[0];

  return (
    <EditorSection
      title="Media"
      description="Photos and files attached to the pin."
      defaultOpen={false}
    >
      <EditorField
        label="Primary Image URL"
        value={primaryMedia?.url ?? ""}
        placeholder="https://"
        disabled={!selectedPin}
        onChange={(value) =>
          selectedPin &&
          updatePin(selectedPin.id, {
            media: value
              ? [
                  {
                    url: value,
                    mediaType: "image",
                    isPrimary: true,
                    altText: selectedPin.name,
                  },
                ]
              : [],
          })
        }
      />
      <div className="grid grid-cols-3 gap-2">
        {(selectedPin?.media.length ? selectedPin.media : [{ id: "empty", url: "" }]).map(
          (item, index) => (
            <div
              key={item.id ?? index}
              className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-[11px] font-medium text-neutral-400"
            >
              {"url" in item && item.url ? (
                <span className="px-2 text-center text-[10px] text-neutral-500">Media</span>
              ) : (
                "Empty"
              )}
            </div>
          )
        )}
      </div>
    </EditorSection>
  );
}
