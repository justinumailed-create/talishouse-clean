import Link from "next/link";
import { requireTalisprosAdminPage } from "@/lib/talispros-admin-auth";
import { getTalisBooksDashboardStats } from "@/lib/talisbooks/book-service";
import {
  TALISBOOKS_DATABASE_MODELS,
  TALISBOOKS_ECOSYSTEM_CHAIN,
  TALISBOOKS_FUTURE_FEATURES,
  TALISBOOKS_PRODUCT_NAME,
} from "@/lib/talisbooks/constants";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";

export const dynamic = "force-dynamic";

export default async function TalisBooksAdminPage() {
  await requireTalisprosAdminPage();
  const stats = await getTalisBooksDashboardStats();

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-6 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Platform Administration
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">
          {TALISBOOKS_PRODUCT_NAME} Admin
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-500">
          Manage the TalisBooks™ digital publication engine. Books link to MapSites™, accounts,
          and FAST Codes across the Talispros™ ecosystem.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Total Books</p>
            <p className="mt-1 text-3xl font-semibold text-neutral-900">{stats.totalBooks}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Published Books</p>
            <p className="mt-1 text-3xl font-semibold text-neutral-900">{stats.publishedBooks}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Pages</p>
            <p className="mt-1 text-3xl font-semibold text-neutral-900">{stats.totalPages}</p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Database Models</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 text-sm text-neutral-600">
            {TALISBOOKS_DATABASE_MODELS.map((model) => (
              <li key={model}>{model}</li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Ecosystem chain</h2>
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
          <h2 className="text-lg font-semibold text-neutral-900">Roadmap</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 text-sm text-neutral-600">
            {TALISBOOKS_FUTURE_FEATURES.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href={TALISBOOKS_ROUTES.ADMIN_CENTERFOLDS}
            className="inline-flex rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
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
          <Link
            href="/talispros/admin"
            className="inline-flex rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            Talispros™ Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
