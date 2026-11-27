"use client";

import type { MapEnginePin } from "@/lib/talismaps/map-engine";
import type { PinStack } from "@/lib/talismaps/map-engine/pin-stacks";
import { useT } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/format";

/**
 * Duplicate PINs (Ralf, Nov 27 item #6): a click on a haloed stack marker
 * lists every PIN sharing that spot so each one can be opened.
 */
export default function MapSitePinStackPicker({
  stack,
  pins,
  onPick,
  onClose,
}: {
  stack: PinStack;
  pins: ReadonlyArray<MapEnginePin>;
  onPick: (pinId: string) => void;
  onClose: () => void;
}) {
  const copy = useT().mapsite.pinStack;
  const members = stack.pinIds
    .map((id) => pins.find((pin) => pin.id === id))
    .filter((pin): pin is MapEnginePin => Boolean(pin));
  if (members.length < 2) return null;
  return (
    <div
      role="dialog"
      aria-label={fmt(copy.title, { count: String(members.length) })}
      data-testid="mapsite-pin-stack-picker"
      className="fixed bottom-20 left-1/2 z-40 w-[min(92vw,22rem)] -translate-x-1/2 rounded-2xl bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.28)] ring-4 ring-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-[15px] font-semibold text-neutral-950">
            {fmt(copy.title, { count: String(members.length) })}
          </p>
          <p className="m-0 mt-0.5 text-[13px] text-neutral-600">{copy.hint}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.close}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[17px] leading-none text-neutral-700 hover:bg-neutral-200"
        >
          ×
        </button>
      </div>
      <ul className="m-0 mt-3 max-h-60 list-none space-y-1.5 overflow-y-auto p-0">
        {members.map((pin, index) => (
          <li key={pin.id}>
            <button
              type="button"
              onClick={() => onPick(pin.id)}
              data-testid="mapsite-pin-stack-option"
              className="w-full rounded-xl bg-neutral-50 px-3 py-2 text-left text-[14px] font-medium text-neutral-900 ring-1 ring-black/10 transition hover:bg-[#035bb8] hover:text-white"
            >
              {pin.label?.trim() || fmt(copy.untitled, { n: String(index + 1) })}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
