import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import PmcFooter from "@/components/talisu/pmc/PmcFooter";
import LegalDocument from "@/components/talisu/pmc/LegalDocument";
import type { LegalSection } from "@/lib/talisu/pmc-legal";

export default async function LegalPage({
  testId,
  kicker,
  title,
  meta,
  intro,
  sections,
  fastCode,
}: {
  testId: string;
  kicker: string;
  title: string;
  meta: string[];
  intro?: string;
  sections: LegalSection[];
  fastCode: string | null;
}) {
  const t = getDictionary(await getLocale()).pmc;
  return (
    <div data-testid={testId}>
      <section className="bg-gradient-to-br from-[#06182f] to-[#0069CF] text-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#9fd0ff]">{kicker}</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-white/80">
            {meta.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <nav className="mb-8 flex flex-wrap gap-2 text-[13px]">
          {sections.map((s) => (
            <a key={s.n} href={`#section-${s.n}`} className="rounded-full bg-white px-3 py-1 font-medium text-neutral-600 ring-1 ring-black/10 hover:text-[#0069CF]">
              {s.n}. {s.title}
            </a>
          ))}
        </nav>
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-10">
          <LegalDocument sections={sections} intro={intro} />
        </div>
      </section>
      <PmcFooter labels={t} fastCode={fastCode} />
    </div>
  );
}
