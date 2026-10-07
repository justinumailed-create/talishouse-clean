"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import type { TalisUMktsPin } from "@/lib/talisu/markets-pins";
import {
  formatMktsDistanceRow,
  parseMktsGeocodePayload,
  rankMktsPinsByDistance,
  type MktsSearchOrigin,
} from "@/lib/talisu/mkts-place-search";
import { useT } from "@/lib/i18n/client";

type Props = {
  pins: readonly TalisUMktsPin[];
  selectedPinId: string | null;
  onSelectPin: (pinId: string) => void;
  /** Fired when a place/postal geocode succeeds (map should pan there). */
  onPlaceSearch: (origin: MktsSearchOrigin) => void;
  /** Cleared when the user clears the search field. */
  onPlaceSearchClear: () => void;
  searchOrigin: MktsSearchOrigin | null;
};

function getGoogleMapsApiKey(): string {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_TALISMAPS_GOOGLE_MAPS_API_KEY?.trim() ||
    ""
  );
}

export default function TalisUMarketsSidebar({
  pins,
  selectedPinId,
  onSelectPin,
  onPlaceSearch,
  onPlaceSearchClear,
  searchOrigin,
}: Props) {
  const t = useT();
  const m = t.markets;
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [canadaOpen, setCanadaOpen] = useState(true);
  const [doMoreOpen, setDoMoreOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const onPlaceSearchRef = useRef(onPlaceSearch);
  const applyOriginRef = useRef<(origin: MktsSearchOrigin) => void>(() => {});

  useEffect(() => {
    onPlaceSearchRef.current = onPlaceSearch;
  }, [onPlaceSearch]);

  useEffect(() => {
    if (searchOrigin) {
      setQuery(searchOrigin.label);
      setSearchError(null);
    }
  }, [searchOrigin]);

  const applyOrigin = useCallback((origin: MktsSearchOrigin) => {
    setQuery(origin.label);
    setSearchError(null);
    onPlaceSearchRef.current(origin);
  }, []);

  useEffect(() => {
    applyOriginRef.current = applyOrigin;
  }, [applyOrigin]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setSearchError(null);
    onPlaceSearchClear();
    inputRef.current?.focus();
  }, [onPlaceSearchClear]);

  const runGeocode = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (!q) {
        clearSearch();
        return;
      }
      setSearching(true);
      setSearchError(null);
      try {
        const response = await fetch(
          `/api/talismaps/geocode?q=${encodeURIComponent(q)}`,
        );
        if (!response.ok) {
          setSearchError(m.searchFailed);
          return;
        }
        const payload = (await response.json()) as Parameters<
          typeof parseMktsGeocodePayload
        >[0];
        const origin = parseMktsGeocodePayload(payload, q);
        if (!origin) {
          setSearchError(m.searchNoResults);
          return;
        }
        applyOrigin(origin);
      } catch {
        setSearchError(m.searchFailed);
      } finally {
        setSearching(false);
      }
    },
    [applyOrigin, clearSearch, m.searchFailed, m.searchNoResults],
  );

  // Optional Places Autocomplete (geocode/regions) — falls back to Enter → Nominatim/Google geocode API.
  useEffect(() => {
    const input = inputRef.current;
    const apiKey = getGoogleMapsApiKey();
    if (!input || !apiKey) return;

    let autocomplete: google.maps.places.Autocomplete | null = null;
    let listener: google.maps.MapsEventListener | null = null;
    let cancelled = false;

    async function mountPlaces() {
      try {
        setOptions({ key: apiKey, v: "weekly" });
        await importLibrary("places");
        if (cancelled || !inputRef.current) return;

        autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry", "name"],
          types: ["geocode"],
        });

        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete?.getPlace();
          const location = place?.geometry?.location;
          if (!location) return;
          const label =
            place.formatted_address?.trim() ||
            place.name?.trim() ||
            inputRef.current?.value.trim() ||
            "";
          if (!label) return;
          applyOriginRef.current({
            latitude: location.lat(),
            longitude: location.lng(),
            label,
          });
        });
      } catch {
        // Geocode-on-Enter still works without Places.
      }
    }

    void mountPlaces();
    return () => {
      cancelled = true;
      if (listener) listener.remove();
    };
  }, []);

  const distanceResults = useMemo(() => {
    if (!searchOrigin) return null;
    return rankMktsPinsByDistance(pins, searchOrigin);
  }, [pins, searchOrigin]);

  const canadaPins = useMemo(
    () => pins.filter((pin) => pin.kind === "market"),
    [pins],
  );
  const doMorePins = useMemo(
    () => pins.filter((pin) => pin.kind === "do-more"),
    [pins],
  );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void runGeocode(query);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && (query || searchOrigin)) {
      event.preventDefault();
      clearSearch();
    }
  };

  const labelOpts = { canada: m.canada, doMore: m.doMore };

  return (
    <aside className="pointer-events-none absolute bottom-3 left-3 top-3 z-20 flex w-[min(92vw,20.5rem)] flex-col sm:bottom-4 sm:left-4 sm:top-4">
      <div className="pointer-events-auto flex min-h-0 flex-1 flex-col gap-2.5">
        <form onSubmit={onSubmit} className="relative shrink-0">
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            aria-hidden
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.5 3a5.5 5.5 0 1 0 3.47 9.76l3.64 3.63a.75.75 0 1 0 1.06-1.06l-3.63-3.64A5.5 5.5 0 0 0 8.5 3Zm-4 5.5a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (searchError) setSearchError(null);
            }}
            onKeyDown={onKeyDown}
            placeholder={m.searchPlaceholder}
            className="w-full rounded-xl border-0 bg-white py-2.5 pl-9 pr-9 text-[13px] text-neutral-900 shadow-[0_8px_24px_rgba(0,0,0,0.14)] ring-1 ring-black/5 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-400 sm:text-sm"
            aria-label={m.searchAria}
            aria-busy={searching}
            disabled={searching}
          />
          {query ? (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              aria-label={m.searchClear}
            >
              ×
            </button>
          ) : null}
        </form>

        {searchError ? (
          <p
            className="shrink-0 rounded-lg bg-white/95 px-3 py-2 text-[12px] text-red-600 shadow ring-1 ring-black/5"
            role="status"
          >
            {searchError}
          </p>
        ) : null}

        {/*
          Single panel: brand stays visible; only the results region scrolls.
          Avoids a nested scroll trap that clipped "Do More" under the province tree.
        */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_36px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
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

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3">
            {distanceResults ? (
              <ul className="space-y-0.5" aria-label={m.distanceResultsAria}>
                {distanceResults.map(({ pin, distanceMiles }) => (
                  <li key={pin.id}>
                    <button
                      type="button"
                      onClick={() => onSelectPin(pin.id)}
                      className={`block w-full rounded-md px-2 py-2 text-left text-[13px] leading-snug transition sm:py-1.5 sm:text-[12.5px] ${
                        selectedPinId === pin.id
                          ? "bg-sky-50 font-medium text-sky-900"
                          : "text-neutral-800 hover:bg-neutral-50"
                      }`}
                    >
                      {formatMktsDistanceRow(distanceMiles, pin, labelOpts)}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-1">
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
            )}
          </div>
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
