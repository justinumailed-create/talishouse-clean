import { notFound } from "next/navigation";
import TalisBooksViewerShell from "@/components/talisbooks/viewer/TalisBooksViewerShell";
import { resolveViewerBookBySlug } from "@/lib/talisbooks/viewer/load-book";
import { getMapSiteEditToolbarState } from "@/lib/mapsite-edit-auth";
import { isMarketingManagerAuthenticated } from "@/lib/marketing-manager-auth";
import { hasCompletedMapSitePaypalPayment } from "@/lib/talispros/mapsite-payment";

interface TalisBooksViewerSlugPageProps {
  params: Promise<{ slug: string }>;
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
