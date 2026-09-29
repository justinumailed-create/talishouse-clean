"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  TALISU_MKTS_PMC_BULLETS,
  TALISU_MKTS_PMC_TITLE,
  type TalisUMktsPin,
} from "@/lib/talisu/markets-pins";

type Props = {
  pins: readonly TalisUMktsPin[];
  selectedPinId: string | null;
  onSelectPin: (pinId: string) => void;
};

export default function TalisUMarketsSidebar({
  pins,
  selectedPinId,
  onSelectPin,
}: Props) {
  const [query, setQuery] = useState("");
  const [canadaOpen, setCanadaOpen] = useState(true);
  const [doMoreOpen, setDoMoreOpen] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pins;
    return pins.filter((pin) => pin.label.toLowerCase().includes(q));
  }, [pins, query]);

  const canadaPins = useMemo(
    () => filtered.filter((pin) => pin.kind === "market"),
    [filtered]
  );
  const doMorePins = useMemo(
    () => filtered.filter((pin) => pin.kind === "do-more"),
    [filtered]
  );

  return (
    <aside className="pointer-events-none absolute bottom-3 left-3 top-3 z-20 flex w-[min(92vw,20.5rem)] flex-col gap-2.5 sm:bottom-4 sm:left-4 sm:top-4">
      <div className="pointer-events-auto">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-[13px] text-neutral-900 shadow-[0_8px_24px_rgba(0,0,0,0.14)] ring-1 ring-black/5 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-400 sm:text-sm"
          aria-label="Search markets"
        />
      </div>

      <div className="pointer-events-auto max-h-[min(70dvh,42rem)] overflow-y-auto rounded-2xl bg-white px-4 pb-4 pt-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:max-h-[min(78dvh,42rem)]">
        <h1 className="text-[17px] font-semibold tracking-tight text-neutral-950">
          {TALISU_MKTS_PMC_TITLE}
        </h1>

        <ul className="mt-3 space-y-2.5 border-b border-neutral-200/80 pb-3.5">
          {TALISU_MKTS_PMC_BULLETS.map((bullet) => (
            <li
              key={bullet}
              className="flex gap-2 text-[12px] leading-[1.35] text-neutral-800"
            >
              <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-neutral-800" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 space-y-1">
          <RegionFolder
            label="Canada"
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
            {canadaPins.length === 0 ? (
              <p className="px-2 py-1 text-[12px] text-neutral-500">No matches</p>
            ) : null}
          </RegionFolder>

          <RegionFolder
            label="Do More…"
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
            {doMorePins.length === 0 ? (
              <p className="px-2 py-1 text-[12px] text-neutral-500">No matches</p>
            ) : null}
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
        className="flex w-full items-center gap-2 rounded-md px-1 py-2 text-left text-[14px] font-medium text-neutral-900 hover:bg-neutral-50 sm:py-1.5 sm:text-[13px]"
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
      className={`block w-full rounded-md px-2 py-2 text-left text-[13.5px] leading-snug transition sm:py-1 sm:text-[12.5px] ${
        selected
          ? "bg-sky-50 font-medium text-sky-900"
          : "text-neutral-800 hover:bg-neutral-50"
      }`}
    >
      {label}
    </button>
  );
}

