import Link from "next/link";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { getTalisBooksDashboardStats, listTalisBooks } from "@/lib/talisbooks/book-service";
import type { TalisBooksDashboardStats } from "@/lib/talisbooks/types";
import { listMapSitesForAdmin } from "@/lib/mapsite-service";
import { isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  TALISBOOKS_DATABASE_MODELS,
  TALISBOOKS_ECOSYSTEM_CHAIN,
  TALISBOOKS_FUTURE_FEATURES,
  TALISBOOKS_PRODUCT_NAME,
} from "@/lib/talisbooks/constants";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";
import {
  filterBooksForAdminLibrary,
  filterMapSitesForAdminLibrary,
  talisbooksScopeFromAdminAccount,
} from "@/lib/talisbooks/library";

const EMPTY_STATS: TalisBooksDashboardStats = {
  totalBooks: 0,
  publishedBooks: 0,
  draftBooks: 0,
  inReviewBooks: 0,
  totalPages: 0,
  totalTemplates: 0,
  totalImages: 0,
  totalAuthors: 0,
};

async function safeListTalisBooks() {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    return await listTalisBooks();
  } catch {
    return [];
  }
}

async function safeTalisBooksStats(): Promise<TalisBooksDashboardStats> {
  if (!isSupabaseAdminConfigured()) return EMPTY_STATS;
  try {
    return await getTalisBooksDashboardStats();
  } catch {
    return EMPTY_STATS;
  }
}

export default async function TalisBooksAdminHome() {
  const scope = talisbooksScopeFromAdminAccount(await getAdminSessionAccount());
  const [stats, mapsites, books] = await Promise.all([
    safeTalisBooksStats(),
    listMapSitesForAdmin(),
    safeListTalisBooks(),
  ]);
  const scopedMapsites = filterMapSitesForAdminLibrary(mapsites, scope);
  const scopedBooks = filterBooksForAdminLibrary(books, scope);
  const scopedStats: TalisBooksDashboardStats = scope.excludeDemonstrationCatalog
    ? {
        ...stats,
        totalBooks: scopedBooks.length,
        publishedBooks: scopedBooks.filter((book) => book.publishStatus === "published").length,
        draftBooks: scopedBooks.filter((book) => book.publishStatus === "draft").length,
        inReviewBooks: scopedBooks.filter((book) => book.publishStatus === "in_review").length,
      }
    : stats;

  const booksByFastCode = new Map<string, { slug: string; title: string }[]>();
  for (const book of scopedBooks) {
    const code = book.fastCode?.trim();
    if (!code) continue;
    const key = code.toLowerCase();
    const current = booksByFastCode.get(key) ?? [];
    current.push({ slug: book.slug, title: book.title });
    booksByFastCode.set(key, current);
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
        Platform Administration
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">
        {TALISBOOKS_PRODUCT_NAME} Admin
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-500">
        Manage the Talisbooks™ digital publication engine. Books link to Mapsites™, accounts,
        and FAST Codes across the Talispros™ ecosystem.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Total Books</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">{scopedStats.totalBooks}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Published Books</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">{scopedStats.publishedBooks}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Pages</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">{stats.totalPages}</p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900">Database Models</h3>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 text-sm text-neutral-600">
          {TALISBOOKS_DATABASE_MODELS.map((model) => (
            <li key={model}>{model}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900">Ecosystem chain</h3>
        <ol className="mt-4 space-y-2">
          {TALISBOOKS_ECOSYSTEM_CHAIN.map((item) => (
            <li key={item.layer} className="flex gap-3 text-sm text-neutral-600">
              <span className="font-medium text-neutral-900">{item.layer}</span>
              <span>{item.description}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900">Public bookshelf</h3>
        <p className="mt-2 text-sm text-neutral-600">
          The product shelf lives at{" "}
          <Link href={TALISBOOKS_ROUTES.HOME} className="font-medium text-neutral-900 underline-offset-4 hover:underline">
            /talisbooks
          </Link>
          . Set <code className="rounded bg-neutral-100 px-1">is_pinned</code> on one published
          public book (via <code className="rounded bg-neutral-100 px-1">pinTalisBookAction</code>)
          to feature it first. Until a DB pin exists, the built-in TalisPros™ sample is shown.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900">Roadmap</h3>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 text-sm text-neutral-600">
          {TALISBOOKS_FUTURE_FEATURES.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900">Custom ebook editor</h3>
        <p className="mt-2 text-sm text-neutral-600">
          Open a Mapsite™ to use the same Talisbook™ template builder as the
          Build pages (wrap PDF / images, template slots, generate). After
          opening a book in the viewer, Live Edit is available for SUPERADMIN.
        </p>
        {scopedMapsites.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            No Mapsites™ found. Create one from Build requests, then return here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-100">
            {scopedMapsites.slice(0, 12).map((mapsite) => {
              const linked = booksByFastCode.get(mapsite.fastCode.toLowerCase()) ?? [];
              const firstBook = linked[0];
              return (
                <li
                  key={mapsite.fastCode}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-mono text-sm font-medium text-neutral-900">
                      {mapsite.fastCode}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {mapsite.propertyTitle || "Untitled Mapsite™"}
                      {firstBook ? ` · ${firstBook.title}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/mapsites/${mapsite.fastCode}#ebook-editor`}
                      className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
                    >
                      Open ebook editor
                    </Link>
                    {firstBook ? (
                      <Link
                        href={`${TALISBOOKS_ROUTES.VIEWER}/${firstBook.slug}`}
                        className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
                      >
                        Viewer Live Edit
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href={TALISBOOKS_ROUTES.ADMIN_BOOKSHELVES}
          className="inline-flex rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Bookshelves
        </Link>
        <Link
          href={TALISBOOKS_ROUTES.ADMIN_CENTERFOLDS}
          className="inline-flex rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
        >
          Centerfold preview
        </Link>
        <Link
          href={TALISBOOKS_ROUTES.DASHBOARD}
          className="inline-flex rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
        >
          Open Dashboard
        </Link>
        <Link
          href={TALISBOOKS_ROUTES.CLIENT_BOOKS}
          className="inline-flex rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
        >
          Client Books
        </Link>
      </div>
    </div>
  );
}
