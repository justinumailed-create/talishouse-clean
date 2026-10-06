import type { ReactNode } from "react";
import TalisUChrome from "@/components/talisu/TalisUChrome";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata() {
  const locale = await getLocale();
  const m = getDictionary(locale).meta.talisuLayout;
  return createTalisUMetadata({
    title: m.title,
    description: m.description,
    path: "/talisu",
    locale,
  });
}

export default function TalisULayout({ children }: { children: ReactNode }) {
  return <TalisUChrome>{children}</TalisUChrome>;
}
