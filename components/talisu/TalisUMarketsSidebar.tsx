"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { TalisUMktsPin } from "@/lib/talisu/markets-pins";
import { useT } from "@/lib/i18n/client";

type Props = {
  pins: readonly TalisUMktsPin[];
  selectedPinId: string | null;
  onSelectPin: (pinId: string) => void;
};

/**
 * Markets left panel: PMC intro + Canada pin list + Do More / Modular Spaces.
 * Search removed; Do More stays pinned at the bottom so it is never clipped.
 */
export default function TalisUMarketsSidebar({
  pins,
  selectedPinId,
  onSelectPin,
}: Props) {
  const t = useT();
  const m = t.markets;
  const [canadaOpen, setCanadaOpen] = useState(true);
  const [doMoreOpen, setDoMoreOpen] = useState(true);

  const canadaPins = useMemo(
    () => pins.filter((pin) => pin.kind === "market"),
    [pins],
  );
  const doMorePins = useMemo(
    () => pins.filter((pin) => pin.kind === "do-more"),
    [pins],
  );

  return (
    <aside className="pointer-events-none absolute inset-y-2 left-2 z-20 flex w-[min(92vw,20.5rem)] flex-col sm:inset-y-3 sm:left-3">
      {/*
        Full-height panel: brand + Canada scroll in the middle; Do More is
        shrink-0 at the bottom so Modular Spaces stays fully visible.
      */}
      <div className="pointer-events-auto flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_36px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
        <div className="shrink-0 px-4 pb-2.5 pt-3.5">
          <h1 className="text-[17px] font-semibold tracking-tight text-neutral-950">
            {m.pmcTitle}
          </h1>
          <p className="mt-0.5 text-[11px] font-medium tracking-wide text-neutral-500">
            {m.pmcTagline}
          </p>
          <ul className="mt-2.5 space-y-1.5 border-b border-neutral-200/80 pb-2.5">
            {m.pmcBullets.map((bullet) => (
              <li
                key={bullet}
                className="flex gap-2 text-[11.5px] leading-[1.3] text-neutral-800"
              >
                <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-neutral-800" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-1">
          <RegionFolder
            label={m.canada}
            open={canadaOpen}
            onToggle={() => setCanadaOpen((v) => !v)}
          >
            {canadaPins.map((pin) => (
              <RegionRow
                key={pin.id}
                label={pin.label}
                selected={selectedPinId === pin.id}
                onClick={() => onSelectPin(pin.id)}
              />
            ))}
          </RegionFolder>
        </div>

        <div className="shrink-0 border-t border-neutral-200/80 px-3 pb-3 pt-1.5">
          <RegionFolder
            label={m.doMore}
            open={doMoreOpen}
            onToggle={() => setDoMoreOpen((v) => !v)}
          >
            {doMorePins.map((pin) => (
              <RegionRow
                key={pin.id}
                label={pin.label}
                selected={selectedPinId === pin.id}
                onClick={() => onSelectPin(pin.id)}
              />
            ))}
          </RegionFolder>
        </div>
      </div>
    </aside>
  );
}

function RegionFolder({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-[13px] font-medium text-neutral-900 hover:bg-neutral-50"
        aria-expanded={open}
      >
        <span className="text-neutral-500" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
        <span
          className="inline-flex h-4 w-4 items-center justify-center text-amber-700"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l1.5 2H19.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-10Z" />
          </svg>
        </span>
        <span>{label}</span>
      </button>
      {open ? (
        <div className="ml-5 space-y-0.5 border-l border-neutral-200 pl-2">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function RegionRow({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-md px-2 py-1.5 text-left text-[12.5px] leading-snug transition ${
        selected
          ? "bg-sky-50 font-medium text-sky-900"
          : "text-neutral-800 hover:bg-neutral-50"
      }`}
    >
      {label}
    </button>
  );
}
