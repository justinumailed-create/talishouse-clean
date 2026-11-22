"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useT } from "@/lib/i18n/client";
import { ASSISTANT_PERSONAS } from "@/lib/talispros/assistant-personas";
import { CENTREFOLD_FRONT_COVER } from "@/lib/talispros/centrefold-book";
import {
  cleanFirstName,
  homeMarketPreviewOpacity,
  type HomeMarketDraft,
} from "@/lib/talispros/home-market-flow";
import { TALISU_MKTS_MARKET_HERO, TALISU_MKTS_TREE_LOGO } from "@/lib/talisu/markets-pins";
import { homeMarketDisplayName, type HomeMarketPin } from "@/lib/talisu/north-america-markets";

/**
 * The visitor's own account Home Page, built from the Personalize form as they
 * type (client only, nothing is saved). It starts faint and becomes fully
 * visible once every step is done (Ralf, Nov 22).
 */
export default function HomePagePreview({
  market,
  draft,
  built,
}: {
  market: HomeMarketPin;
  draft: HomeMarketDraft;
  built: boolean;
}) {
  const t = useT().homeMarket;
  const opacity = homeMarketPreviewOpacity(draft, built);
  const firstName = cleanFirstName(draft.firstName);
  const brokerage = draft.brokerage.trim();
  const account = draft.accountType ? t.accountTypes[draft.accountType] : "";
  const aisha = ASSISTANT_PERSONAS.aisha.portraitSrc;

  return (
    <section
      aria-label={t.previewLabel}
      data-testid="home-market-preview"
      data-opacity={opacity}
      className="relative h-full w-full overflow-hidden bg-[#eef2f6] transition-opacity duration-700 ease-out"
      style={{ opacity }}
    >
      <div className="flex h-12 items-center justify-between gap-3 bg-[#046BD9] px-4 text-white sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white">
            <Image src={TALISU_MKTS_TREE_LOGO} alt="" fill sizes="28px" className="object-contain p-1" />
          </span>
          <span className="text-[15px] font-semibold">Tsplits™</span>
        </div>
        <Slot filled={Boolean(brokerage)} className="max-w-[60%] truncate text-[14px] font-medium" width="8rem" dark>
          {brokerage}
        </Slot>
      </div>

      <div className="relative h-[44%] min-h-[12rem] w-full">
        <Image src={TALISU_MKTS_MARKET_HERO} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5 text-white sm:px-8 sm:pb-7">
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-white/80">
            {t.previewMarket}: {homeMarketDisplayName(market)}
          </p>
          <h2 className="m-0 mt-1 text-[26px] font-semibold leading-tight sm:text-[34px]">
            <Slot filled={Boolean(brokerage || firstName)} width="14rem" dark>
              {brokerage || firstName}
            </Slot>
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {brokerage ? (
              <Slot filled={Boolean(firstName)} width="6rem" dark className="text-[15px] text-white/90">
                {firstName}
              </Slot>
            ) : null}
            {account ? (
              <span
                className="rounded-full bg-white/90 px-3 py-0.5 text-[12px] font-semibold text-[#046BD9]"
                data-testid="home-market-preview-account"
              >
                {account}
              </span>
            ) : (
              <Slot filled={false} width="4rem" dark />
            )}
          </div>
          <p className="m-0 mt-2 text-[14px] text-white/85">{t.previewWelcome}</p>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-3 sm:p-6">
        <Card title={t.previewHomePin}>
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 transition ${
                draft.pinPlaced ? "bg-[#1A73E8] ring-[#1A73E8]/25" : "bg-neutral-300 ring-neutral-200"
              }`}
              aria-hidden
            >
              <span className="h-3 w-3 rounded-full bg-white" />
            </span>
            <Slot filled={draft.pinPlaced} width="9rem" className="text-[14px] leading-snug text-neutral-800">
              {draft.homeAddress}
            </Slot>
          </div>
        </Card>
        <Card title={t.previewBookshelf}>
          <div className="flex items-center gap-3">
            <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md shadow-md ring-1 ring-black/10">
              <Image src={CENTREFOLD_FRONT_COVER} alt="" fill sizes="48px" className="object-cover" />
            </span>
            <span className="text-[14px] font-medium text-neutral-800">{t.previewEbook}</span>
          </div>
        </Card>
        <Card title={t.previewManager}>
          <div className="flex items-center gap-3">
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10">
              <Image src={aisha} alt="" fill sizes="48px" className="object-cover" style={{ objectPosition: "center 16%" }} />
            </span>
            <span className="text-[14px] font-medium text-neutral-800">{t.aishaName}</span>
          </div>
        </Card>
      </div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.07)] ring-1 ring-black/5">
      <p className="m-0 mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">{title}</p>
      {children}
    </div>
  );
}

/** A value once it is typed in; until then a soft bar in its place. */
function Slot({
  filled,
  children,
  width,
  dark = false,
  className = "",
}: {
  filled: boolean;
  children?: ReactNode;
  width: string;
  dark?: boolean;
  className?: string;
}) {
  if (filled) return <span className={`inline-block animate-[fadeIn_0.5s_ease-out] ${className}`}>{children}</span>;
  return (
    <span
      aria-hidden
      className={`inline-block h-[0.9em] rounded-full align-middle ${dark ? "bg-white/35" : "bg-neutral-200"} ${className}`}
      style={{ width }}
    />
  );
}
