import Link from "next/link";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import TsplitsRichText from "@/components/talisu/TsplitsRichText";
import type { TsplitsContent, TsplitsSection } from "@/lib/talisu/tsplits-content";
import { TALISU_DISCUSS_PATH, talisuHref } from "@/lib/talisu/talisu-links";

export async function generateMetadata() {
  return pageMetadata("/talisu/tsplits");
}

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

function Section({ section }: { section: TsplitsSection }) {
  const numbered = Boolean(section.number);
  return (
    <section
      id={section.id}
      data-testid={`tsplits-section-${section.id}`}
      className="scroll-mt-24 border-t border-neutral-200 pt-8 first:border-t-0 first:pt-0"
    >
      <h2 className="flex items-baseline gap-3 text-[22px] font-semibold leading-snug tracking-[-0.02em] text-[#0069CF] sm:text-[26px]">
        {numbered ? (
          <span className="inline-flex h-9 min-w-9 shrink-0 items-center justify-center self-center rounded-full bg-[#0069CF] px-2 text-[15px] font-bold text-white">
            {section.number}
          </span>
        ) : null}
        <span>{section.heading}</span>
      </h2>
      <div className="mt-4 space-y-4 text-[15.5px] leading-relaxed text-neutral-700 sm:text-[16px]">
        {section.before?.map((p) => (
          <p key={p}>
            <TsplitsRichText text={p} />
          </p>
        ))}
        {section.list?.length ? (
          section.bullets ? (
            <ul className="space-y-2.5 pl-1">
              {section.list.map((item) => (
                <li key={item.text} className="flex gap-3">
                  <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0069CF]" />
                  <span>
                    <TsplitsRichText text={item.text} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <ol className="space-y-3">
              {section.list.map((item, i) => (
                <li key={item.text} className="flex gap-3">
                  <span className="w-7 shrink-0 text-right font-semibold tabular-nums text-[#0069CF]">
                    {i + 1}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <TsplitsRichText text={item.text} />
                    {item.sub?.length ? (
                      <ol className="mt-3 space-y-2.5 rounded-xl bg-[#f3f8fe] p-4 sm:p-5">
                        {item.sub.map((s, j) => (
                          <li key={s} className="flex gap-3">
                            <span className="w-5 shrink-0 font-semibold text-[#0069CF]">{LETTERS[j]}.</span>
                            <span className="min-w-0 flex-1">
                              <TsplitsRichText text={s} />
                            </span>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )
        ) : null}
        {section.after?.map((p) => (
          <p key={p}>
            <TsplitsRichText text={p} />
          </p>
        ))}
        {section.callout ? (
          <p className="rounded-2xl border-l-4 border-[#0069CF] bg-[#eef5fd] px-5 py-4 font-semibold leading-relaxed text-[#06182f]">
            <TsplitsRichText text={section.callout} />
          </p>
        ) : null}
      </div>
    </section>
  );
}

function StructuresTable({ s }: { s: TsplitsContent["structures"] }) {
  return (
    <section id="structures" data-testid="tsplits-structures" className="scroll-mt-24">
      <h2 className="text-[22px] font-semibold leading-snug tracking-[-0.02em] text-[#0069CF] sm:text-[26px]">
        {s.heading}
      </h2>
      {/* md+: a real table. Phones: one card per structure. */}
      <div className="mt-5 hidden overflow-hidden rounded-2xl border border-neutral-200 md:block">
        <table className="w-full border-collapse text-left text-[15px] leading-relaxed">
          <thead className="bg-[#0069CF] text-white">
            <tr>
              <th scope="col" className="w-[19%] px-5 py-3 font-semibold">{s.columns.structure}</th>
              <th scope="col" className="w-[46%] px-5 py-3 font-semibold">{s.columns.plain}</th>
              <th scope="col" className="px-5 py-3 font-semibold">{s.columns.fits}</th>
            </tr>
          </thead>
          <tbody>
            {s.rows.map((row, i) => (
              <tr key={row.id} className={i % 2 ? "bg-[#f7fafd]" : "bg-white"}>
                <th scope="row" className="border-t border-neutral-200 px-5 py-4 align-top font-semibold text-neutral-950">
                  {row.name}
                  {row.abbr ? <span className="block font-medium text-neutral-500">{row.abbr}</span> : null}
                </th>
                <td className="border-t border-neutral-200 px-5 py-4 align-top text-neutral-700">{row.plain}</td>
                <td className="border-t border-neutral-200 px-5 py-4 align-top text-neutral-700">
                  <ul className="space-y-1.5">
                    {row.fits.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span aria-hidden className="text-[#0069CF]">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 space-y-3 md:hidden" data-testid="tsplits-structures-cards">
        {s.rows.map((row) => (
          <div key={row.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-[17px] font-semibold text-neutral-950">
              {row.name} {row.abbr ? <span className="font-medium text-neutral-500">{row.abbr}</span> : null}
            </p>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0069CF]">{s.columns.plain}</p>
            <p className="mt-1 text-[15px] leading-relaxed text-neutral-700">{row.plain}</p>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0069CF]">{s.columns.fits}</p>
            <ul className="mt-1 space-y-1.5 text-[15px] leading-relaxed text-neutral-700">
              {row.fits.map((f) => (
                <li key={f} className="flex gap-2">
                  <span aria-hidden className="text-[#0069CF]">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[13px] italic text-neutral-500">{s.footnote}</p>
    </section>
  );
}

/**
 * /talisu/tsplits — TSPLITS™ – from Vision to Implementation (Arun's
 * TSPLITS-Presentation PDF as a sales-pitch page, EN + DE). First item in
 * the TalisU dropdown. The closing CTA opens the TalisBOT "Share a Project
 * Vision" form (/talisu/discuss), same as TalisBOT's own button.
 */
export default async function TsplitsPage() {
  const c = getDictionary(await getLocale()).tsplits as TsplitsContent;
  return (
    <div data-testid="tsplits-page" className="tsplits-page bg-neutral-100">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#06182f] via-[#073a74] to-[#0069CF] text-white">
        <div className="absolute -right-32 -top-32 -z-10 h-[28rem] w-[28rem] rounded-full bg-[#2f8cff]/25 blur-3xl" />
        <div className="mx-auto max-w-5xl px-4 pb-14 pt-12 text-center sm:px-6 sm:pb-20 sm:pt-16">
          <h1 className="text-[34px] font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{c.title}</h1>
          <p className="mx-auto mt-5 max-w-3xl text-[16px] leading-relaxed text-white/90 sm:text-lg [&_strong]:font-bold [&_strong]:text-[#9fd0ff]">
            <TsplitsRichText text={c.standsFor} />
          </p>
          <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center gap-2 text-[15px] text-white/85 sm:flex-row sm:justify-center sm:gap-6 [&_strong]:text-white">
            <p>
              <TsplitsRichText text={c.whyTalisman} />
            </p>
            <span aria-hidden className="hidden h-4 w-px bg-white/40 sm:block" />
            <p>
              <TsplitsRichText text={c.whySplits} />
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-8 max-w-5xl px-3 pb-16 sm:-mt-10 sm:px-6">
        <article className="space-y-10 rounded-[28px] bg-white px-5 py-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_18px_50px_rgba(0,0,0,0.08)] sm:px-10 sm:py-12 lg:px-14">
          <section id="approach" data-testid="tsplits-approach">
            <h2 className="text-[22px] font-semibold leading-snug tracking-[-0.02em] text-[#0069CF] sm:text-[26px]">
              {c.approach.heading}
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-neutral-700 sm:text-[17px]">{c.approach.body}</p>
          </section>

          <figure
            data-testid="tsplits-quote"
            className="rounded-2xl border-l-4 border-[#0069CF] bg-[#f3f8fe] px-5 py-5 sm:px-7 sm:py-6"
          >
            <figcaption className="text-[16px] text-neutral-700 sm:text-[17px]">
              {c.quote.lead} <span className="font-semibold text-neutral-950">{c.quote.name}</span>
            </figcaption>
            <blockquote className="mt-3 text-[15.5px] italic leading-relaxed text-neutral-700 sm:text-[16px]">
              {c.quote.body}
            </blockquote>
          </figure>

          <StructuresTable s={c.structures} />

          <div className="space-y-10">
            {c.sections.map((s) => (
              <Section key={s.id} section={s} />
            ))}
          </div>
        </article>

        <section
          data-testid="tsplits-cta"
          className="mt-8 rounded-[28px] bg-[#06182f] px-6 py-10 text-center text-white shadow-[0_18px_50px_rgba(6,24,47,0.25)] sm:px-10 sm:py-12"
        >
          <h2 className="text-[24px] font-bold leading-snug tracking-tight sm:text-[30px]">{c.cta.heading}</h2>
          <Link
            href={talisuHref(TALISU_DISCUSS_PATH)}
            data-testid="tsplits-cta-button"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-[15px] font-bold text-[#06182f] shadow-xl transition hover:bg-[#e8f3ff]"
          >
            {c.cta.button} →
          </Link>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-white/80">{c.cta.body}</p>
          <p className="mt-4 text-[13px] font-medium tracking-wide text-[#9fd0ff]">{c.cta.signoff}</p>
        </section>
      </div>
    </div>
  );
}
