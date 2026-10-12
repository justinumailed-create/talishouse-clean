import EbookChoiceClient from "@/components/talispros/EbookChoiceClient";
import { establishOwnerMapSiteSession } from "@/app/talispros/build-mapsite/success-actions";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talispros/ebook-choice");
}

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isTruthyParam(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "y"
  );
}

/**
 * SimpleTexting YES lands here — E-Book decision only.
 * Not registration. No payment.
 */
export default async function EbookChoicePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const fastCode = firstParam(params.fastCode)?.trim() || null;
  const mapsiteId = firstParam(params.mapsiteId)?.trim() || null;
  const accountType = firstParam(params.accountType)?.trim() || null;
  const requestId = firstParam(params.requestId)?.trim() || null;
  const fromYes = isTruthyParam(firstParam(params.yes));

  // YES handoff: mark this browser as the Mapsite owner when a code is present.
  if (fromYes && fastCode) {
    await establishOwnerMapSiteSession(fastCode);
  }

  return (
    <EbookChoiceClient
      fastCode={fastCode}
      mapsiteId={mapsiteId}
      accountType={accountType}
      requestId={requestId}
    />
  );
}
