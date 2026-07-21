"use client";

import { PIN_KIND_CONFIG } from "@/lib/talismaps/pin-engine";
import type { TalisMapsPinKind } from "@/lib/talismaps/pin-engine";
import { usePinEngine } from "@/components/talismaps/pin-engine/PinEngineProvider";

export default function EditorPinsPanel() {
  const { pins, selectedPinId, setSelectedPinId, createPin, deletePin } = usePinEngine();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-200/80 px-4 py-4">
        <h2 className="text-sm font-semibold text-neutral-900">Pins</h2>
        <p className="mt-1 text-xs text-neutral-500">Create, select, and drag pins on the map.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(Object.keys(PIN_KIND_CONFIG) as TalisMapsPinKind[]).map((pinType) => (
            <button
              key={pinType}
              type="button"
              onClick={() => void createPin(pinType)}
              className="rounded-lg border border-neutral-200 bg-white px-2 py-2 text-left text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              + {PIN_KIND_CONFIG[pinType].label}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto p-3">
        {pins.length === 0 ? (
          <li className="rounded-xl bg-neutral-50 px-3 py-4 text-center text-xs text-neutral-500">
            No pins yet. Create a Root, Derivative, Adpro, or Property Listing PIN.
          </li>
        ) : (
          pins.map((pin) => (
            <li key={pin.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedPinId(pin.id)}
                className={[
                  "min-w-0 flex-1 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                  selectedPinId === pin.id
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100",
                ].join(" ")}
              >
                <span className="block truncate font-medium">{pin.name}</span>
                <span
                  className={[
                    "mt-0.5 block truncate text-[11px]",
                    selectedPinId === pin.id ? "text-neutral-300" : "text-neutral-500",
                  ].join(" ")}
                >
                  {PIN_KIND_CONFIG[pin.pinType].label}
                </span>
              </button>
              <button
                type="button"
                onClick={() => void deletePin(pin.id)}
                className="rounded-lg px-2 py-2 text-[11px] text-red-500 hover:bg-red-50"
                aria-label={`Delete ${pin.name}`}
              >
                Delete
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
