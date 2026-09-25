import type { Metadata } from "next";
import TalisBooksLibraryShell from "@/components/talisbooks/library/TalisBooksLibraryShell";
import { getPublicTalisBooksBookshelf } from "@/lib/talisbooks/library";
import { TALISBOOKS_PRODUCT_NAME } from "@/lib/talisbooks/constants";
import { createMetadata } from "@/lib/seo";
import { buildClaimedMapSitePath } from "@/lib/talispros/mapsite-state";
import { isAllPinsFastCode } from "@/lib/talispros/allpins-mapsite-constants";
import { loadMapsiteSeoFields } from "@/lib/talispros/load-mapsite-seo-fields";

export const dynamic = "force-dynamic";

interface FastCodeBookshelfPageProps {
  params: Promise<{
    fastCode: string;
  }>;
}

export async function generateMetadata({
  params,
}: FastCodeBookshelfPageProps): Promise<Metadata> {
  const { fastCode } = await params;
  const code = fastCode.trim().toUpperCase();
  const path = `/talisbooks/fast/${fastCode.trim().toLowerCase()}`;

  if (isAllPinsFastCode(fastCode)) {
    return createMetadata({
      title: `ALLPINS ${TALISBOOKS_PRODUCT_NAME} · Bookshelf`,
      description:
        "Mapsite™-connected Talisbooks™ bookshelf for FAST Code ALLPINS. Open a cover to read books on the isolated shelf.",
      path,
      image: false,
    });
  }

  const fields = await loadMapsiteSeoFields(fastCode);
  const place = fields?.propertyTitle?.trim() || fields?.propertyAddress?.trim();
  const title = place
    ? `${TALISBOOKS_PRODUCT_NAME} · ${place}`
    : `${TALISBOOKS_PRODUCT_NAME} · ${code}`;
  const description = place
    ? `Talisbooks™ bookshelf for ${place} (FAST Code ${code}). Open a cover to read books connected to this Mapsite™ only.`
    : `Talisbooks™ bookshelf for FAST Code ${code}. Open a cover to read books connected to this Mapsite™ only.`;
  return createMetadata({
    title,
    description,
    path,
    image: false,
  });
}

export default async function FastCodeBookshelfPage({
  params,
}: FastCodeBookshelfPageProps) {
  const { fastCode } = await params;
  const bookshelf = await getPublicTalisBooksBookshelf({
    fastCode: fastCode.trim() || null,
  });
  return (
    <TalisBooksLibraryShell
      bookshelf={bookshelf}
      backHref={
        bookshelf.registrationHref ||
        buildClaimedMapSitePath({
          fastCode,
          accountType: bookshelf.accountType,
        })
      }
    />
  );
}
