import type { Metadata } from "next";
import TalisBooksLibraryShell from "@/components/talisbooks/library/TalisBooksLibraryShell";
import { getPublicTalisBooksBookshelf } from "@/lib/talisbooks/library";
import { createMetadata } from "@/lib/seo";
import { buildClaimedMapSitePath } from "@/lib/talispros/mapsite-state";
import { isAllPinsFastCode } from "@/lib/talispros/allpins-mapsite-constants";
import { loadMapsiteSeoFields } from "@/lib/talispros/load-mapsite-seo-fields";
import {
  bookshelfOgMetadataImage,
  bookshelfSeoCopy,
} from "@/lib/talispros/mapsite-og-image";

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
    const copy = bookshelfSeoCopy({ isolatedAllPins: true });
    return createMetadata({
      title: copy.title,
      description: copy.description,
      path,
      image: bookshelfOgMetadataImage(copy.title),
    });
  }

  const fields = await loadMapsiteSeoFields(fastCode);
  const place =
    fields?.propertyTitle?.trim() || fields?.propertyAddress?.trim() || null;
  const copy = bookshelfSeoCopy({ fastCode: code, place });
  return createMetadata({
    title: copy.title,
    description: copy.description,
    path,
    image: bookshelfOgMetadataImage(copy.title),
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
