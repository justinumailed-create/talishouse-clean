import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TalisBooksViewerShell from "@/components/talisbooks/viewer/TalisBooksViewerShell";
import { resolveViewerBookBySlug } from "@/lib/talisbooks/viewer/load-book";
import { PINNED_TALISBOOK_SLUG } from "@/lib/talisbooks/library/pinned-catalog";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";
import { talisbooksViewerShareOgPath } from "@/lib/share/og-card";
import {
  mapsiteOgMetadataImage,
  resolveViewerShareCoverUrl,
  toAbsoluteHttpsOgUrl,
  viewerRealtimeSeoCopy,
} from "@/lib/talispros/mapsite-og-image";
import { createMetadata } from "@/lib/seo";

interface TalisBooksViewerSlugPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: TalisBooksViewerSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const normalized = slug.trim();
  const book = await resolveViewerBookBySlug(normalized);

  if (!book) {
    if (normalized === PINNED_TALISBOOK_SLUG) {
      return createMetadata({
        title: "Explore Talisbooks™",
        description:
          "Explore Talisbooks™ — open the sample lookbook. Mapsite™ pins your place on the map so buyers and partners can find your story.",
        path: `${TALISBOOKS_ROUTES.VIEWER}/${PINNED_TALISBOOK_SLUG}`,
        image: mapsiteOgMetadataImage(
          toAbsoluteHttpsOgUrl(
            talisbooksViewerShareOgPath(PINNED_TALISBOOK_SLUG),
          ),
          "Explore Talisbooks™",
        ),
      });
    }
    return createMetadata({
      title: "Talisbooks™ Viewer",
      description: "Read a Talisbook™ digital lookbook.",
      path: `${TALISBOOKS_ROUTES.VIEWER}/${normalized}`,
      private: true,
      image: false,
    });
  }

  const coverPage = book.pages.find(
    (page) =>
      page.pageRole === "cover" ||
      page.layout === "cover" ||
      page.pageNumber === 1,
  );
  const coverUrl = resolveViewerShareCoverUrl({
    frontCoverImageUrl: book.frontCoverImageUrl,
    coverPageHeroImageUrl: coverPage?.heroImageUrl,
  });
  const address =
    book.pages.find((page) => page.address?.trim())?.address?.trim() || null;
  const copy = viewerRealtimeSeoCopy({
    title: book.title,
    subtitle: book.subtitle,
    description: book.description,
    address,
    fastCode: book.fastCode,
  });
  // Prefer the front cover for og:image. Keep the parting-shot OG route as a
  // fallback only when no cover art is available.
  const image = coverUrl
    ? mapsiteOgMetadataImage(coverUrl, book.title)
    : mapsiteOgMetadataImage(
        toAbsoluteHttpsOgUrl(talisbooksViewerShareOgPath(book.slug)),
        copy.title,
      );

  return createMetadata({
    title: book.title || copy.title,
    description: copy.description,
    path: `${TALISBOOKS_ROUTES.VIEWER}/${book.slug}`,
    image,
  });
}

export default async function TalisBooksViewerSlugPage({
  params,
}: TalisBooksViewerSlugPageProps) {
  const { slug } = await params;
  const book = await resolveViewerBookBySlug(slug);

  if (!book) {
    notFound();
  }

  return <TalisBooksViewerShell book={book} />;
}
