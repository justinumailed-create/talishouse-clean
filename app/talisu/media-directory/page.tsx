import { pageMetadata } from "@/lib/seo/page-metadata";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import PmcStepper from "@/components/talisu/pmc/PmcStepper";
import PmcFooter from "@/components/talisu/pmc/PmcFooter";
import MediaDirectoryClient from "@/components/talisu/pmc/MediaDirectoryClient";
import { PMC_PATHS, normalizeFastCodeParam, pmcHref } from "@/lib/talispros/mapsite-contract";
import { PMC_MEDIA_DIRECTORY_INTRO, PMC_SYNDICATION_NOTE } from "@/lib/talisu/pmc-pitch";

export async function generateMetadata() {
  return pageMetadata("/talisu/media-directory");
}

type Props = { searchParams?: Promise<{ fastCode?: string; agent?: string }> };

export default async function MediaDirectoryPage({ searchParams }: Props) {
  const t = getDictionary(await getLocale()).pmc;
  const params = (await searchParams) ?? {};
  const fastCode = normalizeFastCodeParam(params.fastCode);

  return (
    <div data-testid="pmc-media-directory">
      <section className="bg-gradient-to-br from-[#06182f] to-[#0069CF] text-white">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6">
          <PmcStepper current={2} labels={t.steps} fastCode={fastCode} tone="dark" />
          <p className="mt-10 text-sm font-bold uppercase tracking-[0.25em] text-[#9fd0ff]">{t.media.kicker}</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{t.media.title}</h1>
          <div className="mt-5 max-w-3xl space-y-3 text-[16px] leading-relaxed text-white/85">
            {PMC_MEDIA_DIRECTORY_INTRO.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <p className="font-semibold text-white">{PMC_SYNDICATION_NOTE}</p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <MediaDirectoryClient />
      </section>
      <PmcFooter
        labels={t}
        fastCode={fastCode}
        back={{ href: pmcHref(PMC_PATHS.talispros, { fastCode, agent: params.agent }) }}
        next={{ href: pmcHref(PMC_PATHS.contract, { fastCode, agent: params.agent }), label: t.nextContract }}
      />
    </div>
  );
}
