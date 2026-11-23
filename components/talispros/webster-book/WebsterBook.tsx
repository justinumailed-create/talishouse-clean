"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { ASSISTANT_PERSONAS } from "@/lib/talispros/assistant-personas";
import {
  WEBSTER_BOOK_LOSS_PAGE,
  WEBSTER_BOOK_PAGE_COUNT,
  WEBSTER_BOOK_PRICING_PAGE,
  WEBSTER_BOOK_TITLE,
  WEBSTER_CALL_HREF,
  websterBookPages,
} from "@/lib/talispros/webster-book";
import { HOME_MARKET_PATH } from "@/lib/talisu/home-market-path";

const PAGES = websterBookPages();
const CATALOGUE_HREF = "/catalogue";

/**
 * One page at a time, with arrows, swipe, keyboard and page thumbnails.
 * The Catalogue follows the last page (Ralf, Nov 23).
 */
export default function WebsterBook() {
  const t = useT().homeMarket;
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const last = index === WEBSTER_BOOK_PAGE_COUNT - 1;

  const go = useCallback((delta: number) => {
    setIndex((current) => Math.min(WEBSTER_BOOK_PAGE_COUNT - 1, Math.max(0, current + delta)));
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const page = PAGES[index]!;

  return (
    <main className="flex min-h-0 flex-1 flex-col" data-testid="webster-book" data-page={page.page}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href={HOME_MARKET_PATH} className="text-[13px] font-semibold text-white/80 underline-offset-2 hover:text-white hover:underline">
          ← {t.bookBack}
        </Link>
        <h1 className="m-0 order-last w-full text-center text-[15px] font-semibold tracking-wide text-white/90 sm:order-none sm:w-auto sm:text-[17px]" style={{ color: "rgba(255,255,255,0.92)" }}>
          {t.websterTitle}
        </h1>
        <Link
          href={CATALOGUE_HREF}
          data-testid="webster-book-catalogue"
          className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-[14px] font-semibold text-neutral-950 shadow-[0_6px_16px_rgba(0,0,0,0.35)] transition hover:bg-neutral-100"
        >
          {t.seeCatalogue} →
        </Link>
      </div>

      <div className="relative min-h-0 flex-1">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label={t.bookPrev}
          data-testid="webster-book-prev"
          className="absolute left-1 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-[26px] text-white ring-1 ring-white/20 transition hover:bg-white/20 disabled:opacity-25 sm:left-3 sm:flex"
        >
          ‹
        </button>
        <div
          className="absolute inset-0 flex items-center justify-center px-2 pb-2 sm:px-16"
          style={{ containerType: "size" }}
        >
        <div
          data-testid="webster-book-page"
          className="relative overflow-hidden rounded-md bg-white shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
          style={{
            aspectRatio: "792 / 612",
            width: "min(100%, calc(100cqh * 792 / 612))",
            height: "auto",
          }}
          onTouchStart={(event) => {
            touchX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const start = touchX.current;
            const end = event.changedTouches[0]?.clientX;
            touchX.current = null;
            if (start == null || end == null || Math.abs(end - start) < 40) return;
            go(end < start ? 1 : -1);
          }}
        >
          <Image
            key={page.src}
            src={page.src}
            alt={`${WEBSTER_BOOK_TITLE}, ${t.bookPageOf.replace("{page}", String(page.page)).replace("{total}", String(WEBSTER_BOOK_PAGE_COUNT))}`}
            fill
            priority={index < 2}
            sizes="(max-width: 1024px) 100vw, 1200px"
            className="object-contain"
          />
          {page.page === WEBSTER_BOOK_PRICING_PAGE ? <CallWebsterPanel /> : null}
          {page.page === WEBSTER_BOOK_LOSS_PAGE ? <IncomeLostBand /> : null}
        </div>
        </div>
        {last ? (
          <Link
            href={CATALOGUE_HREF}
            aria-label={t.seeCatalogue}
            className="absolute right-1 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[22px] text-neutral-950 shadow-lg transition hover:bg-neutral-100 sm:right-3 sm:flex"
          >
            →
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t.bookNext}
            data-testid="webster-book-next"
            className="absolute right-1 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-[26px] text-white ring-1 ring-white/20 transition hover:bg-white/20 sm:right-3 sm:flex"
          >
            ›
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 px-4 pt-1 sm:hidden">
        <button type="button" onClick={() => go(-1)} disabled={index === 0} aria-label={t.bookPrev} className="h-10 w-10 rounded-full bg-white/10 text-[22px] disabled:opacity-25">
          ‹
        </button>
        <span className="text-[13px] text-white/70">
          {t.bookPageOf.replace("{page}", String(page.page)).replace("{total}", String(WEBSTER_BOOK_PAGE_COUNT))}
        </span>
        <button type="button" onClick={() => go(1)} disabled={last} aria-label={t.bookNext} className="h-10 w-10 rounded-full bg-white/10 text-[22px] disabled:opacity-25">
          ›
        </button>
      </div>

      <nav className="flex justify-center gap-2 overflow-x-auto px-4 py-3" aria-label={WEBSTER_BOOK_TITLE}>
        {PAGES.map((item, itemIndex) => (
          <button
            key={item.src}
            type="button"
            onClick={() => setIndex(itemIndex)}
            aria-label={t.bookPageOf.replace("{page}", String(item.page)).replace("{total}", String(WEBSTER_BOOK_PAGE_COUNT))}
            aria-current={itemIndex === index ? "page" : undefined}
            className={`relative aspect-[792/612] w-14 shrink-0 overflow-hidden rounded ring-2 transition sm:w-20 ${
              itemIndex === index ? "ring-white" : "opacity-60 ring-transparent hover:opacity-100"
            }`}
          >
            <Image src={item.src} alt="" fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </nav>

      {last ? (
        <div className="px-4 pb-5 text-center">
          <Link
            href={CATALOGUE_HREF}
            data-testid="webster-book-catalogue-end"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#046BD9] px-8 text-[16px] font-semibold text-white shadow-[0_8px_20px_rgba(4,107,217,0.4)] transition hover:bg-[#0558b3]"
          >
            {t.seeCatalogue} →
          </Link>
        </div>
      ) : null}
    </main>
  );
}

/** Web version of the Pricing page: "Book a call with Webster" where the print Notes lines were. */
function CallWebsterPanel() {
  const t = useT().homeMarket;
  return (
    <div
      className="absolute inset-y-[8%] left-[54%] right-[5%] flex flex-col items-center justify-center text-center text-neutral-900"
      data-testid="webster-book-call"
    >
      <span className="relative h-[22%] min-h-12 w-auto overflow-hidden rounded-full ring-1 ring-black/10" style={{ aspectRatio: "1 / 1" }}>
        <Image
          src={ASSISTANT_PERSONAS.webster.portraitSrc}
          alt="Webster"
          fill
          sizes="160px"
          className="object-cover"
          style={{ objectPosition: "center 18%" }}
        />
      </span>
      <p className="m-0 mt-[4%] text-[clamp(13px,2.1vw,26px)] font-semibold leading-tight">{t.bookCallTitle}</p>
      <p className="m-0 mt-[3%] max-w-[90%] text-[clamp(11px,1.4vw,17px)] leading-snug text-neutral-600">{t.bookCallBody}</p>
      <Link
        href={WEBSTER_CALL_HREF}
        data-testid="webster-book-call-cta"
        className="mt-[5%] inline-flex items-center justify-center rounded-full bg-neutral-950 px-[6%] py-[2.5%] text-[clamp(11px,1.4vw,17px)] font-semibold text-white transition hover:bg-neutral-800"
      >
        {t.bookCallCta}
      </Link>
    </div>
  );
}

/** The missed-income line near the start of the book (Ralf, Nov 23). No per-market numbers. */
function IncomeLostBand() {
  const t = useT().homeMarket;
  return (
    <div
      className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-[5%] pb-[4%] pt-[12%] text-left"
      data-testid="webster-book-loss"
    >
      <p className="m-0 text-[clamp(16px,3.2vw,40px)] font-bold uppercase leading-tight tracking-tight text-white" style={{ color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>
        {t.bookLossTitle}
      </p>
      <p className="m-0 mt-[1.2%] max-w-[46em] text-[clamp(11px,1.5vw,19px)] leading-snug text-white/90" style={{ color: "rgba(255,255,255,0.92)", textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>{t.bookLossBody}</p>
    </div>
  );
}
