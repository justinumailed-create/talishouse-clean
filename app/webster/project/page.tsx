import GuideConversationPage from "@/components/talispros/GuideConversationPage";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { dynamicPageMetadata } from "@/lib/seo/page-metadata";
import { ASSISTANT_PERSONAS } from "@/lib/talispros/assistant-personas";
import { guideDynamicVariables } from "@/lib/talispros/guide-mapsite";
import { WEBSTER_PROJECT_AGENT_ID } from "@/lib/talispros/webster-project";

export const dynamic = "force-dynamic";

type ProjectPageProps = {
  searchParams?: Promise<{ call?: string; code?: string }>;
};

export async function generateMetadata() {
  return dynamicPageMetadata((locale) => {
    const copy = getDictionary(locale).home.assistants.webster;
    return {
      title: copy.panelTitle,
      description: getDictionary(locale).home.conversation.describeProject,
      path: "/webster/project",
      image: ASSISTANT_PERSONAS.webster.portraitSrc,
      alt: copy.panelTitle,
      noindex: true,
    };
  });
}

/** Webster TWO. Same photo and conversation layout, a different agent. */
export default async function WebsterProjectPage({ searchParams }: ProjectPageProps) {
  const query = (await searchParams) ?? {};
  const copy = getDictionary(await getLocale()).home.assistants.webster;
  const dynamicVariables = await guideDynamicVariables(query.code);

  return (
    <GuideConversationPage
      persona={ASSISTANT_PERSONAS.webster}
      agentId={WEBSTER_PROJECT_AGENT_ID}
      title={copy.panelTitle}
      call={query.call === "1"}
      dynamicVariables={dynamicVariables}
      testId="webster-project"
      imagePosition="center 18%"
    />
  );
}
