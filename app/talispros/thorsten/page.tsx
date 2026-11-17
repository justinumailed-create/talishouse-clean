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
    const copy = getDictionary(locale).home.assistants.thorsten;
    return {
      title: copy.title,
      description: copy.greeting,
      path: "/talispros/thorsten",
      image: ASSISTANT_PERSONAS.thorsten.portraitSrc,
      alt: copy.title,
      noindex: true,
    };
  });
}

export default async function ThorstenGuidePage({ searchParams }: GuidePageProps) {
  const query = (await searchParams) ?? {};
  const copy = getDictionary(await getLocale()).home.assistants.thorsten;
  const dynamicVariables = await guideDynamicVariables(query.code);

  return (
    <GuideConversationPage
      persona={ASSISTANT_PERSONAS.thorsten}
      title={copy.title}
      call={query.call === "1"}
      dynamicVariables={dynamicVariables}
      testId="thorsten-guide"
      imagePosition="center 20%"
    />
  );
}
