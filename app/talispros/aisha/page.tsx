import GuideConversationPage from "@/components/talispros/GuideConversationPage";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { dynamicPageMetadata } from "@/lib/seo/page-metadata";
import { ASSISTANT_PERSONAS } from "@/lib/talispros/assistant-personas";

export const dynamic = "force-dynamic";

type AishaHomePageProps = {
  searchParams?: Promise<{ call?: string }>;
};

export async function generateMetadata() {
  return dynamicPageMetadata((locale) => {
    const line = getDictionary(locale).home.assistants.aisha.greeting;
    return {
      title: "Aisha C., AMBA",
      description: line,
      path: "/talispros/aisha",
      image: ASSISTANT_PERSONAS.aisha.portraitSrc,
      alt: "Aisha C., AMBA",
    };
  });
}

/** Aisha's page: her photo on the left, the conversation filling the right. */
export default async function AishaHomePage({ searchParams }: AishaHomePageProps) {
  const query = (await searchParams) ?? {};
  const call = query.call === "1";

  return (
    <GuideConversationPage
      persona={ASSISTANT_PERSONAS.aisha}
      title="Aisha C., AMBA"
      call={call}
      testId="aisha-home"
    />
  );
}
