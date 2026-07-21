import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { requireClientAnalyticsSession } from "@/lib/client-analytics-auth";
import { listTalisBooksByFastCode } from "@/lib/talisbooks/ecosystem-service";
import { TALISBOOKS_ECOSYSTEM_CHAIN, TALISBOOKS_PRODUCT_NAME } from "@/lib/talisbooks/constants";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: `My Books | ${TALISBOOKS_PRODUCT_NAME}`,
  description:
    "Client portal for TalisBooks™ digital publications linked to your MapSite™, account, and FAST Code.",
  path: "/client/books",
  private: true,
});

export const dynamic = "force-dynamic";

export default async function ClientBooksPage() {
  const session = await requireClientAnalyticsSession();
  const books = await listTalisBooksByFastCode(session.fastCode);

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Talispros™ Client Portal
            </p>
            <h1 className="text-sm font-semibold text-neutral-900">{TALISBOOKS_PRODUCT_NAME}</h1>
          </div>
          <span className="font-mono text-xs text-neutral-500">
            {session.fastCode.toUpperCase()}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">My Books</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500">
            Digital publications linked to your MapSite™ through your account and FAST Code.
            Editing is not enabled yet — this is the client portal scaffold.
          </p>
        </div>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-neutral-900">Ecosystem chain</h3>
          <ol className="mt-4 space-y-2">
            {TALISBOOKS_ECOSYSTEM_CHAIN.map((item) => (
              <li key={item.layer} className="flex gap-3 text-sm text-neutral-600">
                <span className="font-medium text-neutral-900">{item.layer}</span>
                <span>{item.description}</span>
              </li>
            ))}
          </ol>
        </section>

        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">No books yet</h3>
            <p className="mt-2 max-w-md text-sm text-neutral-500">
              Books for FAST Code {session.fastCode.toUpperCase()} will appear here once linked
              to your MapSite™.
            </p>
            <Link
              href={TALISBOOKS_ROUTES.VIEWER}
              className="mt-6 inline-flex rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Preview demo viewer
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {books.map((book) => (
              <li
                key={book.bookId}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
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
    </div>
  );
}
