import { getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import TalisBooksLibraryShell from "@/components/talisbooks/library/TalisBooksLibraryShell";
import {
  getPublicTalisBooksBookshelf,
  getTalisBooksBookshelf,
} from "@/lib/talisbooks/library";
import { createMetadata } from "@/lib/seo";
import { personalHomePath } from "@/lib/talispros/personal-home";
import { isAllPinsFastCode } from "@/lib/talispros/allpins-mapsite-constants";
import { loadMapsiteSeoFields } from "@/lib/talispros/load-mapsite-seo-fields";
import {
  bookshelfOgMetadataImage,
  bookshelfSeoCopy,
} from "@/lib/talispros/mapsite-og-image";
import { canManageMapSiteEbooks } from "@/lib/mapsite-edit-auth";
import { hasCompletedMapSiteActivationPayment } from "@/lib/talispros/mapsite-payment";
import BookshelfUnregisteredNotice from "@/components/talisbooks/library/BookshelfUnregisteredNotice";

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
      locale: await getLocale(),
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
      locale: await getLocale(),
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
  // Owner tools need a registered (activation-paid) FAST Code — canManageMapSiteEbooks
  // already requires payment for owners; admins/agents keep their access.
  const canManageEbook = code ? await canManageMapSiteEbooks(code) : false;
  // Registration = the same completed activation payment the Mapsite gate uses.
  // ALLPINS is the platform shelf and never shows a Register CTA here.
  const registered =
    canManageEbook || !code || isAllPinsFastCode(code)
      ? true
      : await hasCompletedMapSiteActivationPayment({ fastCode: code });

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
        bookshelf.registrationHref || personalHomePath(fastCode)
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
        ) : !registered ? (
          <BookshelfUnregisteredNotice />
        ) : null
      }
    />
  );
}
