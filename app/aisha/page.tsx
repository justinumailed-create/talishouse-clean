import GuideConversationPage from "@/components/talispros/GuideConversationPage";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { dynamicPageMetadata } from "@/lib/seo/page-metadata";
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
  const copy = getDictionary(await getLocale()).home.assistants.aisha;

  return (
    <GuideConversationPage
      persona={ASSISTANT_PERSONAS.aisha}
      title={copy.panelTitle}
      call={call}
      testId="aisha-home"
    />
  );
}
