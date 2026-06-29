"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
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
import TalisMapsComingSoonCard from "./TalisMapsComingSoonCard";

const GoogleMapsPinPicker = dynamic(() => import("./GoogleMapsPinPicker"), {
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
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
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
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  onBlur?: () => void;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
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

  const handleCoordinatesChange = useCallback(
    (latitude: string, longitude: string) => {
      onChange({ latitude, longitude });
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
      });
      return;
    }

    onChange({ [field]: rawValue });
  }

  function handlePinWriteupChange(value: string) {
    onChange({ pinWriteup: value.slice(0, PIN_WRITEUP_MAX_LENGTH) });
  }

  const writeupLength = values.pinWriteup.length;

  return (
    <div className="space-y-6">
      <InputField
        label="Street Address"
        value={values.streetAddress}
        onChange={(streetAddress) => onChange({ streetAddress })}
        placeholder="123 Main Street"
        error={errors.streetAddress}
      />

      <div>
        <FieldLabel label="Geo Coordinates" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Latitude"
            value={values.latitude}
            onChange={(value) => handleCoordinateInput("latitude", value)}
            placeholder="46.088287"
            error={errors.latitude}
          />
          <InputField
            label="Longitude"
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
        <FieldLabel label="Interactive Map Preview" />
        <GoogleMapsPinPicker
          latitude={values.latitude}
          longitude={values.longitude}
          streetAddress={values.streetAddress}
          onCoordinatesChange={handleCoordinatesChange}
        />
        <p className="text-xs text-neutral-400 mt-2">
          Drag the marker to fine-tune your Home PIN location. Coordinates update
          automatically.
        </p>
      </div>

      <TalisMapsComingSoonCard />

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

  const hasAddress = values.streetAddress.trim().length > 0;
  const hasCoords = hasValidCoordinates(values.latitude, values.longitude);

  if (!hasAddress && !hasCoords) {
    errors.streetAddress = "Enter an address or coordinates";
    errors.latitude = "Required without address";
    errors.longitude = "Required without address";
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
