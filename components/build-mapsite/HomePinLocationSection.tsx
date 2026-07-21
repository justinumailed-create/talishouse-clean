"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";
import Image from "next/image";
import {
  parseCoordinatePaste,
  hasValidCoordinates,
  isValidLatitude,
  isValidLongitude,
} from "@/lib/home-pin-coordinates";
import {
  PIN_WRITEUP_MAX_LENGTH,
  type HomePinLocationValues,
} from "./home-pin-types";
import TalisMapsPinStyleSection from "./TalisMapsPinStyleSection";
import type { TalisMapsPinLocationUpdate } from "./TalisMapsPinPicker";

const TalisMapsPinPicker = dynamic(() => import("./TalisMapsPinPicker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] sm:h-[320px] rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-center text-sm text-neutral-500">
      Loading map preview...
    </div>
  ),
});

function FieldLabel({
  label,
  required,
  hint,
}: {
  label: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-1.5">
      <label className="text-xs font-medium text-neutral-500 block">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-neutral-400">{hint}</p> : null}
    </div>
  );
}

function InputField({
  label,
  required,
  value,
  onChange,
  placeholder,
  error,
  onBlur,
  hint,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  onBlur?: () => void;
  hint?: string;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} hint={hint} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full h-11 px-4 bg-white border text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-xl ${
          error ? "border-red-300" : "border-neutral-200"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export interface HomePinLocationSectionProps {
  values: HomePinLocationValues;
  pinImage: File | null;
  onChange: (values: Partial<HomePinLocationValues>) => void;
  onPinImageChange: (file: File | null) => void;
  errors?: Partial<Record<keyof HomePinLocationValues | "pinImage", string>>;
}

export default function HomePinLocationSection({
  values,
  pinImage,
  onChange,
  onPinImageChange,
  errors = {},
}: HomePinLocationSectionProps) {
  const pinImageInputRef = useRef<HTMLInputElement>(null);
  const [pinImagePreview, setPinImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!pinImage) {
      setPinImagePreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(pinImage);
    setPinImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [pinImage]);

  const handleLocationChange = useCallback(
    (update: TalisMapsPinLocationUpdate) => {
      onChange({
        latitude: update.latitude,
        longitude: update.longitude,
        manualPlacement: update.manualPlacement,
        ...(update.reverseGeocodedAddress !== undefined
          ? {
              reverseGeocodedAddress: update.reverseGeocodedAddress ?? "",
            }
          : {}),
      });
    },
    [onChange]
  );

  function handleCoordinateInput(
    field: "latitude" | "longitude",
    rawValue: string
  ) {
    const parsed = parseCoordinatePaste(rawValue);
    if (parsed) {
      onChange({
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        manualPlacement: false,
      });
      return;
    }

    onChange({
      [field]: rawValue,
      manualPlacement: false,
    });
  }

  // When coordinates are entered (option 2), reverse-geocode for metadata only.
  // Never overwrite the optional street address field.
  useEffect(() => {
    if (!hasValidCoordinates(values.latitude, values.longitude)) return;
    if (values.manualPlacement) return;

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/talismaps/geocode?lat=${encodeURIComponent(values.latitude)}&lon=${encodeURIComponent(values.longitude)}`
        );
        if (!response.ok) return;
        const payload = (await response.json()) as {
          found?: boolean;
          address?: string | null;
        };
        if (!payload.found) {
          onChange({ reverseGeocodedAddress: "" });
          return;
        }
        const resolved = payload.address?.trim() || "";
        if (resolved !== values.reverseGeocodedAddress) {
          onChange({ reverseGeocodedAddress: resolved });
        }
      } catch {
        // Best-effort reverse geocode.
      }
    }, 700);

    return () => window.clearTimeout(timeout);
    // Intentionally omit reverseGeocodedAddress / onChange to avoid loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- coord-driven reverse geocode
  }, [values.latitude, values.longitude, values.manualPlacement]);

  function handlePinWriteupChange(value: string) {
    onChange({ pinWriteup: value.slice(0, PIN_WRITEUP_MAX_LENGTH) });
  }

  const writeupLength = values.pinWriteup.length;
  const [customLogo, setCustomLogo] = useState<File | null>(null);
  const [customLogoPreview, setCustomLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!customLogo) {
      setCustomLogoPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(customLogo);
    setCustomLogoPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [customLogo]);

  const pinPickerStyle = useMemo(
    () => ({
      color: values.futurePinColor,
      label: values.futurePinLabel,
      icon: values.futurePinIcon,
      border: values.futurePinBorder,
      whiteCenter: values.futurePinWhiteCenter,
      animated: values.futurePinAnimated,
      categoryBadge: values.futurePinCategoryBadge,
      customLogoUrl: customLogoPreview,
    }),
    [
      values.futurePinColor,
      values.futurePinLabel,
      values.futurePinIcon,
      values.futurePinBorder,
      values.futurePinWhiteCenter,
      values.futurePinAnimated,
      values.futurePinCategoryBadge,
      customLogoPreview,
    ]
  );

  const hasCoords = hasValidCoordinates(values.latitude, values.longitude);

  return (
    <div className="space-y-6">
      <InputField
        label="Street Address"
        hint="Optional — leave blank for vacant land or undeveloped parcels."
        value={values.streetAddress}
        onChange={(streetAddress) =>
          onChange({ streetAddress, manualPlacement: false })
        }
        placeholder="123 Main Street (optional)"
        error={errors.streetAddress}
      />

      <div>
        <FieldLabel
          label="Geo Coordinates"
          required
          hint="Primary source of truth for the Home PIN. Paste both, type either, or place on the map."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Latitude"
            required
            value={values.latitude}
            onChange={(value) => handleCoordinateInput("latitude", value)}
            placeholder="46.088287"
            error={errors.latitude}
          />
          <InputField
            label="Longitude"
            required
            value={values.longitude}
            onChange={(value) => handleCoordinateInput("longitude", value)}
            placeholder="-59.882749"
            error={errors.longitude}
          />
        </div>
        <p className="text-xs text-neutral-400 mt-2">
          Paste coordinates like{" "}
          <span className="font-mono text-neutral-500">46.088287, -59.882749</span>{" "}
          into either field to auto-fill both.
        </p>
      </div>

      <div>
        <FieldLabel
          label="Interactive Map Preview"
          hint="Click the map to place the PIN. Drag the marker to fine-tune. Coordinates update automatically."
        />
        <TalisMapsPinPicker
          latitude={values.latitude}
          longitude={values.longitude}
          streetAddress={values.streetAddress}
          pinStyle={pinPickerStyle}
          onLocationChange={handleLocationChange}
        />
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
          <span>Powered by TalisMaps™</span>
          {values.manualPlacement ? (
            <span className="text-neutral-600">Manual placement</span>
          ) : null}
          {hasCoords && values.reverseGeocodedAddress ? (
            <span className="truncate" title={values.reverseGeocodedAddress}>
              Nearby: {values.reverseGeocodedAddress}
            </span>
          ) : null}
        </div>
      </div>

      <TalisMapsPinStyleSection
        values={{
          futurePinColor: values.futurePinColor,
          futurePinIcon: values.futurePinIcon,
          futurePinBorder: values.futurePinBorder,
          futurePinLabel: values.futurePinLabel,
          futurePinWhiteCenter: values.futurePinWhiteCenter,
          futurePinAnimated: values.futurePinAnimated,
          futurePinCategoryBadge: values.futurePinCategoryBadge,
        }}
        customLogo={customLogo}
        onChange={onChange}
        onCustomLogoChange={setCustomLogo}
      />

      <div>
        <FieldLabel label="Home PIN Image" />
        <button
          type="button"
          onClick={() => pinImageInputRef.current?.click()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-all"
        >
          <Upload className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate text-left">
            {pinImage?.name || "Click to upload (JPG, PNG, WEBP)"}
          </span>
          {pinImage && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onPinImageChange(null);
                if (pinImageInputRef.current) pinImageInputRef.current.value = "";
              }}
              className="text-xs text-red-400 hover:text-red-600 ml-2 flex-shrink-0"
            >
              Remove
            </span>
          )}
        </button>
        <input
          ref={pinImageInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            onPinImageChange(file);
          }}
        />
        {errors.pinImage && (
          <p className="text-xs text-red-500 mt-1">{errors.pinImage}</p>
        )}
        {pinImagePreview && (
          <div className="mt-3 relative w-full max-w-xs aspect-square rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50">
            <Image
              src={pinImagePreview}
              alt="Home PIN preview"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
      </div>

      <div>
        <FieldLabel label="PIN Write-up" />
        <textarea
          value={values.pinWriteup}
          onChange={(e) => handlePinWriteupChange(e.target.value)}
          rows={4}
          placeholder="Describe your Home PIN location..."
          className="w-full px-4 py-3 bg-white border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-xl resize-y"
        />
        <p
          className={`text-xs mt-1.5 ${
            writeupLength >= PIN_WRITEUP_MAX_LENGTH
              ? "text-amber-600"
              : "text-neutral-400"
          }`}
        >
          {writeupLength}/{PIN_WRITEUP_MAX_LENGTH} characters
        </p>
        {errors.pinWriteup && (
          <p className="text-xs text-red-500 mt-1">{errors.pinWriteup}</p>
        )}
      </div>
    </div>
  );
}

export function validateHomePinLocation(values: HomePinLocationValues): Partial<
  Record<keyof HomePinLocationValues, string>
> {
  const errors: Partial<Record<keyof HomePinLocationValues, string>> = {};

  if (!hasValidCoordinates(values.latitude, values.longitude)) {
    errors.latitude = "Latitude is required";
    errors.longitude = "Longitude is required";
  }

  if (values.latitude.trim() && !isValidLatitude(values.latitude)) {
    errors.latitude = "Invalid latitude";
  }

  if (values.longitude.trim() && !isValidLongitude(values.longitude)) {
    errors.longitude = "Invalid longitude";
  }

  if (values.pinWriteup.length > PIN_WRITEUP_MAX_LENGTH) {
    errors.pinWriteup = `Maximum ${PIN_WRITEUP_MAX_LENGTH} characters`;
  }

  return errors;
}
