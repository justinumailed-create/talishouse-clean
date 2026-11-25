"use client";

import Link from "next/link";
import { useMemo } from "react";
import DemoHeroMap, { type DemoHeroMapPin } from "@/components/talispros/demo-mapsite/DemoHeroMap";
import type { HomePinLocationValues } from "@/components/build-mapsite/home-pin-types";
import { useT } from "@/lib/i18n/client";
import {
  cleanFirstName,
  homeMarketPreviewOpacity,
  HOME_MARKET_PHOTO_FALLBACK,
  type HomeMarketDraft,
} from "@/lib/talispros/home-market-flow";
import {
  HOME_MARKET_OWN_PIN_COLOR,
  homeMarketDisplayName,
  type HomeMarketPin,
} from "@/lib/talisu/north-america-markets";

/**
 * The visitor's own Mapsite, built from the Personalize form as they type
 * (client only, nothing is saved). The map is centred on their Home PIN, with
 * the PIN card open (URL 1, URL 2, TEB™, TTV™). It starts faint and becomes
 * fully visible once every step is done (Ralf, Nov 22).
 *
 * Photo on the left, brokerage details on the right. With no photo, the
 * Centrefold back-cover green screen is the fallback (easy to swap later).
 */
export default function HomePagePreview({
  market,
  draft,
  built,
  pin,
  onUpdatePicture,
  registerHref = null,
}: {
  market: HomeMarketPin;
  draft: HomeMarketDraft;
  built: boolean;
  pin: HomePinLocationValues;
  onUpdatePicture?: () => void;
  /** After Build Mapsite: Register (with Aisha's code) to place more PINs. */
  registerHref?: string | null;
}) {
  const t = useT().homeMarket;
  const opacity = homeMarketPreviewOpacity(draft, built);
  const firstName = cleanFirstName(draft.firstName);
  const brokerage = draft.brokerage.trim();
  const account = draft.accountType ? t.accountTypes[draft.accountType] : "";
  const photoSrc = draft.photoUrl || HOME_MARKET_PHOTO_FALLBACK;
  const displayPin = useMemo<DemoHeroMapPin>(() => {
    const lat = Number.parseFloat(pin.latitude);
    const lng = Number.parseFloat(pin.longitude);
    const zoom = Number(pin.mapZoom);
    return {
      id: "home-market-pin",
      latitude: Number.isFinite(lat) ? lat : market.latitude,
      longitude: Number.isFinite(lng) ? lng : market.longitude,
      zoom: Number.isFinite(zoom) && zoom > 0 ? zoom : market.mapZoom || 9,
      color: HOME_MARKET_OWN_PIN_COLOR,
    };
  }, [pin.latitude, pin.longitude, pin.mapZoom, market.latitude, market.longitude, market.mapZoom]);

  const title = brokerage || firstName || homeMarketDisplayName(market);
  const bodyParts = [
    brokerage && firstName ? firstName : null,
    draft.pinPlaced && draft.homeAddress ? draft.homeAddress : null,
  ].filter(Boolean);
  const body = bodyParts.join(" · ") || t.previewWelcome;

  return (
    <section
      aria-label={t.previewLabel}
      data-testid="home-market-preview"
      data-opacity={opacity}
      className="relative flex h-full w-full overflow-hidden bg-[#eef2f6] transition-opacity duration-700 ease-out"
      style={{ opacity }}
    >
      <aside
        data-testid="home-market-preview-photo"
        className="relative z-10 flex w-[9.5rem] shrink-0 flex-col items-center gap-3 border-r border-black/5 bg-white/90 px-3 py-5 sm:w-52 sm:px-4"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoSrc}
          alt={draft.photoUrl ? firstName || t.previewYourName : t.photoFallbackAlt}
          data-fallback={draft.photoUrl ? "false" : "true"}
          className="h-28 w-28 rounded-full object-cover shadow-[0_8px_20px_rgba(0,0,0,0.16)] ring-1 ring-black/10 sm:h-36 sm:w-36"
        />
        <button
          type="button"
          data-testid="home-market-update-picture"
          onClick={onUpdatePicture}
          className="w-full rounded-full border border-neutral-200 bg-white px-2 py-1.5 text-center text-[11px] font-semibold text-[#046BD9] hover:bg-neutral-50 sm:text-[12px]"
        >
          {t.updatePicture}
        </button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          data-testid="home-market-preview-brokerage"
          className="shrink-0 border-b border-black/5 bg-white/95 px-4 py-3"
        >
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#046BD9]">
            {account || t.previewMarket}
          </p>
          <p className="m-0 mt-0.5 text-[16px] font-semibold text-neutral-950">{title}</p>
          {body ? <p className="m-0 mt-1 text-[13px] leading-snug text-neutral-600">{body}</p> : null}
        </div>
        <div className="relative min-h-0 flex-1">
          <DemoHeroMap
            pin={displayPin}
            title={title}
            body={body}
            accountLabel={account}
            testId="home-market-preview"
            cardOffsetClass="top-4 lg:top-8"
          />
          {built && registerHref ? (
            <div
              className="absolute inset-x-3 bottom-4 mx-auto max-w-[34rem] rounded-2xl bg-white/95 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.32)] ring-2 ring-[#046BD9]/40 backdrop-blur-sm sm:p-5"
              style={{ zIndex: 40 }}
              data-testid="home-market-add-pins"
            >
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#046BD9]">{t.addPinsKicker}</p>
              <p className="m-0 mt-1 text-[18px] font-semibold leading-snug text-neutral-950 sm:text-[20px]">{t.addPinsTitle}</p>
              <p className="m-0 mt-1 text-[14px] leading-snug text-neutral-700">{t.addPinsBody}</p>
              <p
                className="m-0 mt-3 text-[13px] font-semibold text-neutral-900"
                data-testid="home-market-add-listing-id"
              >
                {t.addListingId}
              </p>
              <Link
                href={registerHref}
                data-testid="home-market-add-pins-register"
                className="mt-3 flex h-12 w-full items-center justify-center rounded-full bg-[#046BD9] text-[16px] font-semibold text-white shadow-[0_6px_14px_rgba(4,107,217,0.3)] transition hover:bg-[#0558b3]"
              >
                {t.addPinsCta}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
