import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import EbookGenerateClient from "@/components/talispros/EbookGenerateClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createMetadata({
  title: "Generate E-Book | Talispros™",
  description:
    "Generate your own TalisBooks™ E-Book from property images, title, description, and location — no payment required.",
  path: "/talispros/ebook-generate",
  private: true,
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EbookGeneratePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <EbookGenerateClient
      fastCode={firstParam(params.fastCode)?.trim() || null}
      mapsiteId={firstParam(params.mapsiteId)?.trim() || null}
      accountType={firstParam(params.accountType)?.trim() || null}
      requestId={firstParam(params.requestId)?.trim() || null}
    />
  );
}
