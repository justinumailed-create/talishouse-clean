import Link from "next/link";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { getLocale } from "@/lib/i18n/server";
import TalisBooksViewerShell from "@/components/talisbooks/viewer/TalisBooksViewerShell";
import {
  TSPLITS_BOOK_COPY,
  createTsplitsViewerBook,
  tsplitsLocale,
} from "@/lib/talisu/tsplits-book";
import { TALISU_DISCUSS_PATH, talisuHref } from "@/lib/talisu/talisu-links";

export async function generateMetadata() {
  return pageMetadata("/talisu/tsplits");
}

/**
 * /talisu/tsplits — Tsplits™ – from Vision to Implementation as a
 * page-turning Talisbook™ (EN / DE via the talis_locale cookie). First item
 * in the TalisU dropdown. Cover first, back cover last; click or use the
 * arrow keys to turn pages. Open spread on desktop, single page on phones.
 */
export default async function TsplitsPage() {
  const locale = tsplitsLocale(await getLocale());
  const book = createTsplitsViewerBook(locale);
  const copy = TSPLITS_BOOK_COPY[locale];
  return (
    <div
      data-testid="tsplits-page"
      className="tsplits-page talis-working-bg min-h-dvh px-3 pb-16 pt-4 sm:px-6 sm:pt-6"
    >
      {/* Inline max-width: the global `* { max-width: 100% }` reset is unlayered and beats the Tailwind utility. */}
      <div
        data-testid="tsplits-frame"
        className="mx-auto w-full max-w-[1400px]"
        style={{ maxWidth: 1400 }}
      >
        <div
          data-testid="tsplits-book"
          className="tsplits-book overflow-hidden rounded-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_18px_50px_rgba(0,0,0,0.10)]"
        >
          <TalisBooksViewerShell key={locale} book={book} hideClaim keyboardNav singleOnMobile />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[14px]">
          <a
            href={copy.pdfUrl}
            download={copy.pdfFileName}
            data-testid="tsplits-download-pdf"
            className="font-semibold text-[#0069CF] underline-offset-4 hover:underline"
          >
            {copy.downloadPdf}
          </a>
          <Link
            href={talisuHref(TALISU_DISCUSS_PATH)}
            data-testid="tsplits-discuss"
            className="font-semibold text-[#0069CF] underline-offset-4 hover:underline"
          >
            {copy.discuss} →
          </Link>
        </div>
      </div>
    </div>
  );
}
