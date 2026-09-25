import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import IsolatedBookshelfView from "@/components/catalogue/IsolatedBookshelfView";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import {
  ISOLATED_BOOKSHELF_CREATE_PATH,
  ISOLATED_BOOKSHELF_PATH,
  ISOLATED_BOOKSHELF_UNLOCK_COOKIE,
  isIsolatedBookshelfFromAllPins,
} from "@/lib/talisbooks/isolated-bookshelf";
import { listIsolatedBookshelfBooks } from "@/lib/talisbooks/isolated-bookshelf-service";
import { createMetadata } from "@/lib/seo";
import {
  bookshelfOgMetadataImage,
  bookshelfSeoCopy,
} from "@/lib/talispros/mapsite-og-image";

export const dynamic = "force-dynamic";

const copy = bookshelfSeoCopy({ isolatedAllPins: true });

export const metadata: Metadata = createMetadata({
  title: copy.title,
  description: copy.description,
  path: ISOLATED_BOOKSHELF_PATH,
  image: bookshelfOgMetadataImage(copy.title),
});

/**
 * Isolated catalogue bookshelf — same Mapsite™-connected Talisbooks™ shelf
 * UX as `/talisbooks/fast/{code}`, scoped to ALLPINS.
 *
 * Publicly viewable so share crawlers receive bookshelf SEO/OG (not Admin
 * Login). Create remains Global Admin only via `/catalogue/bookshelf/create`.
 * Signed-in admins with an empty unlocked shelf still enter self-serve create
 * on first reach.
 */
export default async function CatalogueIsolatedBookshelfPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; from?: string }>;
}) {
  const account = await getAdminSessionAccount();
  const params = await searchParams;
  const books = await listIsolatedBookshelfBooks();
  const cookieStore = await cookies();
  const unlocked =
    cookieStore.get(ISOLATED_BOOKSHELF_UNLOCK_COOKIE)?.value === "1" ||
    params.created === "1" ||
    books.length > 0;

  if (account && !unlocked) {
    redirect(ISOLATED_BOOKSHELF_CREATE_PATH);
  }

  return (
    <IsolatedBookshelfView
      books={books}
      adminFastCode={account?.fastCode}
      canCreate={Boolean(account)}
      fromAllPins={isIsolatedBookshelfFromAllPins(params.from)}
    />
  );
}
