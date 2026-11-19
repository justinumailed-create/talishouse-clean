import GuideConversationPage from "@/components/talispros/GuideConversationPage";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { dynamicPageMetadata } from "@/lib/seo/page-metadata";
import { loadAishaCallVariables } from "@/lib/talispros/aisha-owner-session";
import { ASSISTANT_PERSONAS } from "@/lib/talispros/assistant-personas";

export const dynamic = "force-dynamic";

type AishaHomePageProps = {
  searchParams?: Promise<{ call?: string }>;
};

export async function generateMetadata() {
  return dynamicPageMetadata((locale) => {
    const copy = getDictionary(locale).home.assistants.aisha;
    return {
      title: copy.panelTitle,
      description: copy.greeting,
      path: "/aisha",
      image: ASSISTANT_PERSONAS.aisha.portraitSrc,
      alt: copy.panelTitle,
      noindex: true,
    };
  });
}

/** Aisha's page: her photo on the left, the conversation filling the right. */
export default async function AishaHomePage({ searchParams }: AishaHomePageProps) {
  const query = (await searchParams) ?? {};
  const call = query.call === "1";
  const dictionary = getDictionary(await getLocale());
  const copy = dictionary.home.assistants.aisha;
  const pitch = dictionary.home.registrar;
  const dynamicVariables = await loadAishaCallVariables();

  return (
    <GuideConversationPage
      persona={ASSISTANT_PERSONAS.aisha}
      title={copy.panelTitle}
      call={call}
      recordsPitch
      dynamicVariables={dynamicVariables}
      testId="aisha-home"
      intro={
        <section
          className="border-b border-black/10 bg-white px-5 py-5 sm:px-8"
          data-testid="aisha-registrar-pitch"
        >
          <div className="mx-auto max-w-3xl">
            <h2 className="m-0 text-[20px] font-semibold leading-snug tracking-[-0.02em] text-neutral-950 sm:text-[24px]">
              {pitch.title}
            </h2>
            <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-neutral-800 sm:text-[16px]">
              <li>{pitch.floors}</li>
              <li>{pitch.buyers}</li>
              <li>{pitch.network}</li>
            </ul>
          </div>
        </section>
      }
    />
  );
}
