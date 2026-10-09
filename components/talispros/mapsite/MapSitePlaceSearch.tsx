"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

/**
 * Address / place search for the PIN Dashboard, backed by Google Places API (New)
 * (`AutocompleteSuggestion` + `Place.fetchFields`). Renders nothing when there is
 * no Maps key or Places is unavailable, so map clicks and coordinates still work.
 */

export type MapSitePlaceSelection = {
  /** Place name (e.g. "Ralphs") or the first line of the address. */
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
};

type Suggestion = {
  id: string;
  main: string;
  secondary: string;
  prediction: google.maps.places.PlacePrediction;
};

type MapSitePlaceSearchProps = {
  label: string;
  placeholder: string;
  noResults: string;
  disabled?: boolean;
  onSelect: (place: MapSitePlaceSelection) => void;
  /** Called once with `false` when Places can't be used (no key / API not enabled). */
  onAvailabilityChange?: (available: boolean) => void;
};

export function getMapSitePlacesApiKey(): string {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_TALISMAPS_GOOGLE_MAPS_API_KEY?.trim() ||
    ""
  );
}

let placesLibraryPromise: Promise<google.maps.PlacesLibrary> | null = null;

function loadPlacesLibrary(apiKey: string): Promise<google.maps.PlacesLibrary> {
  if (!placesLibraryPromise) {
    // The Mapsite map already installed the loader; only configure it if not.
    if (typeof window !== "undefined" && !window.google?.maps?.importLibrary) {
      setOptions({ key: apiKey, v: "weekly" });
    }
    placesLibraryPromise = importLibrary("places").catch((error) => {
      placesLibraryPromise = null;
      throw error;
    });
  }
  return placesLibraryPromise;
}

/** Short label for a picked place: its name, else the first address segment. */
export function shortPlaceLabel(name: string | null | undefined, address: string | null | undefined): string {
  const cleanName = (name || "").trim();
  if (cleanName) return cleanName.slice(0, 80);
  const first = (address || "").split(",")[0]?.trim() || "";
  return first.slice(0, 80);
}

export default function MapSitePlaceSearch({
  label,
  placeholder,
  noResults,
  disabled = false,
  onSelect,
  onAvailabilityChange,
}: MapSitePlaceSearchProps) {
  const apiKey = getMapSitePlacesApiKey();
  const inputId = useId();
  const listId = useId();
  const [available, setAvailable] = useState<boolean>(Boolean(apiKey));
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [searched, setSearched] = useState(false);
  const libRef = useRef<google.maps.PlacesLibrary | null>(null);
  const tokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const requestRef = useRef(0);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    onAvailabilityChange?.(available);
  }, [available, onAvailabilityChange]);

  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;
    loadPlacesLibrary(apiKey)
      .then((lib) => {
        if (cancelled) return;
        if (!lib?.AutocompleteSuggestion) {
          setAvailable(false);
          return;
        }
        libRef.current = lib;
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      requestRef.current += 1;
      return;
    }
    const requestId = ++requestRef.current;
    const timer = window.setTimeout(async () => {
      const lib = libRef.current ?? (apiKey ? await loadPlacesLibrary(apiKey).catch(() => null) : null);
      if (!lib) return;
      libRef.current = lib;
      if (!tokenRef.current) tokenRef.current = new lib.AutocompleteSessionToken();
      try {
        const { suggestions: results } =
          await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: text,
            sessionToken: tokenRef.current,
          });
        if (requestId !== requestRef.current) return;
        const next: Suggestion[] = [];
        for (const item of results) {
          const prediction = item.placePrediction;
          if (!prediction) continue;
          next.push({
            id: prediction.placeId,
            main: prediction.mainText?.text || prediction.text.text,
            secondary: prediction.secondaryText?.text || "",
            prediction,
          });
        }
        setSuggestions(next.slice(0, 5));
        setActive(next.length ? 0 : -1);
        setSearched(true);
        setOpen(true);
      } catch (error) {
        if (requestId !== requestRef.current) return;
        // Places API (New) not enabled / key rejected: hide the search box.
        const message = error instanceof Error ? error.message : String(error);
        if (/PERMISSION|API_KEY|not (been )?(used|enabled)|REQUEST_DENIED|ApiNotActivated|forbidden|403/i.test(message)) {
          setAvailable(false);
        }
        setSuggestions([]);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [apiKey, query]);

  const choose = useCallback(async (suggestion: Suggestion) => {
    setOpen(false);
    try {
      const place = suggestion.prediction.toPlace();
      await place.fetchFields({ fields: ["displayName", "formattedAddress", "location"] });
      tokenRef.current = null;
      const location = place.location;
      if (!location) return;
      const formattedAddress = place.formattedAddress?.trim() || suggestion.secondary;
      onSelectRef.current({
        name: shortPlaceLabel(place.displayName || suggestion.main, formattedAddress),
        formattedAddress,
        latitude: location.lat(),
        longitude: location.lng(),
      });
      setQuery("");
      setSuggestions([]);
      setSearched(false);
    } catch {
      tokenRef.current = null;
    }
  }, []);

  if (!available) return null;

  const showList = open && query.trim().length >= 2 && (suggestions.length > 0 || searched);

  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input
        id={inputId}
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => {
          setQuery(event.target.value);
          if (event.target.value.trim().length < 2) {
            setSuggestions([]);
            setSearched(false);
          }
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((index) => Math.min(index + 1, suggestions.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
          } else if (event.key === "Enter") {
            const pick = suggestions[active] ?? suggestions[0];
            if (pick) {
              event.preventDefault();
              void choose(pick);
            }
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none disabled:opacity-60"
      />
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-md border border-neutral-200 bg-white shadow-lg"
        >
          {suggestions.length === 0 ? (
            <li className="px-3 py-2 text-xs text-neutral-500">{noResults}</li>
          ) : (
            suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                role="option"
                aria-selected={index === active}
                onMouseDown={(event) => {
                  event.preventDefault();
                  void choose(suggestion);
                }}
                onMouseEnter={() => setActive(index)}
                className={`cursor-pointer px-3 py-2 ${index === active ? "bg-neutral-100" : ""}`}
              >
                <span className="block truncate text-xs font-medium text-neutral-900">
                  {suggestion.main}
                </span>
                {suggestion.secondary ? (
                  <span className="block truncate text-[11px] text-neutral-500">
                    {suggestion.secondary}
                  </span>
                ) : null}
              </li>
            ))
          )}
          <li aria-hidden className="px-3 py-1 text-right text-[10px] text-neutral-400">
            Google
          </li>
        </ul>
      ) : null}
    </div>
  );
}
