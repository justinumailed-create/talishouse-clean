"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import HomePinLocationSection, {
  validateHomePinLocation,
} from "@/components/build-mapsite/HomePinLocationSection";
import {
  defaultHomePinLocationValues,
  type HomePinLocationValues,
} from "@/components/build-mapsite/home-pin-types";
import { createDemoMapSiteAction } from "@/app/talispros/demo-mapsite/actions";

export default function DemoMapSiteBuilderClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pin, setPin] = useState<HomePinLocationValues>(defaultHomePinLocationValues);
  const [title, setTitle] = useState("Demo Mapsite™");
  const [error, setError] = useState<string | null>(null);
  const [pinErrors, setPinErrors] = useState<
    Partial<Record<keyof HomePinLocationValues, string>>
  >({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPinErrors = validateHomePinLocation(pin);
    setPinErrors(nextPinErrors);
    if (Object.keys(nextPinErrors).length > 0) {
      setError("Place a pin or enter an address to continue.");
      return;
    }

    const formData = new FormData();
    formData.set("propertyTitle", title);
    formData.set(
      "streetAddress",
      pin.streetAddress.trim() || pin.reverseGeocodedAddress.trim(),
    );
    formData.set("description", pin.pinWriteup);
    formData.set("latitude", pin.latitude);
    formData.set("longitude", pin.longitude);
    formData.set("mapZoom", String(pin.mapZoom));

    startTransition(async () => {
      setError(null);
      const result = await createDemoMapSiteAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.mapsiteHref);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <label className="block text-sm">
        <span className="font-medium text-neutral-800">Listing title</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900"
          maxLength={120}
        />
      </label>

      <HomePinLocationSection
        values={pin}
        pinImage={null}
        onChange={(values) => setPin((current) => ({ ...current, ...values }))}
        onPinImageChange={() => undefined}
        mode="essentials"
        errors={pinErrors}
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-neutral-900 px-5 py-3.5 text-base font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
      >
        {pending ? "Creating demo…" : "Create demo Mapsite™ and eBook"}
      </button>
      <p className="text-center text-xs text-neutral-500">
        This demonstration does not issue a FAST Code. The pinned Talispros eBook
        is attached automatically.
      </p>
    </form>
  );
}
