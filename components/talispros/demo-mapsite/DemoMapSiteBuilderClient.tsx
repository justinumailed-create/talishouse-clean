"use client";

import { useT } from "@/lib/i18n/client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import HomePinLocationSection, {
  validateHomePinLocation,
} from "@/components/build-mapsite/HomePinLocationSection";
import {
  defaultHomePinLocationValues,
  type HomePinLocationValues,
} from "@/components/build-mapsite/home-pin-types";
import { createDemoMapSiteAction } from "@/app/talispros/demo-mapsite/actions";
import WorkingPageShell from "@/components/talispros/WorkingPageShell";
import DemoHeroMap from "@/components/talispros/demo-mapsite/DemoHeroMap";
import FastCodeSlotsPanel from "@/components/talispros/demo-mapsite/FastCodeSlotsPanel";
import type { FastCodeSlotsPanelData } from "@/lib/talispros/fast-code-slots";
import {
  DEMO_ADDRESS_INPUT_ID,
  DEMO_ADDRESS_INPUT_NAME,
  demoBuilderStartsOpen,
  demoTitleFromAddress,
  hasDemoPinChoice,
} from "@/lib/talispros/demo-builder";

const DEMO_FALLBACK_TITLE = "Demo Mapsite";
function searchParamsObject(): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

export default function DemoMapSiteBuilderClient({
  initialOpen = false,
  initialPin,
  slotsPanel,
}: {
  /** Deep link / Back already carries build, address or PIN state. */
  initialOpen?: boolean;
  initialPin?: Partial<HomePinLocationValues>;
  /** FAST Code slots beside the card (codes only for the signed-in agent's own list). */
  slotsPanel?: FastCodeSlotsPanelData;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pin, setPin] = useState<HomePinLocationValues>(() => ({
    ...defaultHomePinLocationValues,
    ...initialPin,
  }));
  const t = useT();
  const d = t.demo;
  const [error, setError] = useState<string | null>(null);
  const [addressInvalid, setAddressInvalid] = useState(false);
  // The hero shows first. Deep links and Back that carry ?build=1, an address
  // or a PIN open the step 1-3 card directly.
  const [showCard, setShowCard] = useState(initialOpen);

  useEffect(() => {
    function syncFromUrl() {
      setShowCard(demoBuilderStartsOpen(searchParamsObject()));
    }
    // Back from the eBook step restores this page from the client router
    // cache with the first render's props, so re-read ?build=1 on mount too.
    if (demoBuilderStartsOpen(searchParamsObject())) syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  function handleContinue() {
    // Validation only on Continue, as one friendly inline message. There is
    // no form element around the address box (so Safari / iCloud Keychain never
    // read it as a one-field login) and nothing is marked required.
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
    // Mapsites page (Ralf, Nov 3; Arun, Nov 4): no top strip line or build
    // pill, no side card. The FAST Codes sit under the write-up.
    <WorkingPageShell testId="mapsites-page" contentTestId="mapsites-content">
      {!showCard ? (
        <section
          className="demo-hero mx-auto w-full"
          data-testid="demo-hero"
          aria-labelledby="demo-hero-title"
        >
          <div className="demo-hero__panel grid overflow-hidden rounded-[20px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05),0_18px_48px_rgba(0,0,0,0.10)] lg:grid-cols-2">
            <div className="demo-hero__media relative min-w-0">
              <DemoHeroMap />
            </div>
            <div className="flex min-w-0 flex-col justify-center px-6 py-7 sm:px-10 sm:py-10 lg:px-12">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-500 sm:text-[13px]">
                {d.hero.eyebrow}
              </p>
              <h1
                id="demo-hero-title"
                className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.01em] text-neutral-950 sm:text-[30px]"
                style={{ textWrap: "balance" }}
              >
                {d.hero.headline}
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-neutral-700 sm:text-[16px]">{d.hero.body1}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-neutral-700 sm:text-[16px]">{d.hero.body2}</p>
              {slotsPanel ? <FastCodeSlotsPanel data={slotsPanel} /> : null}
            </div>
          </div>
        </section>
      ) : (
        <div data-testid="demo-builder">
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
          addressInputName={DEMO_ADDRESS_INPUT_NAME}
          addressInvalid={addressInvalid}
          demoCopy={{
            step1Title: d.defaultListingTitle,
            step1Hint: d.homePinNameHint,
            addressLabel: d.addressFieldLabel,
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
            <div className="flex sm:justify-end">
              <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
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
                    type="button"
                    onClick={handleContinue}
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
        </div>
      )}
    </WorkingPageShell>
  );
}
