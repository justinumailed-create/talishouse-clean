"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  PMC_ACCOUNT_BULLETS,
  pmcPinsByRegionGroup,
  type PmcRegionalPin,
  type PmcRegionGroup,
} from "@/lib/talispros/pmc-regional-pins";

interface MapSitePmcSidebarProps {
  pins: PmcRegionalPin[];
  selectedPinId: string | null;
  onSelectPin: (pinId: string) => void;
  onFocusRegion: (group: PmcRegionGroup) => void;
}

export default function MapSitePmcSidebar({
  pins,
  selectedPinId,
  onSelectPin,
  onFocusRegion,
}: MapSitePmcSidebarProps) {
  const [query, setQuery] = useState("");
  const [canadaOpen, setCanadaOpen] = useState(true);
  const [usaOpen, setUsaOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pins;
    return pins.filter(
      (pin) =>
        pin.label.toLowerCase().includes(q) ||
        pin.country.toLowerCase().includes(q) ||
        pin.description.toLowerCase().includes(q)
    );
  }, [pins, query]);

  const canadaPins = pmcPinsByRegionGroup(filtered, "canada");
  const usaPins = pmcPinsByRegionGroup(filtered, "usa");

  return (
    <aside className="pointer-events-none absolute left-3 top-3 z-20 flex w-[min(92vw,20.5rem)] flex-col gap-3 sm:left-4 sm:top-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.16)] ring-1 ring-black/5">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-neutral-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search..."
          className="w-full bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
          aria-label="Search Root Account markets"
        />
      </div>

      <div className="pointer-events-auto max-h-[min(78dvh,42rem)] overflow-y-auto rounded-2xl bg-white px-4 pb-4 pt-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
        <h1 className="text-[17px] font-semibold tracking-tight text-neutral-950">
          Talispros™ PMC
        </h1>

        <ul className="mt-3 space-y-2.5 border-b border-neutral-200/80 pb-3.5">
          {PMC_ACCOUNT_BULLETS.map((bullet) => (
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
          <button
            type="button"
            onClick={() => {
              setCanadaOpen(true);
              onFocusRegion("canada");
            }}
            className="block w-full rounded-md px-1 py-1 text-left text-[13px] font-medium text-sky-700 underline-offset-2 hover:underline"
          >
            Root Accounts: Canada
          </button>
          <button
            type="button"
            onClick={() => {
              setUsaOpen(true);
              onFocusRegion("usa");
            }}
            className="block w-full rounded-md px-1 py-1 text-left text-[13px] font-medium text-sky-700 underline-offset-2 hover:underline"
          >
            Root Accounts: USA
          </button>
        </div>

        <div className="mt-2 space-y-1">
          <RegionFolder
            label="Canada"
            open={canadaOpen}
            onToggle={() => setCanadaOpen((current) => !current)}
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
            label="USA"
            open={usaOpen}
            onToggle={() => setUsaOpen((current) => !current)}
          >
            {usaPins.map((pin) => (
              <RegionRow
                key={pin.id}
                label={pin.label}
                selected={selectedPinId === pin.id}
                onClick={() => onSelectPin(pin.id)}
              />
            ))}
            {usaPins.length === 0 ? (
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
        className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-[13px] font-medium text-neutral-900 hover:bg-neutral-50"
        aria-expanded={open}
      >
        <span className="text-neutral-500" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
        <span className="inline-flex h-4 w-4 items-center justify-center text-amber-700" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l1.5 2H19.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-10Z" />
          </svg>
        </span>
        <span>{label}</span>
      </button>
      {open ? <div className="ml-5 space-y-0.5 border-l border-neutral-200 pl-2">{children}</div> : null}
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
      className={`block w-full rounded-md px-2 py-1 text-left text-[12.5px] leading-snug transition ${
        selected
          ? "bg-sky-50 font-medium text-sky-900"
          : "text-neutral-800 hover:bg-neutral-50"
      }`}
    >
      {label}
    </button>
  );
}
