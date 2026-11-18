import GuideConversationPage from "@/components/talispros/GuideConversationPage";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { dynamicPageMetadata } from "@/lib/seo/page-metadata";
import { ASSISTANT_PERSONAS } from "@/lib/talispros/assistant-personas";
import { guideDynamicVariables } from "@/lib/talispros/guide-mapsite";

export const dynamic = "force-dynamic";

type GuidePageProps = {
  searchParams?: Promise<{ call?: string; code?: string }>;
};

export async function generateMetadata() {
  return dynamicPageMetadata((locale) => {
    const copy = getDictionary(locale).home.assistants.webster;
    return {
      title: copy.title,
      description: copy.greeting,
      path: "/webster",
      image: ASSISTANT_PERSONAS.webster.portraitSrc,
      alt: copy.title,
      noindex: true,
    };
  });
}

export default async function WebsterGuidePage({ searchParams }: GuidePageProps) {
  const query = (await searchParams) ?? {};
  const copy = getDictionary(await getLocale()).home.assistants.webster;
  const dynamicVariables = await guideDynamicVariables(query.code);

  return (
    <GuideConversationPage
      persona={ASSISTANT_PERSONAS.webster}
      title={copy.panelTitle}
      call={query.call === "1"}
      recordsPitch
      dynamicVariables={dynamicVariables}
      testId="webster-guide"
      imagePosition="center 18%"
    />
  );
}
