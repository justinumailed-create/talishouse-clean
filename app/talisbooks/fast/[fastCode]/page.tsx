import type { Metadata } from "next";
import Link from "next/link";
import TalisBooksLibraryShell from "@/components/talisbooks/library/TalisBooksLibraryShell";
import {
  getPublicTalisBooksBookshelf,
  getTalisBooksBookshelf,
} from "@/lib/talisbooks/library";
import { createMetadata } from "@/lib/seo";
import { buildClaimedMapSitePath } from "@/lib/talispros/mapsite-state";
import { isAllPinsFastCode } from "@/lib/talispros/allpins-mapsite-constants";
import { loadMapsiteSeoFields } from "@/lib/talispros/load-mapsite-seo-fields";
import {
  bookshelfOgMetadataImage,
  bookshelfSeoCopy,
} from "@/lib/talispros/mapsite-og-image";
import { canEditMapSite } from "@/lib/mapsite-edit-auth";

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
  const code = fastCode.trim();
  // Same owner/admin gate as Mapsite edit + library ebook actions — no parallel auth.
  const canManageEbook = code ? await canEditMapSite(code) : false;

  const bookshelf = canManageEbook
    ? await getTalisBooksBookshelf({ fastCode: code || null })
    : await getPublicTalisBooksBookshelf({
        fastCode: code || null,
      });

  const manageHref = code
    ? `/talispros/mapsites/${encodeURIComponent(code.toLowerCase())}/edit#ebook-editor`
    : null;
  const primarySlug = bookshelf.primaryEbook?.slug?.trim() || null;
  const editViewerHref = primarySlug
    ? `/talisbooks/viewer/${encodeURIComponent(primarySlug)}`
    : null;

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
      headerExtra={
        canManageEbook ? (
          <div className="flex flex-wrap items-center gap-2">
            {editViewerHref ? (
              <Link
                href={editViewerHref}
                className="inline-flex flex-shrink-0 items-center justify-center rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800"
              >
                Edit book
              </Link>
            ) : null}
            {manageHref ? (
              <Link
                href={manageHref}
                className="inline-flex flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50"
              >
                Manage ebook
              </Link>
            ) : null}
          </div>
        ) : null
      }
    />
  );
}
