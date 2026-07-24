"use client";

import { useMemo, useState, useEffect, type FormEvent } from "react";
import { Check, Copy } from "lucide-react";
import HomePinLocationSection, {
  validateHomePinLocation,
} from "@/components/build-mapsite/HomePinLocationSection";
import { defaultHomePinLocationValues } from "@/components/build-mapsite/home-pin-types";
import { submitMarketRegistration } from "@/app/talispros/markets/actions";
import type { RegistrationMarket } from "@/lib/registration-market";
import { REGISTRATION_MARKET_COPY } from "@/lib/registration-market";

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

const ACCOUNT_OPTIONS = [
  {
    value: "root-1",
    label: "Root Account™ — $1 activation (CAD $1.00 + GST)",
  },
  {
    value: "root",
    label: "Root Account™ (up to 100 Derivative Accounts; SPLITS enabled)",
  },
  {
    value: "derivative",
    label: "Derivative Account (multi-PIN Accounts; SPLITS enabled)",
  },
  {
    value: "adpro-single",
    label: "Adpros Account (individual PINs, no SPLITS)",
  },
] as const;

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

export default function TalisprosMarketRegistrationForm({
  market,
  mapsiteId,
  variant = "page",
  onSuccess,
}: TalisprosMarketRegistrationFormProps) {
  const marketCopy = REGISTRATION_MARKET_COPY[market];
  const requestId = useMemo(() => crypto.randomUUID(), []);
  const isPanel = variant === "panel";

  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(todayString());
  }, []);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState("root-1");
  const [fastCode, setFastCode] = useState("");
  const [picture, setPicture] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [pinImage, setPinImage] = useState<File | null>(null);
  const [pinLocation, setPinLocation] = useState(defaultHomePinLocationValues);
  const [consentData, setConsentData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [issuedFastCode, setIssuedFastCode] = useState("");
  const [copiedFastCode, setCopiedFastCode] = useState(false);

  const requiresFastCode =
    accountType === "derivative" || accountType.startsWith("adpro");
  const isDollarRoot = accountType === "root-1";

  async function uploadFile(fieldName: string, file: File): Promise<string | null> {
    const body = new FormData();
    body.set("requestId", requestId);
    body.set("fieldName", fieldName);
    body.set("file", file);
    const response = await fetch("/api/talispros/build-mapsite/upload", {
      method: "POST",
      body,
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { url?: string };
    return payload.url ?? null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const pinErrors = validateHomePinLocation(pinLocation);
    const firstPinError = Object.values(pinErrors)[0];
    if (firstPinError) {
      setError(firstPinError);
      return;
    }
    if (!consentData) {
      setError("Data processing consent is required.");
      return;
    }
    if (requiresFastCode && !fastCode.trim()) {
      setError("FAST Code is required for this account type.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("requestId", requestId);
      formData.set("date", date);
      formData.set("firstName", firstName);
      formData.set("lastName", lastName);
      formData.set("email", email);
      formData.set("phone", phone);
      formData.set("company", marketCopy.label);
      formData.set("marketType", market);
      formData.set("accountType", accountType);
      formData.set("fastCode", fastCode);
      formData.set("streetAddress", pinLocation.streetAddress);
      formData.set("latitude", pinLocation.latitude);
      formData.set("longitude", pinLocation.longitude);
      formData.set("mapZoom", String(pinLocation.mapZoom));
      formData.set(
        "manualPlacement",
        pinLocation.manualPlacement ? "true" : "false"
      );
      formData.set(
        "reverseGeocodedAddress",
        pinLocation.reverseGeocodedAddress
      );
      formData.set("pinWriteup", pinLocation.pinWriteup);
      formData.set("futurePinColor", pinLocation.futurePinColor ?? "");
      formData.set("futurePinIcon", pinLocation.futurePinIcon ?? "");
      formData.set("futurePinBorder", pinLocation.futurePinBorder ?? "");
      formData.set("futurePinLabel", pinLocation.futurePinLabel ?? "");
      formData.set("futurePinWhiteCenter", pinLocation.futurePinWhiteCenter ? "true" : "false");
      formData.set("futurePinAnimated", pinLocation.futurePinAnimated ? "true" : "false");
      formData.set("futurePinCategoryBadge", pinLocation.futurePinCategoryBadge ?? "");
      formData.set("consentData", "true");
      formData.set("consentCommunications", "false");
      if (mapsiteId) {
        formData.set("mapsiteId", mapsiteId);
      }

      if (picture) {
        const pictureUrl = await uploadFile("picture", picture);
        if (pictureUrl) formData.set("pictureUrl", pictureUrl);
        else formData.set("picture", picture);
      }
      if (logo) {
        const logoUrl = await uploadFile("logo", logo);
        if (logoUrl) formData.set("logoUrl", logoUrl);
        else formData.set("logo", logo);
      }
      if (pinImage) {
        const pinImageUrl = await uploadFile("pinImage", pinImage);
        if (pinImageUrl) formData.set("pinImageUrl", pinImageUrl);
        else formData.set("pinImage", pinImage);
      }

      const result = await submitMarketRegistration(formData);
      if (!result.success) {
        setError(result.error || "Submission failed. Please try again.");
        return;
      }
      setIssuedFastCode(result.fastCode || fastCode.trim());
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Submission failed. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyFastCode() {
    if (!issuedFastCode) return;
    try {
      await navigator.clipboard.writeText(issuedFastCode);
      setCopiedFastCode(true);
      window.setTimeout(() => setCopiedFastCode(false), 2000);
    } catch {
      setError("Could not copy FAST Code. Please copy it manually.");
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
          Thank you. Your {marketCopy.label} registration has been submitted. A
          marketing manager will review your information, prepare your MapSite™,
          and send a payment link when ready.
        </p>
        {issuedFastCode ? (
          <div className="mx-auto mt-8 max-w-md rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Your FAST Code
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 font-mono text-sm text-neutral-900">
                {issuedFastCode}
              </code>
              <button
                type="button"
                onClick={copyFastCode}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                <Copy className="h-4 w-4" />
                {copiedFastCode ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Save this code. You will use it to access your MapSite™ and client
              portal.
            </p>
          </div>
        ) : null}
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

      <section className="mb-10">
        <h2 className="mb-6 text-lg font-semibold text-neutral-900">General Information</h2>
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
            <FieldLabel label="Email Address" hint="Establishes an Account." required />
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
          <div>
            <FieldLabel label="Phone" required />
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <FieldLabel label="Type of Account" required />
            <div className="space-y-2">
              {ACCOUNT_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-start gap-2 text-sm text-neutral-700">
                  <input
                    type="radio"
                    name="accountType"
                    value={option.value}
                    checked={accountType === option.value}
                    onChange={() => setAccountType(option.value)}
                    className="mt-1"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {isDollarRoot ? (
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                After submit, your MapSite™ shows a CAD $1.00 + GST PayPal
                checkout. Payment enables Express an Interest and activates the
                MapSite™ for admin management.
              </p>
            ) : null}
          </div>
          {requiresFastCode ? (
            <div className="sm:col-span-2">
              <FieldLabel label="FAST Code" hint="Identifies an Account." required />
              <input
                type="text"
                value={fastCode}
                onChange={(event) => setFastCode(event.target.value.toUpperCase())}
                required
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm uppercase"
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-6 text-lg font-semibold text-neutral-900">
          Mapsite™ Personalization
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <FieldLabel
              label="Your Picture"
              hint="Be sure to choose a picture with good lighting and a high contrast background."
            />
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setPicture(event.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
          </div>
          <div>
            <FieldLabel
              label="Your Logo"
              hint="Choose JPG or PNG file format, ideally square in dimensions."
            />
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setLogo(event.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-6 text-lg font-semibold text-neutral-900">PIN Location</h2>
        <HomePinLocationSection
          values={pinLocation}
          pinImage={pinImage}
          onChange={(values) => setPinLocation((current) => ({ ...current, ...values }))}
          onPinImageChange={setPinImage}
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
          MapSite™ and coordinate payment and onboarding.
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
            : "Submit Registration"}
      </button>
    </form>
  );
}
