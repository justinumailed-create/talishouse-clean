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
import {
  DEMO_ADDRESS_INPUT_ID,
  demoTitleFromAddress,
  hasDemoPinChoice,
} from "@/lib/talispros/demo-builder";

const DEMO_FALLBACK_TITLE = "Demo Mapsite";
const DEMO_FORM_ID = "demo-mapsite-form";
function focusAddressBox() {
  const input = document.getElementById(DEMO_ADDRESS_INPUT_ID) as HTMLInputElement | null;
  if (!input) return;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  input.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  input.focus({ preventScroll: true });
}

export default function DemoMapSiteBuilderClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pin, setPin] = useState<HomePinLocationValues>(defaultHomePinLocationValues);
  const t = useT();
  const d = t.demo;
  const [error, setError] = useState<string | null>(null);
  const [addressInvalid, setAddressInvalid] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Validation only on Continue, as one friendly inline message (no native
    // required-field popups: the form is noValidate and nothing is required).
    const pinErrors = validateHomePinLocation(pin);
    if (!hasDemoPinChoice(pin) || Object.keys(pinErrors).length > 0) {
      setAddressInvalid(true);
      setError(d.errPlacePin);
      return;
    }
    setAddressInvalid(false);

    // One address box: the Places result is both the street address and the
    // listing title (an untouched demo falls back to "Demo Mapsite").
    const streetAddress = pin.streetAddress.trim() || pin.reverseGeocodedAddress.trim();
    const formData = new FormData();
    formData.set("propertyTitle", demoTitleFromAddress(streetAddress) || DEMO_FALLBACK_TITLE);
    formData.set("streetAddress", streetAddress);
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

  return (
    // Mapsites page (Ralf, Oct 17/18/26): Catalogue top strip + Aisha pill
    // ("Build Mapsite Demo" scrolls to and focuses Step 1), then ONE card.
    <WorkingPageShell
      testId="mapsites-page"
      contentTestId="mapsites-content"
      headline={t.catalogueUi.mapsitesHeadline}
      headlineVariant="catalogue"
      headlineAction={
        <WorkingPageCtaButton
          onClick={focusAddressBox}
          disabled={pending}
          label={d.buildMapsiteDemo}
          avatarSrc={AISHA_AVATAR_SRC}
          avatarAlt="Aisha C."
          testId="mapsites-build-demo-link"
        />
      }
    >
      <form id={DEMO_FORM_ID} onSubmit={handleSubmit} noValidate>
        <HomePinLocationSection
          values={pin}
          pinImage={null}
          onChange={(values) => {
            setPin((current) => ({ ...current, ...values }));
            if (error || addressInvalid) {
              setAddressInvalid(false);
              setError(null);
            }
          }}
          onPinImageChange={() => undefined}
          mode="essentials"
          variant="demo"
          addressInputId={DEMO_ADDRESS_INPUT_ID}
          addressInvalid={addressInvalid}
          demoCopy={{
            step1Title: d.defaultListingTitle,
            step1Hint: d.homePinNameHint,
            addressLabel: d.defaultListingTitle,
            addressPlaceholder: d.addressPlaceholder,
            addressLookupUnavailable: d.addressLookupUnavailable,
            step2Title: d.step2Title,
            step2Hint: d.step2Hint,
            coordsLabel: d.coordsLabel,
            manualPlacement: d.manualPlacement,
            nearby: d.nearby,
          }}
          leadSlot={
            <h2
              className="mb-5 text-[13px] font-medium uppercase tracking-[0.14em] text-neutral-500"
              data-testid="demo-card-title"
            >
              {d.listingTitle}
            </h2>
          }
          footerSlot={
            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 space-y-2 sm:max-w-[26rem]">
                <DemoDownloadMenu className="relative inline-block" align="left" variant="secondary" />
                <p className="text-[11.5px] leading-snug text-neutral-500" data-testid="demo-next-note">
                  {d.nextNote}
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                {error ? (
                  <p
                    role="alert"
                    data-testid="demo-inline-error"
                    className="rounded-xl bg-amber-50 px-3 py-2 text-[13px] leading-snug text-amber-900 sm:max-w-[24rem]"
                  >
                    {error}
                  </p>
                ) : null}
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-[13px] font-semibold text-white"
                  >
                    3
                  </span>
                  <button
                    type="submit"
                    disabled={pending}
                    data-testid="demo-continue"
                    className="flex h-11 flex-1 items-center justify-center rounded-full bg-neutral-950 px-7 text-[15px] font-medium text-white transition hover:bg-neutral-800 disabled:opacity-40 sm:flex-none"
                  >
                    {pending ? d.continuing : d.continue}
                  </button>
                </div>
              </div>
            </div>
          }
        />
      </form>
    </WorkingPageShell>
  );
}
