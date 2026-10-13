"use client";

import { Fragment } from "react";
import { TALISU_CARD } from "@/lib/talisu/ui";
import { useLocale } from "@/lib/i18n/client";
import { TALISU_LONG_TERM_CARE_ESSAY, type LtcBlock } from "@/lib/talisu/long-term-care-essay";

const NOTE_CLASS =
  "mt-3 rounded-xl bg-[#f3f7fc] px-3.5 py-2.5 font-medium text-neutral-800 ring-1 ring-[#046BD9]/15 print:bg-neutral-100";
const COLORS = ["#0f2f57", "#046BD9", "#38a3ff"];

function DownArrow() {
  return (
    <div aria-hidden className="flex flex-col items-center py-1 text-[#046BD9]">
      <span className="h-3 w-px bg-[#046BD9]/40" />
      <span className="text-[11px] leading-none">▼</span>
    </div>
  );
}

function Block({ block }: { block: LtcBlock }) {
  switch (block.type) {
    case "p":
      return <p className="mt-2 first:mt-0">{block.text}</p>;
    case "lead":
      return (
        <div className="mt-4">
          <p className="font-semibold text-neutral-950">{block.title}</p>
          <p className="mt-1">{block.text}</p>
        </div>
      );
    case "note":
      return <p className={NOTE_CLASS}>{block.text}</p>;
    case "bullets":
      return (
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          {block.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      );
    case "steps":
      return (
        <ol className="mt-3 list-none space-y-2.5 pl-0">
          {block.items.map((item, i) => (
            <li key={item.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#046BD9] text-[12px] font-semibold text-white">{i + 1}</span>
              <span>
                <span className="font-semibold text-neutral-900">{item.title}</span> {item.text}
              </span>
            </li>
          ))}
        </ol>
      );
    case "flow":
      return (
        <figure className="mt-4 rounded-2xl border border-[#046BD9]/20 bg-white p-4 break-inside-avoid" data-testid={block.testId}>
          {block.levels.map((level, li) => {
            const highlight = li === 1;
            return (
              <Fragment key={li}>
                {li > 0 ? <DownArrow /> : null}
                <div className={`grid gap-2 ${level.length === 2 ? "grid-cols-2" : level.length >= 3 ? "grid-cols-3" : ""}`}>
                  {level.map((n) => (
                    <div
                      key={n.title}
                      className={`rounded-xl px-3 py-2.5 text-center ${highlight ? "bg-[#046BD9] text-white" : "bg-neutral-50 ring-1 ring-black/5"}`}
                    >
                      <p className={`font-semibold ${highlight ? "" : "text-neutral-950"}`}>{n.title}</p>
                      <p className={`text-[12px] leading-snug ${highlight ? "text-white/80" : "text-neutral-500"}`}>{n.text}</p>
                    </div>
                  ))}
                </div>
              </Fragment>
            );
          })}
        </figure>
      );
    case "valuation":
      return (
        <figure className="mt-4 rounded-2xl border border-[#046BD9]/20 bg-white p-4 break-inside-avoid" data-testid="ltc-valuation">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-neutral-500">{block.label}</p>
          <p className="mt-1 text-[26px] font-semibold leading-none text-neutral-950">{block.total}</p>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full" aria-hidden>
            {block.parts.map((p, i) => (
              <span key={p.label} style={{ width: `${p.pct}%`, backgroundColor: COLORS[i] }} />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {block.parts.map((p, i) => (
              <div key={p.label} className="rounded-xl px-3 py-2.5 ring-1 ring-black/5">
                <p className="text-[18px] font-semibold leading-none" style={{ color: COLORS[i] }}>{p.value}</p>
                <p className="mt-1 text-[13px] text-neutral-700">{p.label}</p>
              </div>
            ))}
          </div>
        </figure>
      );
    case "split":
      return (
        <figure className="mt-4 rounded-2xl border border-[#046BD9]/20 bg-white p-4 break-inside-avoid" data-testid="ltc-split">
          <div className="flex h-3 overflow-hidden rounded-full" aria-hidden>
            {block.parts.map((p, i) => (
              <span key={p.label} style={{ width: `${p.pct}%`, backgroundColor: COLORS[i + 1] }} />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {block.parts.map((p, i) => (
              <div key={p.label} className="rounded-xl px-2 py-2.5 text-center ring-1 ring-black/5">
                <p className="text-[22px] font-semibold leading-none" style={{ color: COLORS[i + 1] }}>{p.pct}%</p>
                <p className="mt-1 text-[13px] font-semibold text-neutral-900">{p.label}</p>
                <p className="text-[11px] text-neutral-500">{p.text}</p>
              </div>
            ))}
          </div>
        </figure>
      );
    case "options":
      return (
        <div className="mt-3 grid gap-3" data-testid="ltc-options">
          {block.items.map((s) => (
            <div key={s.letter} className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-4 break-inside-avoid">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#046BD9] text-[16px] font-bold text-white">{s.letter}</span>
              <div className="min-w-0">
                <p className="font-semibold text-neutral-950">{s.title}</p>
                <p className="mt-1">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      );
    case "table":
      return (
        <div className="talisu-essay-table-wrap mt-4 overflow-x-auto print:overflow-visible">
          <table className="talisu-essay-table w-full min-w-[18rem] border-collapse text-left text-sm">
            <caption className="pb-2 text-left text-[12px] font-medium text-neutral-500">{block.caption}</caption>
            <thead>
              <tr className="border-b border-neutral-300 bg-neutral-50 print:bg-transparent">
                {block.headers.map((h) => (
                  <th key={h} scope="col" className="px-3 py-2.5 font-semibold text-neutral-900">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map(([a, b]) => (
                <tr key={a} className="border-b border-neutral-200 align-top">
                  <th scope="row" className="px-3 py-2.5 font-medium text-neutral-900">{a}</th>
                  <td className="px-3 py-2.5 text-neutral-700">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

/** Long-Term Care tokenization essay (EN/DE) for the /talisu FAQ right rail. */
export default function TalisULongTermCareEssay() {
  const locale = useLocale();
  const essay = TALISU_LONG_TERM_CARE_ESSAY[locale] ?? TALISU_LONG_TERM_CARE_ESSAY.en;
  return (
    <article
      id="long-term-care-essay"
      className={`talisu-tokenization-essay ${TALISU_CARD} flex h-full min-h-0 flex-col scroll-mt-24 print:h-auto print:shadow-none print:ring-0`}
      aria-labelledby="talisu-ltc-essay-heading"
    >
      <header className="border-b border-neutral-200 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#046BD9]">{essay.kicker}</p>
            <h2 id="talisu-ltc-essay-heading" className="mt-1.5 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
              {essay.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{essay.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="talisu-no-print shrink-0 inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
          >
            {essay.print}
          </button>
        </div>
        <p className="mt-3 text-xs italic text-neutral-500">{essay.disclaimer}</p>
      </header>
      <div className="talisu-essay-body mt-5 min-h-0 flex-1 space-y-7 overflow-y-auto text-sm leading-relaxed text-neutral-700 sm:text-[15px] print:overflow-visible">
        <div className="space-y-2 text-neutral-800">
          {essay.intro.map((p) => <p key={p}>{p}</p>)}
        </div>
        {essay.sections.map((section) => (
          <section key={section.id} id={section.id} className="talisu-essay-section" aria-labelledby={`essay-${section.id}-title`}>
            <h3 id={`essay-${section.id}-title`} className="mb-2 text-base font-semibold text-neutral-950 sm:text-lg break-after-avoid">
              {section.title}
            </h3>
            {section.blocks.map((block, i) => (
              <Block key={`${section.id}-${i}`} block={block} />
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
