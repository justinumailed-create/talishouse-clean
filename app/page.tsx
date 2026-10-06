import type { Metadata } from "next";
import { Suspense } from "react";
import TalisprosGatePage from "@/components/talispros/TalisprosGatePage";
import { createMetadata } from "@/lib/seo";
import { toAbsoluteHttpsOgUrl } from "@/lib/talispros/mapsite-og-image";
import { SAMCART_SUCCESS_RETURN_PATH } from "@/lib/talispros/samcart-return";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const { title: homeTitle, description: homeDescription } =
    getDictionary(locale).meta.home;
  return createMetadata({
    title: homeTitle,
    description: homeDescription,
    path: SAMCART_SUCCESS_RETURN_PATH,
    locale,
    image: {
      url: toAbsoluteHttpsOgUrl("/assets/start-og.png?v=5"),
      width: 1200,
      height: 630,
      alt: homeTitle,
    },
  });
}

export default function Home() {
  return (
    <div className="min-h-dvh lg:h-full lg:min-h-0">
      <Suspense fallback={null}>
        <TalisprosGatePage />
      </Suspense>
    </div>
  );
}
