"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { ASSISTANT_PERSONAS } from "@/lib/talispros/assistant-personas";
import { homeMarketById, type HomeMarketPin } from "@/lib/talisu/north-america-markets";
import HomeMarketMap from "./HomeMarketMap";
import HomeMarketPersonalize from "./HomeMarketPersonalize";

/**
 * Public Home Market page (Ralf, Nov 21 and 22): Aisha and example Brokerage
 * and Agent particulars on the left, the North American Markets map on the
 * right. A market PIN opens Personalize, where the visitor's own Home Page
 * builds up behind the form. `?market=<id>` reopens Personalize directly.
 */
export default function HomeMarketPage({ initialMarketId = null }: { initialMarketId?: string | null }) {
  const t = useT().homeMarket;
  const [market, setMarket] = useState<HomeMarketPin | null>(() => homeMarketById(initialMarketId));

  useEffect(() => {
    const url = new URL(window.location.href);
    if (market) url.searchParams.set("market", market.id);
    else url.searchParams.delete("market");
    window.history.replaceState(window.history.state, "", url.toString());
  }, [market]);

  if (market) {
    return <HomeMarketPersonalize key={market.id} market={market} onBack={() => setMarket(null)} />;
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[40%_60%] lg:overflow-hidden"
      data-testid="home-market-page"
    >
      <aside className="order-2 flex flex-col border-t border-neutral-200 px-5 py-6 sm:px-8 lg:order-1 lg:overflow-y-auto lg:border-r lg:border-t-0 lg:py-8">
        <AishaColumn />
      </aside>
      <section className="order-1 flex min-h-0 flex-col lg:order-2">
        <div className="bg-white px-5 py-3.5 text-center sm:px-6">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">{t.kicker}</p>
          <h1 className="m-0 mt-1 text-[18px] font-semibold leading-snug text-neutral-950 sm:text-[21px]" data-testid="home-market-select-pin">
            {t.selectPin}
          </h1>
        </div>
        <div className="relative h-[62dvh] min-h-[20rem] lg:h-auto lg:min-h-0 lg:flex-1">
          <HomeMarketMap onPersonalize={setMarket} />
        </div>
      </section>
    </div>
  );
}

/** Left column: Aisha, then example particulars showing what the visitor's page will carry. */
function AishaColumn() {
  const t = useT().homeMarket;
  return (
    <>
      <div className="flex items-center gap-4">
        <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-neutral-200 shadow-[0_8px_20px_rgba(0,0,0,0.16)] ring-1 ring-black/10 sm:h-28 sm:w-28">
          <Image
            src={ASSISTANT_PERSONAS.aisha.portraitSrc}
            alt={t.aishaName}
            fill
            priority
            sizes="112px"
            className="object-cover"
            style={{ objectPosition: "center 16%" }}
          />
        </span>
        <div>
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#046BD9]">{t.aishaRole}</p>
          <p className="m-0 mt-0.5 text-[22px] font-semibold text-neutral-950">{t.aishaName}</p>
        </div>
      </div>
      <p className="mt-4 rounded-2xl rounded-tl-sm bg-[#f4f6f8] px-4 py-3 text-[15px] leading-relaxed text-neutral-800">
        {t.aishaLine}
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-[0_4px_18px_rgba(0,0,0,0.08)] ring-1 ring-black/5" data-testid="home-market-sample">
        <div className="flex items-center justify-between bg-[#046BD9] px-4 py-2.5 text-white">
          <span className="text-[15px] font-semibold">{t.sampleBrokerage}</span>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em]">
            {t.sampleTag}
          </span>
        </div>
        <dl className="m-0 grid gap-2.5 px-4 py-4 text-[14px]">
          <Row label={t.sampleRole} value={t.sampleAgent} />
          <Row label="☎" value={t.samplePhone} />
          <Row label="✉" value={t.sampleEmail} />
        </dl>
      </div>
      <p className="mt-5 text-[14px] leading-relaxed text-neutral-600">{t.intro}</p>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-neutral-100 pb-2 last:border-b-0 last:pb-0">
      <dt className="text-[12px] font-medium text-neutral-500">{label}</dt>
      <dd className="m-0 text-right font-medium text-neutral-900">{value}</dd>
    </div>
  );
}
