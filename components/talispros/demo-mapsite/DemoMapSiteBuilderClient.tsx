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
import {
  DEMO_MAPSITE_PDF_FILE_NAME,
  DEMO_MAPSITE_PDF_HREF,
} from "@/lib/talispros/demo-mapsite";

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
      router.push(result.generateHref);
    });
  }

  const cardClass =
    "overflow-hidden rounded-[28px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.06)]";

  return (
    <div className="relative flex min-h-dvh flex-col items-center bg-[#f5f5f7] px-6 py-16 text-neutral-950 antialiased sm:py-24">
      <a
        href={DEMO_MAPSITE_PDF_HREF}
        download={DEMO_MAPSITE_PDF_FILE_NAME}
        className="absolute right-4 top-4 z-10 inline-flex min-h-10 items-center justify-center rounded-full bg-neutral-950 px-4 text-[13px] font-medium text-white transition hover:bg-neutral-800 sm:right-6 sm:top-5 sm:text-[14px]"
      >
        Download Demo PDF
      </a>
      <div className="w-full max-w-[480px]">
        <div className="text-center">
          <p className="text-[12px] font-medium tracking-[0.22em] text-neutral-400">
            DEMONSTRATION
          </p>
          <h1 className="mt-5 text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[40px]">
            Demo eBook and Mapsite™
          </h1>
          <p className="mx-auto mt-4 max-w-[26rem] text-[22px] font-semibold leading-snug tracking-[-0.03em] text-neutral-950">
            Place a pin.
          </p>
          <p className="mx-auto mt-2 max-w-[26rem] text-[13px] leading-relaxed text-neutral-500">
            Create Talisbook™ from pinned sample
            <br />
            FAST Code issued upon registration
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-12 space-y-5">
          <div className={`${cardClass} px-6 py-7`}>
            <label className="block">
              <span className="block text-center text-[13px] text-neutral-500">
                Listing title
              </span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={pending}
                maxLength={120}
                className="mt-2 w-full bg-transparent py-1 text-center text-[17px] leading-snug tracking-tight text-neutral-950 outline-none placeholder:text-neutral-400 disabled:opacity-40"
              />
            </label>
          </div>

          <div className={`${cardClass} px-5 py-6`}>
            <HomePinLocationSection
              values={pin}
              pinImage={null}
              onChange={(values) => setPin((current) => ({ ...current, ...values }))}
              onPinImageChange={() => undefined}
              mode="essentials"
              errors={pinErrors}
            />
          </div>

          {error ? (
            <p className="px-1 text-center text-[13px] leading-relaxed text-red-600">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="flex h-12 w-full items-center justify-center rounded-full bg-neutral-950 text-[15px] font-medium text-white transition disabled:opacity-40"
          >
            {pending ? "Continue to demo eBook…" : "Continue to demo eBook"}
          </button>
          <p className="text-center text-[12px] leading-relaxed text-neutral-400">
            Next you will extract the pinned Talispros eBook pages, optimize
            them, and Build the demonstration Talisbook™. No FAST Code is issued.
          </p>
        </form>
      </div>
    </div>
  );
}
