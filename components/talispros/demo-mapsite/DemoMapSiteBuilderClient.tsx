"use client";

import { useT } from "@/lib/i18n/client";
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
import { WorkingPageCtaButton, AISHA_AVATAR_SRC } from "@/components/talispros/WorkingPageCtaLink";
import WorkingPageShell from "@/components/talispros/WorkingPageShell";
import DemoDownloadMenu from "@/components/talispros/demo-mapsite/DemoDownloadMenu";

const DEMO_FALLBACK_TITLE = "Demo Mapsite";
const DEMO_FORM_ID = "demo-mapsite-form";

export default function DemoMapSiteBuilderClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pin, setPin] = useState<HomePinLocationValues>(defaultHomePinLocationValues);
  const t = useT();
  const d = t.demo;
  // Ralf (Oct 18): the box is labelled "Demo Mapsite" and shows "Home PIN
  // Address" as its prompt; an empty box falls back to "Demo Mapsite".
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pinErrors, setPinErrors] = useState<
    Partial<Record<keyof HomePinLocationValues, string>>
  >({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPinErrors = validateHomePinLocation(pin);
    setPinErrors(nextPinErrors);
    if (Object.keys(nextPinErrors).length > 0) {
      setError(d.errPlacePin);
      return;
    }

    const formData = new FormData();
    formData.set("propertyTitle", title.trim() || DEMO_FALLBACK_TITLE);
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
    "overflow-hidden rounded-[24px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.06)]";

  return (
    // Mapsites page (Ralf, Oct 17 + Oct 18): Catalogue look at ~1,400 px —
    // one line + Aisha link on top ("Build Mapsite Demo" submits the form),
    // nothing else above or below the form. Name + address on the left,
    // geo-coordinates above the map on the right (Z-pattern).
    <WorkingPageShell
      testId="mapsites-page"
      contentTestId="mapsites-content"
      headline={t.catalogueUi.mapsitesHeadline}
      headlineAction={
        <WorkingPageCtaButton
          form={DEMO_FORM_ID}
          disabled={pending}
          label={d.buildMapsiteDemo}
          avatarSrc={AISHA_AVATAR_SRC}
          avatarAlt="Aisha C."
          testId="mapsites-build-demo-link"
        />
      }
      topRight={<DemoDownloadMenu className="absolute right-4 top-3 z-20 sm:right-6" />}
    >
      <form id={DEMO_FORM_ID} onSubmit={handleSubmit}>
        <HomePinLocationSection
          values={pin}
          pinImage={null}
          onChange={(values) => setPin((current) => ({ ...current, ...values }))}
          onPinImageChange={() => undefined}
          mode="essentials"
          variant="demo"
          errors={pinErrors}
          leadSlot={
            <div className={`${cardClass} px-5 py-5`}>
              <label className="block">
                <span className="block text-[13px] font-medium text-neutral-800">
                  {d.listingTitle}
                </span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  disabled={pending}
                  maxLength={120}
                  placeholder={d.defaultListingTitle}
                  data-testid="demo-home-pin-name"
                  className="mt-1.5 h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] tracking-tight text-neutral-950 outline-none placeholder:text-neutral-500 focus:ring-2 focus:ring-neutral-900/20 disabled:opacity-40"
                />
                <span
                  className="mt-1 block text-[12px] leading-snug text-neutral-500"
                  data-testid="demo-home-pin-name-hint"
                >
                  {d.homePinNameHint}
                </span>
              </label>
            </div>
          }
          footerSlot={
            <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
              {error ? (
                <p className="mr-auto text-[13px] leading-relaxed text-red-600">{error}</p>
              ) : (
                <p className="mr-auto max-w-[34rem] text-[11.5px] leading-snug text-neutral-500">
                  {d.nextNote}
                </p>
              )}
              <button
                type="submit"
                disabled={pending}
                data-testid="demo-continue"
                className="flex h-11 items-center justify-center rounded-full bg-neutral-950 px-7 text-[15px] font-medium text-white transition disabled:opacity-40"
              >
                {pending ? d.continuing : d.continue}
              </button>
            </div>
          }
        />
      </form>
    </WorkingPageShell>
  );
}
