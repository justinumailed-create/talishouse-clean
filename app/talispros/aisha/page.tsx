import Image from "next/image";
import LegalLinks from "@/components/legal/LegalLinks";
import AishaConvaiWidget from "@/components/talispros/AishaConvaiWidget";
import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";
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
  const persona = ASSISTANT_PERSONAS.aisha;

  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f1ea]" data-testid="aisha-home-page" data-call={call ? "1" : "0"}>
      <TalisUMktsHeader />
      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        <div
          className="relative h-44 shrink-0 overflow-hidden bg-[#2a2a2a] sm:h-64 lg:h-auto lg:min-h-[calc(100dvh-4.25rem)]"
          data-testid="aisha-home-photo"
        >
          <Image
            src={persona.portraitSrc}
            alt="Aisha C., AMBA"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            style={{ objectPosition: "center 18%" }}
          />
        </div>
        <div
          className="relative min-h-[70dvh] lg:min-h-[calc(100dvh-4.25rem)]"
          data-testid="aisha-home-conversation"
        >
          <AishaConvaiWidget embed="inline" autoStart={call} />
        </div>
      </main>
      <footer className="border-t border-black/10 bg-white px-4 py-4">
        <div className="flex justify-center">
          <LegalLinks />
        </div>
      </footer>
    </div>
  );
}
