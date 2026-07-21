import Link from "next/link";
import { BookOpen } from "lucide-react";
import TalisBooksEmptyState from "@/components/talisbooks/platform/TalisBooksEmptyState";
import TalisBooksPageHeader from "@/components/talisbooks/platform/TalisBooksPageHeader";
import { listTalisBooks } from "@/lib/talisbooks/book-service";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";

export const dynamic = "force-dynamic";

export default async function TalisBooksBooksPage() {
  const books = await listTalisBooks();

  return (
    <div className="mx-auto max-w-6xl">
      <TalisBooksPageHeader
        title="Books"
        description="Manage digital books across the platform. Open Library for the personal standing-book bookshelf."
        action={
          <Link
            href={TALISBOOKS_ROUTES.LIBRARY}
            className="inline-flex rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Open Library
          </Link>
        }
      />
      {books.length === 0 ? (
        <TalisBooksEmptyState
          icon={BookOpen}
          title="No books yet"
          description="Create your first book once the editor and publish workflows come online — or preview the Library shelf."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {books.map((book) => (
            <li
              key={book.id}
              className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm"
            >
              <p className="text-sm font-semibold text-neutral-900">{book.title}</p>
              <p className="mt-1 text-xs text-neutral-500">{book.slug}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                {book.publishStatus}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
