import Image from "next/image";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import PmcStepper from "@/components/talisu/pmc/PmcStepper";
import PmcFooter from "@/components/talisu/pmc/PmcFooter";
import IframeLink from "@/components/talisu/pmc/IframeLink";
import {
  PMC_PATHS,
  TALISWEBS_US_URL,
  normalizeFastCodeParam,
  pmcHref,
} from "@/lib/talispros/mapsite-contract";
import {
  PMC_ADJACENT,
  PMC_LAYERS,
  PMC_MEDIA_DIRECTORY_INTRO,
  PMC_MONEY,
  PMC_REASONS,
  PMC_VALUE_PROPOSITION,
  PMC_WHAT_WE_DO,
  PMC_WINDSWEPT,
} from "@/lib/talisu/pmc-pitch";
import { PMC_MEDIA_DIRECTORY, flagEmoji } from "@/lib/talisu/pmc-media-directory";

export async function generateMetadata() {
  return pageMetadata("/talisu/talispros");
}

type Props = { searchParams?: Promise<{ fastCode?: string; agent?: string }> };

export default async function TalisprosPitchPage({ searchParams }: Props) {
  const t = getDictionary(await getLocale()).pmc;
  const params = (await searchParams) ?? {};
  const fastCode = normalizeFastCodeParam(params.fastCode);
  const nextHref = pmcHref(PMC_PATHS.mediaDirectory, { fastCode, agent: params.agent });
  const countries = new Set(PMC_MEDIA_DIRECTORY.map((m) => m.location)).size;
  const flags = Array.from(new Set(PMC_MEDIA_DIRECTORY.map((m) => flagEmoji(m.iso))));

  return (
    <div data-testid="pmc-talispros" className="pmc-page bg-white">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-[#06182f] text-white">
        <Image
          src="/talisu/pmc/windswept.jpg"
          alt="The Windswept tree on a granite shore"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-[60%_40%] opacity-45 grayscale"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#06182f] via-[#06182f]/85 to-[#0069CF]/40" />
        <div className="absolute -right-40 -top-40 -z-10 h-[32rem] w-[32rem] rounded-full bg-[#2f8cff]/25 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-10">
          <PmcStepper current={1} labels={t.steps} fastCode={fastCode} tone="dark" />
          <div className="mt-10 flex flex-wrap items-center gap-2 text-[12px] font-semibold sm:mt-14">
            <span className="rounded-full bg-white px-3 py-1 text-[#06182f]">🇨🇦 {t.regionCanada} · Talispros</span>
            <IframeLink
              url={TALISWEBS_US_URL}
              title="Taliswebs (United States)"
              className="rounded-full border border-white/30 px-3 py-1 text-white/80 hover:bg-white/10"
            >
              🇺🇸 {t.regionUs} · Taliswebs ↗
            </IframeLink>
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-[#7cc0ff]">{t.pitch.kicker}</p>
          <h1 className="mt-3 text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
            <span className="bg-gradient-to-r from-[#7cc0ff] via-[#3d9bff] to-[#0069CF] bg-clip-text text-transparent">
              TALISPROS
            </span>
            <br />
            PMC
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl">{t.pitch.heroLead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={nextHref}
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-[#06182f] shadow-xl transition hover:bg-[#e8f3ff]"
            >
              {t.pitch.ctaPrimary} →
            </Link>
            <a
              href="#value"
              className="rounded-full border border-white/35 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              {t.pitch.ctaSecondary}
            </a>
          </div>
          <dl className="mt-14 grid max-w-3xl grid-cols-3 gap-3 sm:gap-6">
            {[
              [String(PMC_MEDIA_DIRECTORY.length), t.pitch.statOutlets],
              [String(countries), t.pitch.statCountries],
              ["10", t.pitch.statCycle],
            ].map(([n, label]) => (
              <div key={label} className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur">
                <dt className="text-3xl font-black sm:text-4xl">{n}</dt>
                <dd className="mt-1 text-[12px] font-medium uppercase tracking-wide text-white/65 sm:text-[13px]">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Windswept ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-[#06182f]">{PMC_WINDSWEPT.title}</h2>
            <p className="mt-4 text-lg leading-relaxed text-neutral-700">{PMC_WINDSWEPT.text}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {PMC_WINDSWEPT.motto.map((word, i) => (
                <span
                  key={word}
                  className="rounded-full bg-gradient-to-r from-[#0069CF] to-[#3d9bff] px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-white"
                  style={{ opacity: 1 - i * 0.12 }}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-black/5">
            <Image src="/talisu/pmc/windswept.jpg" alt="" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* ── Value proposition ────────────────────────────────── */}
      <section id="value" className="scroll-mt-20 bg-gradient-to-b from-[#f2f7fd] to-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-[#0069CF]">{t.pitch.valueTitle}</h2>
          <p className="mt-5 text-2xl font-semibold leading-snug text-[#06182f] sm:text-3xl">{PMC_VALUE_PROPOSITION[0]}</p>
          <p className="mt-6 border-l-4 border-[#0069CF] pl-5 text-lg italic text-neutral-700">{PMC_VALUE_PROPOSITION[1]}</p>
        </div>
      </section>

      {/* ── 1. Strategic fit: three layers ───────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading n={1} title={t.pitch.fitTitle} lead={t.pitch.fitLead} />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {PMC_LAYERS.map((layer, i) => {
            const hero = i === 2;
            return (
              <article
                key={layer.layer}
                className={`relative flex flex-col rounded-3xl p-7 ${
                  hero
                    ? "bg-gradient-to-br from-[#0069CF] to-[#06182f] text-white shadow-2xl shadow-[#0069CF]/30 lg:-translate-y-3"
                    : "border border-black/10 bg-white text-neutral-800"
                }`}
              >
                <span className={`text-xs font-bold uppercase tracking-[0.2em] ${hero ? "text-[#9fd0ff]" : "text-[#0069CF]"}`}>
                  {layer.layer}
                </span>
                <h3 className="mt-2 text-2xl font-black">{layer.name}</h3>
                <p className={`mt-2 font-semibold ${hero ? "text-white" : "text-neutral-900"}`}>{layer.tagline}</p>
                <p className={`mt-3 text-[15px] leading-relaxed ${hero ? "text-white/85" : "text-neutral-600"}`}>{layer.text}</p>
                {layer.bullets ? (
                  <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-white/90">
                    {layer.bullets.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#7cc0ff]" />
                        {b}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      {/* ── 2. Seven reasons ─────────────────────────────────── */}
      <section className="bg-[#06182f] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading n={2} title={t.pitch.reasonsTitle} dark />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {PMC_REASONS.map((reason, i) => (
              <article
                key={reason.title}
                className={`group flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-7 transition hover:border-[#3d9bff]/60 hover:bg-white/[0.07] ${
                  i === PMC_REASONS.length - 1 ? "md:col-span-2" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-5xl font-black leading-none text-[#3d9bff]/80">{i + 1}</span>
                  <h3 className="pt-1 text-xl font-bold leading-snug">{reason.title}</h3>
                </div>
                <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-white/75">
                  {reason.body.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                  {reason.bullets ? (
                    <ul className="space-y-2">
                      {reason.bullets.map((b) => (
                        <li key={b} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7cc0ff]" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <p className="mt-auto pt-5">
                  <span className="block rounded-2xl bg-[#0069CF]/25 p-4 text-[14px] leading-relaxed text-white">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.2em] text-[#9fd0ff]">
                      {t.pitch.benefitLabel}
                    </span>
                    {reason.benefit}
                  </span>
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Additional ways to make money ─────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading n={3} title={t.pitch.moneyTitle} lead={PMC_MONEY.intro} />
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PMC_MONEY.items.map((item, i) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-2xl border border-black/10 bg-gradient-to-br from-white to-[#f2f7fd] p-4 text-[15px] font-medium text-neutral-800"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#0069CF] text-[12px] font-bold text-white">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm italic text-neutral-500">{PMC_MONEY.note}</p>
      </section>

      {/* ── 4. Industry adjacent ─────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#0069CF] to-[#06182f] text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1.3fr]">
          <div>
            <span className="text-6xl font-black text-white/30">4</span>
            <h2 className="mt-2 text-3xl font-black leading-tight">{PMC_ADJACENT.title}</h2>
          </div>
          <div className="space-y-4 text-[16px] leading-relaxed text-white/85">
            {PMC_ADJACENT.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. What we do for you ────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading n={5} title={t.pitch.weDoTitle} lead={PMC_WHAT_WE_DO.intro} />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {PMC_WHAT_WE_DO.promises.map((p) => (
            <div key={p.title} className="rounded-3xl border-2 border-[#0069CF]/20 bg-[#f2f7fd] p-8">
              <p className="text-3xl font-black text-[#0069CF]">{p.title}</p>
              <p className="mt-3 text-lg text-neutral-700">{p.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-lg leading-relaxed text-neutral-700">{PMC_WHAT_WE_DO.plus}</p>
      </section>

      {/* ── 6. Media directory teaser ────────────────────────── */}
      <section className="relative overflow-hidden bg-[#06182f] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading n={6} title={t.pitch.mediaTitle} dark />
          <div className="mt-6 max-w-3xl space-y-3 text-[16px] leading-relaxed text-white/80">
            {PMC_MEDIA_DIRECTORY_INTRO.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-2 text-3xl" aria-hidden>
            {flags.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
          <Link
            href={nextHref}
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-bold text-[#06182f] shadow-xl hover:bg-[#e8f3ff]"
          >
            {t.pitch.mediaCta} →
          </Link>
        </div>
      </section>

      <div className="bg-neutral-50 pt-8">
        <PmcFooter
          labels={t}
          fastCode={fastCode}
          next={{ href: nextHref, label: t.nextMedia }}
        />
      </div>
    </div>
  );
}

function SectionHeading({
  n,
  title,
  lead,
  dark = false,
}: {
  n: number;
  title: string;
  lead?: string;
  dark?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      <p className={`text-sm font-bold uppercase tracking-[0.25em] ${dark ? "text-[#7cc0ff]" : "text-[#0069CF]"}`}>
        {String(n).padStart(2, "0")}
      </p>
      <h2 className={`mt-2 text-3xl font-black tracking-tight sm:text-4xl ${dark ? "text-white" : "text-[#06182f]"}`}>
        {title}
      </h2>
      {lead ? <p className={`mt-4 text-lg leading-relaxed ${dark ? "text-white/75" : "text-neutral-600"}`}>{lead}</p> : null}
    </div>
  );
}
