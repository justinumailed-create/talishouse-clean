"use client";

import { useMemo } from "react";
import DemoHeroMap, { type DemoHeroMapPin } from "@/components/talispros/demo-mapsite/DemoHeroMap";
import type { HomePinLocationValues } from "@/components/build-mapsite/home-pin-types";
import { useT } from "@/lib/i18n/client";
import {
  cleanFirstName,
  homeMarketPreviewOpacity,
  type HomeMarketDraft,
} from "@/lib/talispros/home-market-flow";
import { homeMarketDisplayName, type HomeMarketPin } from "@/lib/talisu/north-america-markets";

/**
 * The visitor's own Mapsite, built from the Personalize form as they type
 * (client only, nothing is saved). The map is centred on their Home PIN, with
 * the PIN card open (URL 1, URL 2, TEB™, TTV™). It starts faint and becomes
 * fully visible once every step is done (Ralf, Nov 22).
 */
export default function HomePagePreview({
  market,
  draft,
  built,
  pin,
}: {
  market: HomeMarketPin;
  draft: HomeMarketDraft;
  built: boolean;
  pin: HomePinLocationValues;
}) {
  const t = useT().homeMarket;
  const opacity = homeMarketPreviewOpacity(draft, built);
  const firstName = cleanFirstName(draft.firstName);
  const brokerage = draft.brokerage.trim();
  const account = draft.accountType ? t.accountTypes[draft.accountType] : "";
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
      className="relative h-full w-full overflow-hidden bg-[#eef2f6] transition-opacity duration-700 ease-out"
      style={{ opacity }}
    >
      <DemoHeroMap
        pin={displayPin}
        title={title}
        body={body}
        accountLabel={account}
        testId="home-market-preview"
        cardOffsetClass="top-4 lg:top-8"
      />
    </section>
  );
}
