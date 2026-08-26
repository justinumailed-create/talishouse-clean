import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TalisBooksViewerShell from "@/components/talisbooks/viewer/TalisBooksViewerShell";
import { resolveViewerBookBySlug } from "@/lib/talisbooks/viewer/load-book";
import { getMapSiteEditToolbarState } from "@/lib/mapsite-edit-auth";
import { isMarketingManagerAuthenticated } from "@/lib/marketing-manager-auth";
import { hasCompletedMapSitePaypalPayment } from "@/lib/talispros/mapsite-payment";
import { PINNED_TALISBOOK_SLUG } from "@/lib/talisbooks/library/pinned-catalog";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";
import { createMetadata } from "@/lib/seo";

interface TalisBooksViewerSlugPageProps {
  params: Promise<{ slug: string }>;
}

const SAMPLE_OG_IMAGE = "/talisbooks/pinned/og-explore-talisbooks.jpg";
const SAMPLE_OG_DESCRIPTION =
  "Explore Talisbooks™ — open the sample lookbook. Mapsite™ pins your place on the map so buyers and partners can find your story.";

export async function generateMetadata({
  params,
}: TalisBooksViewerSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const normalized = slug.trim();

  if (normalized === PINNED_TALISBOOK_SLUG) {
    return createMetadata({
      title: "Explore Talisbooks™",
      description: SAMPLE_OG_DESCRIPTION,
      path: `${TALISBOOKS_ROUTES.VIEWER}/${PINNED_TALISBOOK_SLUG}`,
      image: {
        url: SAMPLE_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Explore Talisbooks™ — sample lookbook with Mapsite™",
      },
    });
  }

  const book = await resolveViewerBookBySlug(normalized);
  if (!book) {
    return createMetadata({
      title: "Talisbooks™ Viewer",
      description: "Read a Talisbook™ digital lookbook.",
      path: `${TALISBOOKS_ROUTES.VIEWER}/${normalized}`,
      private: true,
    });
  }

  return createMetadata({
    title: book.title,
    description:
      book.subtitle?.trim() ||
      "Read this Talisbook™ digital lookbook in the Talisbooks™ viewer.",
    path: `${TALISBOOKS_ROUTES.VIEWER}/${book.slug}`,
  });
}

export default async function TalisBooksViewerSlugPage({
  params,
}: TalisBooksViewerSlugPageProps) {
  const { slug } = await params;
  const [book, isMarketingAdmin] = await Promise.all([
    resolveViewerBookBySlug(slug),
    isMarketingManagerAuthenticated(),
  ]);

  if (!book) {
    notFound();
  }

  const editState = book.fastCode
    ? await getMapSiteEditToolbarState(book.fastCode)
    : { isAdmin: false, isOwner: false, showToolbar: false };

  const isAdmin = isMarketingAdmin || editState.isAdmin;
  const canEditTools = isAdmin || editState.showToolbar;

  const paymentReceived = book.fastCode
    ? await hasCompletedMapSitePaypalPayment({ fastCode: book.fastCode })
    : false;

  // Dashboard + Live Edit only after payment (Marketing Admin bypass).
  const showDashboard = isAdmin || paymentReceived;
  const canLiveEdit = isAdmin || (paymentReceived && canEditTools);

  return (
    <TalisBooksViewerShell
      book={book}
      canEditTools={canEditTools}
      canLiveEdit={canLiveEdit}
      showDashboard={showDashboard}
    />
  );
}
