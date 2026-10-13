"use client";

import { TALISU_CARD } from "@/lib/talisu/ui";
import { useLocale } from "@/lib/i18n/client";
import {
  TALISU_STUDENT_HOUSING_ESSAY,
  type StudentHousingBlock,
  type StudentHousingEssay,
} from "@/lib/talisu/student-housing-essay";

const NOTE_CLASS =
  "mt-3 rounded-xl bg-[#f3f7fc] px-3.5 py-2.5 font-medium text-neutral-800 ring-1 ring-[#046BD9]/15 print:bg-neutral-100";

const SLICE_COLORS = ["#046BD9", "#38a3ff", "#0f2f57"];

function Arrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center py-1.5 text-[12px] font-medium text-[#046BD9]">
      <span aria-hidden className="h-3 w-px bg-[#046BD9]/40" />
      <span className="rounded-full bg-[#046BD9]/10 px-2.5 py-0.5">{label}</span>
      <span aria-hidden className="leading-none">▼</span>
    </div>
  );
}

function Ownership({ essay }: { essay: StudentHousingEssay }) {
  const o = essay.ownership;
  return (
    <figure className="talisu-essay-ownership mt-4 rounded-2xl border border-[#046BD9]/20 bg-white p-4 break-inside-avoid" data-testid="student-housing-ownership">
      <div className="rounded-xl bg-neutral-50 px-4 py-3 text-center ring-1 ring-black/5">
        <p className="font-semibold text-neutral-950">{o.layers[0].title}</p>
        <p className="text-[13px] text-neutral-500">{o.layers[0].text}</p>
      </div>
      <Arrow label={o.arrows[0]} />
      <div className="rounded-xl bg-[#046BD9] px-4 py-3 text-center text-white">
        <p className="font-semibold">{o.layers[1].title}</p>
        <p className="text-[13px] text-white/80">{o.layers[1].text}</p>
      </div>
      <Arrow label={o.arrows[1]} />
      <div className="flex h-3 overflow-hidden rounded-full" aria-hidden>
        {o.slices.map((s, i) => (
          <span key={s.label} style={{ width: `${s.pct}%`, backgroundColor: SLICE_COLORS[i] }} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {o.slices.map((s, i) => (
          <div key={s.label} className="rounded-xl px-2 py-2.5 text-center ring-1 ring-black/5">
            <p className="text-[22px] font-semibold leading-none" style={{ color: SLICE_COLORS[i] }}>
              {s.pct}%
            </p>
            <p className="mt-1 text-[13px] font-semibold text-neutral-900">{s.label}</p>
            <p className="text-[11px] leading-snug text-neutral-500">{s.text}</p>
          </div>
        ))}
      </div>
      <figcaption className="mt-3 text-[12px] italic leading-relaxed text-neutral-500">{o.note}</figcaption>
    </figure>
  );
}

function Table({ caption, headers, rows }: { caption: string; headers: readonly [string, string]; rows: readonly (readonly [string, string])[] }) {
  return (
    <div className="talisu-essay-table-wrap mt-4 overflow-x-auto print:overflow-visible">
      <table className="talisu-essay-table w-full min-w-[18rem] border-collapse text-left text-sm">
        <caption className="pb-2 text-left text-[12px] font-medium text-neutral-500">{caption}</caption>
        <thead>
          <tr className="border-b border-neutral-300 bg-neutral-50 print:bg-transparent">
            {headers.map((h) => (
              <th key={h} scope="col" className="px-3 py-2.5 font-semibold text-neutral-900">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b]) => (
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

function Block({ block, essay }: { block: StudentHousingBlock; essay: StudentHousingEssay }) {
  switch (block.type) {
    case "p":
      return <p className="mt-2 first:mt-0">{block.text}</p>;
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
    case "cards":
      return (
        <div className={`mt-3 grid gap-3 ${block.items.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {block.items.map((c) => (
            <div key={c.title} className="rounded-xl border border-[#046BD9]/15 bg-white px-3.5 py-3 break-inside-avoid">
              <p className="font-semibold text-neutral-900">{c.title}</p>
              <p className="mt-1 text-neutral-600">{c.text}</p>
            </div>
          ))}
        </div>
      );
    case "ownership":
      return <Ownership essay={essay} />;
    case "structures":
      return (
        <>
          <div className="mt-3 grid gap-3" data-testid="student-housing-structures">
            {essay.structures.map((s) => (
              <div key={s.letter} className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-4 break-inside-avoid">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#046BD9] text-[16px] font-bold text-white">{s.letter}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-950">{s.title}</p>
                  <p className="mt-1">{s.text}</p>
                  <p className="mt-2 rounded-lg bg-[#f3f7fc] px-3 py-2 text-[13px] text-neutral-700">
                    <span className="font-semibold text-[#046BD9]">{essay.bestForLabel}</span> {s.bestFor}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className={NOTE_CLASS}>{essay.structuresNote}</p>
        </>
      );
    case "example":
      return (
        <>
          <Table caption={essay.example.caption} headers={essay.example.headers} rows={essay.example.rows} />
          <p className="mt-2 text-[13px] italic text-neutral-500">{essay.example.note}</p>
        </>
      );
    case "risks":
      return <Table caption={essay.risks.caption} headers={essay.risks.headers} rows={essay.risks.rows} />;
  }
}

/** Student Housing tokenization essay (EN/DE) for the /talisu FAQ right rail. */
export default function TalisUStudentHousingEssay() {
  const locale = useLocale();
  const essay = TALISU_STUDENT_HOUSING_ESSAY[locale] ?? TALISU_STUDENT_HOUSING_ESSAY.en;

  return (
    <article
      id="student-housing-essay"
      className={`talisu-tokenization-essay ${TALISU_CARD} flex h-full min-h-0 flex-col scroll-mt-24 print:h-auto print:shadow-none print:ring-0`}
      aria-labelledby="talisu-sh-essay-heading"
    >
      <header className="border-b border-neutral-200 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#046BD9]">{essay.kicker}</p>
            <h2 id="talisu-sh-essay-heading" className="mt-1.5 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
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
              <Block key={`${section.id}-${i}`} block={block} essay={essay} />
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
