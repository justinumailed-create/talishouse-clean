"use client";

import { useMemo, useState, useEffect, type FormEvent } from "react";
import { Check } from "lucide-react";
import HomePinLocationSection, {
  validateHomePinLocation,
} from "@/components/build-mapsite/HomePinLocationSection";
import type { HomePinLocationValues } from "@/components/build-mapsite/home-pin-types";
import { submitMarketRegistration } from "@/app/talispros/markets/actions";
import type { RegistrationMarket } from "@/lib/registration-market";
import { REGISTRATION_MARKET_COPY } from "@/lib/registration-market";
import { hasValidCoordinates } from "@/lib/home-pin-coordinates";

interface TalisprosMarketRegistrationFormProps {
  market: RegistrationMarket;
  /** When set, associates the Build Request with this MapSite™ record. */
  mapsiteId?: string;
  /** `panel` keeps the user on MapSite™ and invokes onSuccess instead of a full success page. */
  variant?: "page" | "panel";
  onSuccess?: (result: {
    requestId?: string;
    fastCode?: string;
    mapsiteId?: string;
    accountType?: string;
  }) => void;
}

const EMPTY_PIN_LOCATION: HomePinLocationValues = {
  streetAddress: "",
  latitude: "",
  longitude: "",
  manualPlacement: false,
  reverseGeocodedAddress: "",
  mapZoom: 16,
  pinWriteup: "",
  futurePinColor: "#1A73E8",
  futurePinIcon: "none",
  futurePinBorder: "none",
  futurePinLabel: "",
  futurePinWhiteCenter: false,
  futurePinAnimated: false,
  futurePinCategoryBadge: null,
};

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function FieldLabel({
  label,
  hint,
  required,
}: {
  label: string;
  hint?: string;
  required?: boolean;
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

async function resolveCoordinatesFromAddress(address: string): Promise<{
  latitude: string;
  longitude: string;
  address: string;
} | null> {
  const response = await fetch(
    `/api/talismaps/geocode?q=${encodeURIComponent(address)}`
  );
  if (!response.ok) return null;
  const payload = (await response.json()) as {
    found?: boolean;
    latitude?: string;
    longitude?: string;
    address?: string | null;
  };
  if (!payload.found || !payload.latitude || !payload.longitude) return null;
  return {
    latitude: payload.latitude,
    longitude: payload.longitude,
    address: payload.address?.trim() || address,
  };
}

export default function TalisprosMarketRegistrationForm({
  market,
  mapsiteId,
  variant = "page",
  onSuccess,
}: TalisprosMarketRegistrationFormProps) {
  const marketCopy = REGISTRATION_MARKET_COPY[market];
  const requestId = useMemo(() => crypto.randomUUID(), []);
  const isPanel = variant === "panel";
  const accountType = "root-1";

  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(todayString());
  }, []);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [pinImage, setPinImage] = useState<File | null>(null);
  const [pinLocation, setPinLocation] =
    useState<HomePinLocationValues>(EMPTY_PIN_LOCATION);
  const [consentData, setConsentData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function ensurePinLocation(): Promise<HomePinLocationValues | null> {
    if (hasValidCoordinates(pinLocation.latitude, pinLocation.longitude)) {
      return pinLocation;
    }

    const address = pinLocation.streetAddress.trim();
    if (!address) {
      setError("Enter a street address or place a PIN with geo-coordinates.");
      return null;
    }

    const resolved = await resolveCoordinatesFromAddress(address);
    if (!resolved) {
      setError(
        "Could not recognise that address. Enter a map-recognised address or add geo-coordinates."
      );
      return null;
    }

    const next = {
      ...pinLocation,
      streetAddress: resolved.address,
      latitude: resolved.latitude,
      longitude: resolved.longitude,
      reverseGeocodedAddress: resolved.address,
      manualPlacement: false,
    };
    setPinLocation(next);
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!consentData) {
      setError("Data processing consent is required.");
      return;
    }

    setSubmitting(true);
    try {
      const resolvedLocation = await ensurePinLocation();
      if (!resolvedLocation) {
        return;
      }

      const pinErrors = validateHomePinLocation(resolvedLocation);
      const firstPinError = Object.values(pinErrors)[0];
      if (firstPinError) {
        setError(firstPinError);
        return;
      }

      const formData = new FormData();
      formData.set("requestId", requestId);
      formData.set("date", date);
      formData.set("firstName", firstName);
      formData.set("lastName", lastName);
      formData.set("email", email);
      formData.set("phone", "");
      formData.set("company", marketCopy.label);
      formData.set("marketType", market);
      formData.set("accountType", accountType);
      formData.set("fastCode", "");
      formData.set("streetAddress", resolvedLocation.streetAddress);
      formData.set("latitude", resolvedLocation.latitude);
      formData.set("longitude", resolvedLocation.longitude);
      formData.set("mapZoom", String(resolvedLocation.mapZoom));
      formData.set(
        "manualPlacement",
        resolvedLocation.manualPlacement ? "true" : "false"
      );
      formData.set(
        "reverseGeocodedAddress",
        resolvedLocation.reverseGeocodedAddress
      );
      formData.set("pinWriteup", resolvedLocation.pinWriteup);
      formData.set("futurePinColor", resolvedLocation.futurePinColor ?? "");
      formData.set("futurePinIcon", resolvedLocation.futurePinIcon ?? "");
      formData.set("futurePinBorder", resolvedLocation.futurePinBorder ?? "");
      formData.set("futurePinLabel", resolvedLocation.futurePinLabel ?? "");
      formData.set(
        "futurePinWhiteCenter",
        resolvedLocation.futurePinWhiteCenter ? "true" : "false"
      );
      formData.set(
        "futurePinAnimated",
        resolvedLocation.futurePinAnimated ? "true" : "false"
      );
      formData.set(
        "futurePinCategoryBadge",
        resolvedLocation.futurePinCategoryBadge ?? ""
      );
      formData.set("consentData", "true");
      formData.set("consentCommunications", "false");
      if (mapsiteId) {
        formData.set("mapsiteId", mapsiteId);
      }

      const result = await submitMarketRegistration(formData);
      if (!result.success) {
        setError(result.error || "Submission failed. Please try again.");
        return;
      }
      if (onSuccess) {
        onSuccess({
          requestId: result.requestId,
          fastCode: result.fastCode,
          mapsiteId: result.mapsiteId,
          accountType,
        });
        return;
      }
      setSuccess(true);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Submission failed. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success && !isPanel) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Check className="h-6 w-6 text-green-700" />
        </div>
        <h2 className="text-2xl text-neutral-900">Registration received</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          Thank you. Your {marketCopy.label} MapSite™ setup has started from your
          essentials. We have emailed your MapSite™ details to {email}.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isPanel
          ? "mx-auto max-w-3xl px-5 pb-10 pt-4"
          : "mx-auto max-w-3xl px-4 pb-12 sm:px-6"
      }
    >
      {error ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold text-neutral-900">
          General Information
        </h2>
        <p className="mb-6 text-sm text-neutral-500">
          Complete these essentials to create your Mapsite™ — personalization can
          wait until after your first success.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <FieldLabel label="Date" hint="First come, first serve." required />
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              suppressHydrationWarning
              required
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <FieldLabel
              label="Email Address"
              hint="Establishes an Account."
              required
            />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <FieldLabel label="First Name" required />
            <input
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <FieldLabel label="Last Name" required />
            <input
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      <section className="mb-8">
        <HomePinLocationSection
          values={pinLocation}
          pinImage={pinImage}
          onChange={(values) =>
            setPinLocation((current) => ({ ...current, ...values }))
          }
          onPinImageChange={setPinImage}
          mode="essentials"
        />
      </section>

      <label className="mb-6 flex items-start gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={consentData}
          onChange={(event) => setConsentData(event.target.checked)}
          className="mt-1"
        />
        <span>
          I consent to Talispros™ processing my registration data to prepare my
          Mapsite™ and coordinate payment and onboarding.
        </span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60 sm:w-auto"
      >
        {submitting
          ? "Submitting..."
          : isPanel
            ? "Submit Build Request"
            : "Create My Mapsite™"}
      </button>
    </form>
  );
}
