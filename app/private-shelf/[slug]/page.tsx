import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";
import TalisBooksViewerShell from "@/components/talisbooks/viewer/TalisBooksViewerShell";
import { poppins } from "@/lib/fonts";
import { adminMetadata } from "@/lib/seo/page-metadata";
import {
  HIDDEN_BOOKS,
  HIDDEN_BOOKSHELF_PATH,
  createHiddenViewerBook,
  getHiddenBook,
  hiddenBookHref,
  hiddenBookshelfMetadata,
} from "@/lib/talisbooks/hidden-bookshelf";

type HiddenBookPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ spread?: string | string[]; page?: string | string[] }>;
};

/** Only registry books exist here; anything else is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return HIDDEN_BOOKS.map((book) => ({ slug: book.slug }));
}

/** Unlisted book: noindex / nofollow / nocache, never in the sitemap. */
export async function generateMetadata({ params }: HiddenBookPageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = getHiddenBook(slug);
  return hiddenBookshelfMetadata(await adminMetadata(), {
    title: book ? `${book.title} | Tsplits™` : "Tsplits™",
    description: book?.description ?? "A private Tsplits™ book.",
    path: book ? hiddenBookHref(book.slug) : HIDDEN_BOOKSHELF_PATH,
    image: book?.frontCover,
  });
}

export default async function HiddenBookPage({ params, searchParams }: HiddenBookPageProps) {
  const { slug } = await params;
  const book = getHiddenBook(slug);
  if (!book) notFound();

  const query = searchParams ? await searchParams : {};
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const pageIndex = Number(first(query.page));
  const spreadIndex = Number(first(query.spread));
  const single = Number.isFinite(pageIndex);
  const initialNavIndex = Math.max(
    0,
    single ? pageIndex : Number.isFinite(spreadIndex) ? spreadIndex : 0,
  );

  return (
    // Same frame as /talisbooks/viewer: blue bar, then the reader fills the rest.
    <div
      className={`${poppins.className} flex h-dvh min-h-dvh flex-col`}
      data-testid="hidden-book-page"
    >
      <TalisUMktsHeader />
      <div className="min-h-0 flex-1">
        <TalisBooksViewerShell
          book={createHiddenViewerBook(book)}
          hideClaim
          hidePlatformLinks
          keyboardNav
          singleOnMobile
          backHref={HIDDEN_BOOKSHELF_PATH}
          backLabel="Back to Private Bookshelf"
          initialViewMode={single ? "single" : "spread"}
          initialNavIndex={initialNavIndex}
        />
      </div>
    </div>
  );
}
