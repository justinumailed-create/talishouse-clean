"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState } from "react";
import HomePinLocationSection from "@/components/build-mapsite/HomePinLocationSection";
import {
  defaultHomePinLocationValues,
  type HomePinLocationValues,
} from "@/components/build-mapsite/home-pin-types";
import AishaConvaiWidget from "@/components/talispros/AishaConvaiWidget";
import { useT } from "@/lib/i18n/client";
import { AISHA_CALL_PATH } from "@/lib/talispros/aisha-call-path";
import { ASSISTANT_PERSONAS } from "@/lib/talispros/assistant-personas";
import {
  HOME_MARKET_ACCOUNT_TYPES,
  HOME_MARKET_AISHA_VARIABLES_ENABLED,
  HOME_MARKET_BROKERAGE_MAX,
  HOME_MARKET_FIRST_NAME_MAX,
  HOME_MARKET_REQUIRED_STEPS,
  homeMarketAishaDynamicVariables,
  homeMarketGoodJob,
  homeMarketRegisterHref,
  homeMarketStage,
  homeMarketStepsDone,
  type HomeMarketDraft,
} from "@/lib/talispros/home-market-flow";
import { homeMarketDisplayName, type HomeMarketPin } from "@/lib/talisu/north-america-markets";
import HomePagePreview from "./HomePagePreview";

const HOME_MARKET_ADDRESS_INPUT_ID = "home-market-location-street";
const HOME_MARKET_ADDRESS_INPUT_NAME = "home-market-location";
const PIN_ZOOM = 9;

function startPin(market: HomeMarketPin): HomePinLocationValues {
  return {
    ...defaultHomePinLocationValues,
    latitude: String(market.latitude),
    longitude: String(market.longitude),
    mapZoom: PIN_ZOOM,
  };
}

