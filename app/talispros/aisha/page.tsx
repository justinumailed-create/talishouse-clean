import AdviserLayout from "@/components/talisu/AdviserLayout";
import LegalLinks from "@/components/legal/LegalLinks";
import AishaConvaiWidget from "@/components/talispros/AishaConvaiWidget";
import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { dynamicPageMetadata } from "@/lib/seo/page-metadata";
import { ASSISTANT_PERSONAS } from "@/lib/talispros/assistant-personas";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return dynamicPageMetadata((locale) => {
    const line = getDictionary(locale).home.assistants.aisha.greeting;
    return {
      title: "Aisha",
      description: line,
      path: "/talispros/aisha",
      image: ASSISTANT_PERSONAS.aisha.portraitSrc,
      alt: "Aisha",
    };
  });
}

/** Aisha's own page: her photo on the left, the homepage bot on the right. */
export default async function AishaHomePage() {
  const copy = getDictionary(await getLocale()).home.assistants.aisha;
  const persona = ASSISTANT_PERSONAS.aisha;

  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f1ea]" data-testid="aisha-home-page">
      <TalisUMktsHeader />
      <main className="flex-1">
        <AdviserLayout
          testId="aisha-home"
          imageSrc={persona.portraitSrc}
          imageAlt="Aisha"
          imagePosition="center 18%"
          kicker="Aisha C., AMBA"
          title="Aisha"
        >
          <div
            className="mt-4 max-w-[42ch] text-[16px] leading-relaxed text-neutral-800 sm:mt-5 sm:text-[18px]"
            data-testid="aisha-home-greeting"
          >
            {copy.greeting}
          </div>
        </AdviserLayout>
      </main>
      <footer className="border-t border-black/10 bg-white px-4 py-4">
        <div className="flex justify-center">
          <LegalLinks />
        </div>
      </footer>
      <AishaConvaiWidget placement="bottom-right" />
    </div>
  );
}
