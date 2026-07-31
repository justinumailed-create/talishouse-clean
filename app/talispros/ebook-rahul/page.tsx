import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import EbookRahulAssistClient from "@/components/talispros/EbookRahulAssistClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createMetadata({
  title: "Rahul Assisted E-Book | Talispros™",
  description:
    "Upload agent photo, logo, property images, and details so Rahul can build your TalisBooks™ E-Book from Marketing Admin.",
  path: "/talispros/ebook-rahul",
  private: true,
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EbookRahulAssistPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <EbookRahulAssistClient
      fastCode={firstParam(params.fastCode)?.trim() || null}
      mapsiteId={firstParam(params.mapsiteId)?.trim() || null}
      accountType={firstParam(params.accountType)?.trim() || null}
      requestId={firstParam(params.requestId)?.trim() || null}
    />
  );
}
