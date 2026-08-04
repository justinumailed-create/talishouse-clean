"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

function getGoogleMapsApiKey(): string {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_TALISMAPS_GOOGLE_MAPS_API_KEY?.trim() ||
    ""
  );
}

export interface GoogleAddressSelection {
  address: string;
  latitude: string;
  longitude: string;
}

interface GoogleAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (place: GoogleAddressSelection) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
  hint?: string;
  label?: string;
  onBlur?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Street-address field backed by Google Places Autocomplete.
 * Falls back to a plain text input if the Maps key is unavailable.
 */
export default function GoogleAddressInput({
  value,
  onChange,
  onPlaceSelected,
  required = false,
  error,
  placeholder = "Start typing a street address…",
  hint,
  label = "Street Address",
  onBlur,
  onKeyDown,
}: GoogleAddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onPlaceSelectedRef = useRef(onPlaceSelected);

  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  const apiKey = getGoogleMapsApiKey();
  const [placesFailed, setPlacesFailed] = useState(false);
  const fallbackHint =
    !apiKey || placesFailed
      ? "Address lookup unavailable — enter a full street address, then press Enter or tab out to geocode."
      : null;

  useEffect(() => {
    const input = inputRef.current;
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
          types: ["address"],
        });

        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete?.getPlace();
          const location = place?.geometry?.location;
          if (!location) return;

          const address =
            place.formatted_address?.trim() ||
            place.name?.trim() ||
            inputRef.current?.value.trim() ||
            "";
          if (!address) return;

          onPlaceSelectedRef.current({
            address,
            latitude: String(location.lat()),
            longitude: String(location.lng()),
          });
        });
      } catch {
        if (!cancelled) setPlacesFailed(true);
      }
    }

    void mountPlaces();

    return () => {
      cancelled = true;
      if (listener) {
        listener.remove();
      }
    };
  }, [apiKey]);

  return (
    <div>
      <div className="mb-1.5">
        <label className="text-sm font-medium text-neutral-800">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
        {hint ? <p className="mt-0.5 text-xs text-neutral-500">{hint}</p> : null}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        required={required}
        autoComplete="street-address"
        placeholder={placeholder}
        className={`w-full h-11 px-4 bg-white border text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-xl ${
          error ? "border-red-300" : "border-neutral-200"
        }`}
      />
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
      {fallbackHint ? (
        <p className="mt-1 text-xs text-neutral-500">{fallbackHint}</p>
      ) : null}
    </div>
  );
}