/** The visitor searched an address or moved the Home PIN off the market point. */
function pinWasPlaced(pin: HomePinLocationValues, market: HomeMarketPin): boolean {
  if (pin.streetAddress.trim() || pin.reverseGeocodedAddress.trim()) return true;
  const lat = Number.parseFloat(pin.latitude);
  const lng = Number.parseFloat(pin.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return Math.abs(lat - market.latitude) > 1e-6 || Math.abs(lng - market.longitude) > 1e-6;
}

/**
 * Personalize: the form on the left (desktop floats over the page, phones
 * stack it first) and the visitor's own Home Page building up behind it.
 * Personalize → Build Mapsite → Register this Market.
 */
export default function HomeMarketPersonalize({
  market,
  onBack,
}: {
  market: HomeMarketPin;
  onBack: () => void;
}) {
  const t = useT();
  const h = t.homeMarket;
  const d = t.demo;
  const router = useRouter();
  const ids = useId();
  const firstNameRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState("");
  const [accountType, setAccountType] = useState<HomeMarketDraft["accountType"]>(null);
  const [brokerage, setBrokerage] = useState("");
  const [pin, setPin] = useState<HomePinLocationValues>(() => startPin(market));
  const [built, setBuilt] = useState(false);
  const [nudge, setNudge] = useState(false);

  const draft = useMemo<HomeMarketDraft>(
    () => ({
      firstName,
      accountType,
      brokerage,
      pinPlaced: pinWasPlaced(pin, market),
      homeAddress: (pin.streetAddress.trim() || pin.reverseGeocodedAddress.trim()).split(",").slice(0, 2).join(","),
    }),
    [firstName, accountType, brokerage, pin, market],
  );
  const stage = homeMarketStage(draft, built);
  const done = homeMarketStepsDone(draft);

  function handleAction() {
    if (stage === "personalize") {
      setNudge(true);
      if (!firstName.trim()) firstNameRef.current?.focus();
      return;
    }
    if (stage === "build") {
      setNudge(false);
      setBuilt(true);
      return;
    }
    if (accountType) router.push(homeMarketRegisterHref(accountType, market));
  }

  const actionLabel = stage === "register" ? h.registerMarket : stage === "build" ? h.buildMapsite : h.personalize;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col lg:block" data-testid="home-market-personalize-flow" data-stage={stage}>
      {/* Desktop: the Home Page fills the area behind the form. Phones: below it. */}
      <div className="order-2 h-[34rem] lg:absolute lg:inset-0 lg:h-auto lg:pl-[min(34rem,42vw)]">
        <HomePagePreview market={market} draft={draft} built={built} />
      </div>

      <div className="order-1 w-full bg-white lg:absolute lg:inset-y-0 lg:left-0 lg:z-10 lg:w-[min(34rem,42vw)] lg:overflow-y-auto lg:border-r lg:border-black/5 lg:shadow-[12px_0_40px_rgba(0,0,0,0.12)]">
        <div className="px-5 pb-6 pt-5 sm:px-7">
          <button
            type="button"
            onClick={onBack}
            className="text-[13px] font-semibold text-[#046BD9] underline-offset-2 hover:underline"
            data-testid="home-market-back"
          >
            ← {h.backToMap}
          </button>
          <p className="m-0 mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            {homeMarketDisplayName(market)}
          </p>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <h1 className="m-0 text-[22px] font-semibold leading-tight text-neutral-950">{h.formTitle}</h1>
            <span className="shrink-0 text-[12px] font-medium text-neutral-500" data-testid="home-market-steps">
              {h.stepsDone.replace("{done}", String(built ? HOME_MARKET_REQUIRED_STEPS : done)).replace("{total}", String(HOME_MARKET_REQUIRED_STEPS))}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100" aria-hidden>
            <div
              className="h-full rounded-full bg-[#046BD9] transition-[width] duration-500"
              style={{ width: `${((built ? HOME_MARKET_REQUIRED_STEPS : done) / HOME_MARKET_REQUIRED_STEPS) * 100}%` }}
            />
          </div>

          {built ? (
            <div className="mt-6" data-testid="home-market-good-job">
              <div className="flex items-start gap-3">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full shadow-[0_6px_14px_rgba(0,0,0,0.14)] ring-1 ring-black/10">
                  <Image
                    src={ASSISTANT_PERSONAS.aisha.portraitSrc}
                    alt={h.aishaName}
                    fill
                    sizes="64px"
                    className="object-cover"
                    style={{ objectPosition: "center 16%" }}
                  />
                </span>
                <div className="relative rounded-2xl rounded-tl-sm bg-[#f4f6f8] px-4 py-3 text-[15px] leading-relaxed text-neutral-900">
                  <p className="m-0" data-testid="home-market-good-job-text">
                    {homeMarketGoodJob(firstName, h.goodJob)}
                  </p>
                  <p className="m-0 mt-2 text-[14px] text-neutral-700">{h.registerHint}</p>
                  <p className="m-0 mt-2 text-[12px] font-semibold text-neutral-500">
                    {h.aishaName}, {h.aishaRole}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-semibold">
                <Link href={AISHA_CALL_PATH} className="text-[#046BD9] underline-offset-2 hover:underline" data-testid="home-market-talk-aisha">
                  {h.talkToAisha}
                </Link>
                <button type="button" onClick={() => setBuilt(false)} className="text-neutral-600 underline-offset-2 hover:underline">
                  {h.editDetails}
                </button>
              </div>
              {HOME_MARKET_AISHA_VARIABLES_ENABLED ? (
                <AishaConvaiWidget dynamicVariables={homeMarketAishaDynamicVariables(firstName, market)} />
              ) : null}
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div>
                <label htmlFor={`${ids}-first`} className="text-sm font-medium text-neutral-800">
                  {h.firstNameLabel}
                </label>
                <input
                  id={`${ids}-first`}
                  ref={firstNameRef}
                  type="text"
                  autoComplete="given-name"
                  maxLength={HOME_MARKET_FIRST_NAME_MAX}
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder={h.firstNamePlaceholder}
                  data-testid="home-market-first-name"
                  className="mt-1.5 h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                />
              </div>

              <fieldset>
                <legend className="text-sm font-medium text-neutral-800">{h.accountLabel}</legend>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {HOME_MARKET_ACCOUNT_TYPES.map((type) => {
                    const active = accountType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setAccountType(type)}
                        data-testid={`home-market-account-${type}`}
                        className={`rounded-xl border px-3 py-2.5 text-left transition ${
                          active
                            ? "border-[#046BD9] bg-[#046BD9]/5 ring-2 ring-[#046BD9]/30"
                            : "border-neutral-200 bg-white hover:border-neutral-400"
                        }`}
                      >
                        <span className="block text-[14px] font-semibold text-neutral-950">{h.accountTypes[type]}</span>
                        <span className="mt-0.5 block text-[12px] leading-snug text-neutral-500">{h.accountHints[type]}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <label htmlFor={`${ids}-brokerage`} className="text-sm font-medium text-neutral-800">
                  {h.brokerageLabel}
                </label>
                <input
                  id={`${ids}-brokerage`}
                  type="text"
                  autoComplete="organization"
                  maxLength={HOME_MARKET_BROKERAGE_MAX}
                  value={brokerage}
                  onChange={(event) => setBrokerage(event.target.value)}
                  placeholder={h.brokeragePlaceholder}
                  data-testid="home-market-brokerage"
                  className="mt-1.5 h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                />
              </div>

              <div data-testid="home-market-home-pin">
                <HomePinLocationSection
                  values={pin}
                  pinImage={null}
                  onChange={(values) => setPin((current) => ({ ...current, ...values }))}
                  onPinImageChange={() => undefined}
                  mode="essentials"
                  variant="demo"
                  stacked
                  addressInputId={HOME_MARKET_ADDRESS_INPUT_ID}
                  addressInputName={HOME_MARKET_ADDRESS_INPUT_NAME}
                  demoCopy={{
                    step1Title: h.homePinTitle,
                    step1Hint: h.homePinHint,
                    addressLabel: d.addressFieldLabel,
                    addressPlaceholder: d.addressPlaceholder,
                    addressLookupUnavailable: d.addressLookupUnavailable,
                    step2Title: d.step2Title,
                    step2Hint: d.step2Hint,
                    coordsLabel: d.coordsLabel,
                    manualPlacement: d.manualPlacement,
                    nearby: d.nearby,
                  }}
                />
              </div>
            </div>
          )}

          {nudge && stage === "personalize" ? (
            <p role="alert" className="mt-5 rounded-xl bg-amber-50 px-3 py-2 text-[13px] leading-snug text-amber-900">
              {h.missingSteps}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleAction}
            data-testid="home-market-action"
            data-stage={stage}
            className={`mt-5 flex h-12 w-full items-center justify-center rounded-full text-[16px] font-semibold text-white transition ${
              stage === "personalize"
                ? "bg-neutral-400 hover:bg-neutral-500"
                : "bg-[#046BD9] shadow-[0_6px_14px_rgba(4,107,217,0.3)] hover:bg-[#0558b3]"
            }`}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
