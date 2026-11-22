"use client";

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
import { homeMarketDisplayName, type HomeMarketPin } from "@/lib/talisu/north-america-markets";

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
}: {
  market: HomeMarketPin;
  draft: HomeMarketDraft;
  built: boolean;
  pin: HomePinLocationValues;
  onUpdatePicture?: () => void;
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
        </div>
      </div>
    </section>
  );
}
