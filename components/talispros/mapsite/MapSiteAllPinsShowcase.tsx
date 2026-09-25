"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  AllPinsAggregation,
  AllPinsShowcasePin,
} from "@/lib/talispros/allpins-mapsite";
import {
  allPinsPublishedHref,
} from "@/lib/talispros/allpins-mapsite-ui";
import { buildIsolatedBookshelfHref } from "@/lib/talisbooks/isolated-bookshelf";

type Props = {
  aggregation: AllPinsAggregation;
  selectedPinId: string | null;
  onSelectPin: (pinId: string) => void;
};

export default function MapSiteAllPinsShowcase({
  aggregation,
  selectedPinId,
  onSelectPin,
}: Props) {
  const selected =
    aggregation.pins.find((pin) => pin.id === selectedPinId) ?? null;
  const [mobileOpen, setMobileOpen] = useState(true);
  const pinCount = aggregation.pins.length;
  const pinCountLabel = `${pinCount} live pin${pinCount === 1 ? "" : "s"} in Canada from existing Mapsites™.`;

  return (
    <aside
      className="pointer-events-none absolute bottom-3 left-3 top-3 z-20 flex w-[min(92vw,22rem)] flex-col gap-2 sm:left-4 sm:top-4 sm:bottom-4"
      data-testid="allpins-left-rail"
    >
      {!mobileOpen ? (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white/90 px-3.5 py-2.5 text-left shadow-[0_12px_40px_rgba(0,0,0,0.22)] ring-1 ring-black/5 backdrop-blur-sm md:hidden"
          data-testid="allpins-rail-expand"
          aria-expanded={false}
          aria-controls="allpins-rail-panel"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              FAST Code · ALLPINS
            </span>
            <span className="mt-0.5 block truncate text-[14px] font-semibold tracking-tight text-neutral-950">
              Talispros™ ALL-PINs
            </span>
          </span>
          <span className="shrink-0 rounded-lg bg-neutral-950 px-2.5 py-1.5 text-[11px] font-medium text-white">
            Show list
          </span>
        </button>
      ) : null}

      <div
        id="allpins-rail-panel"
        className={`pointer-events-auto min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white/90 shadow-[0_12px_40px_rgba(0,0,0,0.22)] ring-1 ring-black/5 backdrop-blur-sm ${
          mobileOpen ? "flex" : "hidden md:flex"
        }`}
        data-testid="allpins-rail-panel"
      >
        <div className="shrink-0 border-b border-neutral-200/80 px-4 py-3">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                FAST Code · ALLPINS
              </p>
              <h1 className="mt-1 text-[15px] font-semibold tracking-tight text-neutral-950">
                Talispros™ ALL-PINs
              </h1>
              <p className="mt-1 text-[12px] leading-snug text-neutral-600">
                {pinCountLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200/80 transition hover:bg-neutral-200 md:hidden"
              data-testid="allpins-rail-collapse"
              aria-expanded={true}
              aria-controls="allpins-rail-panel"
              aria-label="Hide pin list and view map"
              title="View map"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href={allPinsPublishedHref()}
              className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-neutral-800 hover:bg-neutral-50"
            >
              Published URL
            </Link>
            <Link
              href={buildIsolatedBookshelfHref({ fromAllPins: true })}
              className="rounded-lg bg-neutral-950 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-neutral-800"
            >
              Isolated shelf
            </Link>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          {aggregation.isolatedBooks.length > 0 ? (
            <section className="mb-4">
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                Isolated shelf books
              </p>
              <ul className="space-y-2">
                {aggregation.isolatedBooks.map((book) => (
                  <li key={book.id}>
                    <Link
                      href={book.viewerHref}
                      className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2.5 ring-1 ring-neutral-200/80 transition hover:bg-white hover:ring-neutral-300"
                    >
                      {book.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={book.coverImageUrl}
                          alt=""
                          className="h-12 w-9 rounded object-cover shadow-sm"
                        />
                      ) : (
                        <span className="flex h-12 w-9 items-center justify-center rounded bg-neutral-200 text-[10px] font-medium text-neutral-600">
                          Book
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-neutral-900">
                          {book.title}
                        </span>
                        <span className="block text-[11px] text-sky-700">
                          Open book viewer
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              Mapsite™ pins ({aggregation.pins.length})
            </p>
            <ul className="space-y-2">
              {aggregation.pins.map((pin) => (
                <ShowcasePinCard
                  key={pin.id}
                  pin={pin}
                  selected={pin.id === selectedPinId}
                  onSelect={() => onSelectPin(pin.id)}
                />
              ))}
            </ul>
          </section>
        </div>

        {selected ? (
          <div className="shrink-0 border-t border-neutral-200/80 bg-neutral-50/90 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              Selected · {selected.fastCode.toUpperCase()}
            </p>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-neutral-900">
              {selected.label}
            </p>
            <div className="mt-2 flex gap-2">
              {selected.bookHref ? (
                <Link
                  href={selected.bookHref}
                  className="inline-flex flex-1 items-center justify-center rounded-lg bg-neutral-950 px-3 py-2 text-[12px] font-medium text-white hover:bg-neutral-800"
                >
                  Open book
                </Link>
              ) : null}
              <Link
                href={selected.mapsiteHref}
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[12px] font-medium text-neutral-900 hover:bg-neutral-50"
              >
                Open Mapsite™
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function ShowcasePinCard({
  pin,
  selected,
  onSelect,
}: {
  pin: AllPinsShowcasePin;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1 transition ${
          selected
            ? "bg-sky-50 ring-sky-300"
            : "bg-neutral-50 ring-neutral-200/80 hover:bg-white hover:ring-neutral-300"
        }`}
      >
        {pin.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pin.coverImageUrl}
            alt=""
            className="h-11 w-11 rounded-lg object-cover shadow-sm"
          />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-200 text-[10px] font-semibold uppercase text-neutral-600">
            {pin.fastCode.slice(0, 3)}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-neutral-900">
            {pin.label}
          </span>
          <span className="block truncate text-[11px] text-neutral-500">
            {pin.fastCode.toUpperCase()}
            {pin.address ? ` · ${pin.address}` : ""}
          </span>
        </span>
      </button>
    </li>
  );
}
