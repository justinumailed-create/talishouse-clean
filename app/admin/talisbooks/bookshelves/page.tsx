import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-auth";
import { listMapSitesForAdmin } from "@/lib/mapsite-service";
import { listTalisBooks } from "@/lib/talisbooks/book-service";
import { isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";

export const dynamic = "force-dynamic";

async function safeListTalisBooks() {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    return await listTalisBooks();
  } catch {
    return [];
  }
}

export default async function AdminBookshelvesPage() {
  await requireAdminPage();

  const [mapsites, books] = await Promise.all([
    listMapSitesForAdmin(),
    safeListTalisBooks(),
  ]);

  const booksByFastCode = new Map<string, number>();
  for (const book of books) {
    const code = book.fastCode?.trim();
    if (!code) continue;
    const key = code.toLowerCase();
    booksByFastCode.set(key, (booksByFastCode.get(key) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Bookshelves</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Open a Mapsite™ TEB™ shelf or the public Talisbooks™ library. Edit books from
          Talisbooks™ admin or the Mapsite™ eBook panel.
        </p>
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">Public library</h2>
        <p className="text-sm text-neutral-500">
          The product bookshelf at /talisbooks. Pin a published book from Talisbooks™ admin
          to feature it first.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={TALISBOOKS_ROUTES.HOME}
            className="inline-flex rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Open public bookshelf
          </Link>
          <Link
            href={TALISBOOKS_ROUTES.LIBRARY}
            className="inline-flex rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
          >
            Open library
          </Link>
          <Link
            href={TALISBOOKS_ROUTES.ADMIN}
            className="inline-flex rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
          >
            Talisbooks™ admin
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-200 bg-neutral-50">
          <h2 className="text-sm font-semibold text-neutral-900">Mapsite™ shelves</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Each FAST Code has a TEB™ bookshelf. Open the shelf or jump to Mapsite™ / book tools.
          </p>
        </div>
        {mapsites.length === 0 ? (
          <p className="px-5 py-6 text-sm text-neutral-500">No Mapsites™ found.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {mapsites.map((mapsite) => {
              const bookCount = booksByFastCode.get(mapsite.fastCode.toLowerCase()) ?? 0;
              return (
                <li
                  key={mapsite.fastCode}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                >
                  <div>
                    <p className="font-mono text-sm font-medium text-neutral-900">
                      {mapsite.fastCode}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {mapsite.propertyTitle || "Untitled Mapsite™"} · {bookCount} book
                      {bookCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/talisbooks/fast/${mapsite.fastCode}`}
                      className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
                    >
                      Open shelf
                    </Link>
                    <Link
                      href={`/admin/mapsites/${mapsite.fastCode}`}
                      className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
                    >
                      Edit Mapsite™
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
