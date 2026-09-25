import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import IsolatedBookshelfView from "@/components/catalogue/IsolatedBookshelfView";
import {
  getAdminSessionAccount,
  requireAdminPage,
} from "@/lib/admin-auth";
import {
  ISOLATED_BOOKSHELF_CREATE_PATH,
  ISOLATED_BOOKSHELF_UNLOCK_COOKIE,
} from "@/lib/talisbooks/isolated-bookshelf";
import { listIsolatedBookshelfBooks } from "@/lib/talisbooks/isolated-bookshelf-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Isolated Bookshelf | T-All Catalogue",
  description:
    "Admin-only isolated T-All bookshelf. Books are created through the self-serve ebook process.",
  robots: { index: false, follow: false },
};

/**
 * Isolated catalogue bookshelf — not the public /talisbooks shelf.
 * Only Global Admin can view. Creating books must go through self-serve
 * (`/catalogue/bookshelf/create`). First visit with an empty shelf sends
 * admins into that self-serve entry so reaching the shelf follows the process.
 */
export default async function CatalogueIsolatedBookshelfPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  await requireAdminPage();
  const account = await getAdminSessionAccount();
  if (!account) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const books = await listIsolatedBookshelfBooks();
  const cookieStore = await cookies();
  const unlocked =
    cookieStore.get(ISOLATED_BOOKSHELF_UNLOCK_COOKIE)?.value === "1" ||
    params.created === "1" ||
    books.length > 0;

  if (!unlocked) {
    redirect(ISOLATED_BOOKSHELF_CREATE_PATH);
  }

  return (
    <IsolatedBookshelfView books={books} adminFastCode={account.fastCode} />
  );
}
