import Link from "next/link";
import type { IsolatedBookshelfBook } from "@/lib/talisbooks/isolated-bookshelf-service";
import {
  ISOLATED_BOOKSHELF_CREATE_PATH,
  ISOLATED_BOOKSHELF_PATH,
} from "@/lib/talisbooks/isolated-bookshelf";
import { ROUTES } from "@/lib/routes";
import {
  allPinsClaimedHref,
  allPinsPublishedHref,
} from "@/lib/talispros/allpins-mapsite-ui";

export default function IsolatedBookshelfView({
  books,
  adminFastCode,
}: {
  books: IsolatedBookshelfBook[];
  adminFastCode: string;
}) {
  return (
    <div
      className="min-h-dvh bg-[#f5f5f7] text-neutral-900"
      data-testid="isolated-bookshelf"
    >
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Product · T-All
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Isolated Bookshelf
            </h1>
            <p className="mt-1 max-w-xl text-sm text-neutral-500">
              Admin-only shelf. Books are created only through the self-serve
              ebook process — not exposed on the public /talisbooks catalogue.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={ROUTES.CATALOG}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
              T-All catalogue
            </Link>
            <Link
              href={allPinsClaimedHref()}
              className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-900 hover:bg-sky-100"
              data-testid="isolated-bookshelf-allpins"
            >
              ALLPINS Mapsite™
            </Link>
            <Link
              href={ISOLATED_BOOKSHELF_CREATE_PATH}
              className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              data-testid="isolated-bookshelf-create"
            >
              Create via self-serve
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <p className="mb-6 text-sm text-neutral-500">
          Signed in as Global Admin{" "}
          <span className="font-mono font-medium text-neutral-800">
            {adminFastCode.toUpperCase()}
          </span>
          . Linked showcase map: ALLPINS. Public visitors cannot create or edit this shelf.
        </p>

        {books.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
            <p className="text-lg font-medium text-neutral-900">
              No isolated books yet
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
              Reach this shelf by completing the self-serve ebook flow. The
              catalogue Bookshelf button starts that process.
            </p>
            <Link
              href={ISOLATED_BOOKSHELF_CREATE_PATH}
              className="mt-6 inline-flex rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Start self-serve ebook
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <li
                key={book.id}
                className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
              >
                <Link href={book.viewerHref} className="block">
                  <div className="aspect-[3/4] bg-neutral-100">
                    {book.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.coverImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                        No cover
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-4">
                    <p className="font-medium text-neutral-900">{book.title}</p>
                    {book.subtitle ? (
                      <p className="text-sm text-neutral-500">{book.subtitle}</p>
                    ) : null}
                    <p className="text-xs uppercase tracking-wide text-neutral-400">
                      {book.publishStatus}
                      {book.fastCode ? ` · ${book.fastCode.toUpperCase()}` : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-10 text-center text-xs text-neutral-400">
          Shelf path: {ISOLATED_BOOKSHELF_PATH}
        </p>
      </main>
    </div>
  );
}
