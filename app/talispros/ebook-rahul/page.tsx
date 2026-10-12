import EbookRahulAssistClient from "@/components/talispros/EbookRahulAssistClient";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talispros/ebook-rahul");
}

export const dynamic = "force-dynamic";

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
