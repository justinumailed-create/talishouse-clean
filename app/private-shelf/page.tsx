import type { Metadata } from "next";
import HiddenBookshelfView from "@/components/talisbooks/hidden/HiddenBookshelfView";
import { poppins } from "@/lib/fonts";
import { adminMetadata } from "@/lib/seo/page-metadata";
import {
  HIDDEN_BOOKS,
  HIDDEN_BOOKSHELF_PATH,
  HIDDEN_BOOKSHELF_TITLE,
  hiddenBookshelfMetadata,
} from "@/lib/talisbooks/hidden-bookshelf";

/**
 * /private-shelf: unlisted bookshelf, opened by direct link only.
 * Not in lib/seo/pages.json (sitemap source), nav bars or footers, and
 * noindex / nofollow / nocache on top of the shared noindex card.
 */
export async function generateMetadata(): Promise<Metadata> {
  return hiddenBookshelfMetadata(await adminMetadata(), {
    title: `${HIDDEN_BOOKSHELF_TITLE} | Tsplits™`,
    description: "A private Tsplits™ bookshelf.",
    path: HIDDEN_BOOKSHELF_PATH,
    image: HIDDEN_BOOKS[0]?.frontCover,
  });
}

export default function HiddenBookshelfPage() {
  return (
    <div className={poppins.className}>
      <HiddenBookshelfView />
    </div>
  );
}
