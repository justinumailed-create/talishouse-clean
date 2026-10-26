"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
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
import { mapsitePublicPinLabel } from "@/lib/mapsite-pin-label";
import GoogleAddressInput from "./GoogleAddressInput";
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
      <label className="text-sm font-medium text-neutral-800">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-neutral-500">{hint}</p> : null}
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
  onKeyDown,
  hint,
  inputMode,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  onBlur?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  hint?: string;
  inputMode?: "text" | "url";
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} hint={hint} />
      <input
        type="text"
        inputMode={inputMode}
        autoComplete={inputMode === "url" ? "url" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`w-full h-11 px-4 bg-white border text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-xl ${
          error ? "border-red-300" : "border-neutral-200"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

/** Localised copy for the demo builder card (EN + DE dictionaries). */
export interface HomePinDemoCopy {
  step1Title: string;
  step1Hint: string;
  addressLabel: string;
  addressPlaceholder: string;
  addressLookupUnavailable: string;
  step2Title: string;
  step2Hint: string;
  coordsLabel: string;
  manualPlacement: string;
  nearby: string;
}

function formatCoordinateLine(value: string): string {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed.toFixed(6) : "—";
}

function DemoStepHeading({ step, title, hint }: { step: number; title: string; hint?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-[13px] font-semibold text-white"
      >
        {step}
      </span>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-neutral-950">{title}</h3>
        {hint ? <p className="mt-0.5 text-[12.5px] leading-snug text-neutral-500">{hint}</p> : null}
      </div>
    </div>
  );
}

export interface HomePinLocationSectionProps {
  values: HomePinLocationValues;
  pinImage: File | null;
  onChange: (values: Partial<HomePinLocationValues>) => void;
  onPinImageChange: (file: File | null) => void;
  mode?: "full" | "essentials";
  /**
   * "demo" (Mapsites demo page, Ralf Oct 26): one card, numbered steps —
   * single Places address box, PIN map beside it (stacked on mobile),
   * read-only coordinates line, footer row for Continue.
   */
  variant?: "default" | "demo";
  leadSlot?: ReactNode;
  footerSlot?: ReactNode;
  /** Demo variant: extra content at the bottom of the left column. */
  asideSlot?: ReactNode;
  /** Demo variant: localised step copy. */
  demoCopy?: HomePinDemoCopy;
  /** Demo variant: DOM id of the single address input. */
  addressInputId?: string;
  /** Neutral form-control name for the demo address box. */
  addressInputName?: string;
  /** Demo variant: highlight the address box (message shown by the page). */
  addressInvalid?: boolean;
  errors?: Partial<Record<keyof HomePinLocationValues | "pinImage", string>>;
}

export default function HomePinLocationSection({
  values,
  pinImage,
  onChange,
  onPinImageChange,
  mode = "full",
  variant = "default",
  leadSlot,
  footerSlot,
  asideSlot,
  demoCopy,
  addressInputId,
  addressInputName,
  addressInvalid = false,
  errors = {},
}: HomePinLocationSectionProps) {
  const pinImageInputRef = useRef<HTMLInputElement>(null);
  const coordsEditedRef = useRef(false);
  const [pinImagePreview, setPinImagePreview] = useState<string | null>(null);
  const [addressLookupNonce, setAddressLookupNonce] = useState(0);

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
      const resolved =
        update.reverseGeocodedAddress !== undefined
          ? update.reverseGeocodedAddress?.trim() || ""
          : undefined;
      onChange({
        latitude: update.latitude,
        longitude: update.longitude,
        manualPlacement: update.manualPlacement,
        ...(update.mapZoom != null ? { mapZoom: update.mapZoom } : {}),
        ...(resolved !== undefined
          ? {
              reverseGeocodedAddress: resolved,
              ...(!values.streetAddress.trim() && resolved
                ? { streetAddress: resolved }
                : {}),
            }
          : {}),
      });
    },
    [onChange, values.streetAddress]
  );

  const handleGooglePlaceSelected = useCallback(
    (place: { address: string; latitude: string; longitude: string }) => {
      onChange({
        streetAddress: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        manualPlacement: false,
        reverseGeocodedAddress: place.address,
      });
    },
    [onChange]
  );

  function handleCoordinateInput(
    field: "latitude" | "longitude",
    rawValue: string
  ) {
    coordsEditedRef.current = true;
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

  // When geo-coordinates are typed or pasted, reverse-geocode into Street Address.
  useEffect(() => {
    if (!hasValidCoordinates(values.latitude, values.longitude)) return;
    if (values.manualPlacement) return;
    if (!coordsEditedRef.current && values.streetAddress.trim()) return;

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
        coordsEditedRef.current = false;
        onChange({
          reverseGeocodedAddress: resolved,
          ...(resolved ? { streetAddress: resolved } : {}),
        });
      } catch {
        // Best-effort reverse geocode.
      }
    }, 700);

    return () => window.clearTimeout(timeout);
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

  const pinPickerStyle = useMemo(() => {
    const locationLabel = mapsitePublicPinLabel({
      lotLabel: values.futurePinLabel,
      address: values.streetAddress,
      fallback: values.reverseGeocodedAddress,
    });
    return {
      color: values.futurePinColor,
      label: locationLabel === "Location" ? null : locationLabel,
      icon: values.futurePinIcon,
      border: values.futurePinBorder,
      whiteCenter: values.futurePinWhiteCenter,
      animated: values.futurePinAnimated,
      categoryBadge: values.futurePinCategoryBadge,
      customLogoUrl: customLogoPreview,
    };
  }, [
    values.futurePinColor,
    values.futurePinLabel,
    values.streetAddress,
    values.reverseGeocodedAddress,
    values.futurePinIcon,
    values.futurePinBorder,
    values.futurePinWhiteCenter,
    values.futurePinAnimated,
    values.futurePinCategoryBadge,
    customLogoPreview,
  ]);

  const hasCoords = hasValidCoordinates(values.latitude, values.longitude);
  const hasGeoInput = Boolean(values.latitude.trim() || values.longitude.trim());
  const [showOptionalGeo, setShowOptionalGeo] = useState(hasGeoInput);

  useEffect(() => {
    if (hasGeoInput) setShowOptionalGeo(true);
  }, [hasGeoInput]);

  const isDemo = variant === "demo";

  function handleAddressBlur() {
    if (!values.streetAddress.trim()) return;
    // Fallback geocode when Places wasn't used (or key unavailable).
    if (hasValidCoordinates(values.latitude, values.longitude)) return;
    onChange({ manualPlacement: false });
    setAddressLookupNonce((current) => current + 1);
  }

  function handleAddressKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (!values.streetAddress.trim()) return;
    if (hasValidCoordinates(values.latitude, values.longitude)) return;
    onChange({ manualPlacement: false });
    setAddressLookupNonce((current) => current + 1);
  }

  const addressField = (
      <GoogleAddressInput
        label="Street Address"
        value={values.streetAddress}
        onChange={(streetAddress) =>
          onChange({ streetAddress, manualPlacement: false })
        }
        onPlaceSelected={handleGooglePlaceSelected}
        onBlur={handleAddressBlur}
        onKeyDown={handleAddressKeyDown}
        placeholder="123 Main Street"
        error={errors.streetAddress}
        required
        helper="If no street address is available, please enter one close to where you would like the PIN to appear, then manipulate the map to reflect the desired location. The geo-coordinates will adjust automatically."
      />
  );

  // Ralf (Oct 18): the MLS® field became a second URL. URL 2 keeps the
  // existing mls_url column (no migration), so old MLS® links still open.
  const linkFields = (
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="URL 1 (sales tool)"
          value={values.brokerUrl}
          onChange={(brokerUrl) => onChange({ brokerUrl })}
          placeholder="https://"
          hint="Optional. Opens from the pin URL 1 button."
          inputMode="url"
          error={errors.brokerUrl}
        />
        <InputField
          label="URL 2 (document repository or MLS®)"
          value={values.mlsUrl}
          onChange={(mlsUrl) => onChange({ mlsUrl })}
          placeholder="https://"
          hint="Optional. Opens from the pin URL 2 button."
          inputMode="url"
          error={errors.mlsUrl}
        />
      </div>
  );

  const coordinateInputs = (
    <>
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
    </>
  );

  const mapBlock = (
      <div>
        <FieldLabel
          label="PIN selector"
          hint="Zoom to the view you want — placing or moving the PIN keeps that zoom. The created Mapsite opens at the same depth."
        />
        <TalisMapsPinPicker
          latitude={values.latitude}
          longitude={values.longitude}
          streetAddress={values.streetAddress}
          manualPlacement={values.manualPlacement}
          addressLookupNonce={addressLookupNonce}
          mapZoom={values.mapZoom}
          pinStyle={pinPickerStyle}
          onLocationChange={handleLocationChange}
          onMapZoomChange={(mapZoom) => onChange({ mapZoom })}
        />
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
          <span>Powered by Talismaps™</span>
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
  );

  if (isDemo) {
    // Demo builder (Ralf, Oct 26): ONE card with numbered steps — 1 search the
    // address (Places places the PIN), 2 adjust the PIN on the map (beside on
    // desktop, stacked on mobile), 3 Continue. Coordinates are a read-only line.
    const copy = demoCopy;
    return (
      <section
        data-testid="demo-builder-card"
        className="rounded-[24px] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.06)] sm:px-7 sm:py-6"
      >
        {leadSlot}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:gap-8">
          <div className="min-w-0" data-testid="demo-step-address">
            <DemoStepHeading step={1} title={copy?.step1Title ?? "Home PIN Address"} hint={copy?.step1Hint} />
            <div className="mt-3">
              <GoogleAddressInput
                id={addressInputId}
                name={addressInputName}
                autoComplete="off"
                ignorePasswordManagers
                inputTestId="demo-address-input"
                hideLabel
                label={copy?.addressLabel ?? "Street address"}
                value={values.streetAddress}
                onChange={(streetAddress) => onChange({ streetAddress, manualPlacement: false })}
                onPlaceSelected={handleGooglePlaceSelected}
                onBlur={handleAddressBlur}
                onKeyDown={handleAddressKeyDown}
                placeholder={copy?.addressPlaceholder}
                invalid={addressInvalid}
                fallbackHintText={copy?.addressLookupUnavailable}
              />
            </div>
            {asideSlot}
          </div>
          <div className="min-w-0" data-testid="demo-step-pin">
            <DemoStepHeading step={2} title={copy?.step2Title ?? "Adjust the PIN on the map"} hint={copy?.step2Hint} />
            <div className="mt-3">
              <TalisMapsPinPicker
                heightClassName="h-[280px] sm:h-[320px] lg:h-[340px]"
                latitude={values.latitude}
                longitude={values.longitude}
                streetAddress={values.streetAddress}
                manualPlacement={values.manualPlacement}
                addressLookupNonce={addressLookupNonce}
                mapZoom={values.mapZoom}
                pinStyle={pinPickerStyle}
                onLocationChange={handleLocationChange}
                onMapZoomChange={(mapZoom) => onChange({ mapZoom })}
              />
              <p
                className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500"
                data-testid="demo-pin-coordinates"
              >
                <span className="font-mono tabular-nums text-neutral-700" data-testid="demo-pin-coordinates-value">
                  {copy?.coordsLabel ?? "PIN"} {formatCoordinateLine(values.latitude)}, {formatCoordinateLine(values.longitude)}
                </span>
                <span className="text-neutral-400">Powered by Talismaps™</span>
                {values.manualPlacement ? (
                  <span className="text-neutral-600">{copy?.manualPlacement ?? "Manual placement"}</span>
                ) : null}
                {hasCoords && values.reverseGeocodedAddress ? (
                  <span className="min-w-0 max-w-full truncate" title={values.reverseGeocodedAddress}>
                    {copy?.nearby ?? "Nearby"}: {values.reverseGeocodedAddress}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </div>
        {footerSlot ? (
          <div className="mt-6 border-t border-neutral-100 pt-5" data-testid="demo-step-continue">
            {footerSlot}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {addressField}
      {linkFields}
      {mapBlock}

      <div>
        <button
          type="button"
          onClick={() => setShowOptionalGeo((open) => !open)}
          className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
        >
          {showOptionalGeo
            ? "Hide optional geo-coordinates"
            : "Optional: add geo-coordinates"}
        </button>
        {showOptionalGeo ? (
          <div className="mt-3 grid gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel label="Geo Coordinates" />
            </div>
            {coordinateInputs}
            <p className="text-xs text-neutral-400 sm:col-span-2">
              Paste coordinates like{" "}
              <span className="font-mono text-neutral-500">
                46.088287, -59.882749
              </span>{" "}
              into either field to auto-fill both.
            </p>
          </div>
        ) : null}
      </div>

      {mode === "essentials" ? null : (
        <>
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
        </>
      )}
    </div>
  );
}

export function validateHomePinLocation(values: HomePinLocationValues): Partial<
  Record<keyof HomePinLocationValues, string>
> {
  const errors: Partial<Record<keyof HomePinLocationValues, string>> = {};
  const hasAddress = Boolean(values.streetAddress.trim());
  const hasCoords = hasValidCoordinates(values.latitude, values.longitude);

  // Street address or coordinates — geo alone is enough for vacant land.
  if (!hasAddress && !hasCoords) {
    errors.streetAddress = "Enter a street address or geo-coordinates";
    errors.latitude = "Latitude is required without an address";
    errors.longitude = "Longitude is required without an address";
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
