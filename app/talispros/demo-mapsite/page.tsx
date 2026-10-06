import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import DemoMapSiteBuilderClient from "@/components/talispros/demo-mapsite/DemoMapSiteBuilderClient";
import { DEMO_MAPSITE_BUILD_PATH } from "@/lib/talispros/demo-mapsite";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = getDictionary(locale).meta.demoMapsite;
  return createMetadata({
    title: m.title,
    description: m.description,
    path: DEMO_MAPSITE_BUILD_PATH,
    locale,
  });
}

export default function DemoMapSiteBuilderPage() {
  return <DemoMapSiteBuilderClient />;
}
