import Link from "next/link";
import { getTalisMapsDashboardStats } from "@/lib/talismaps/map-service";
import type { TalisMapsDashboardStats } from "@/lib/talismaps/types";
import { TALISMAPS_FUTURE_FEATURES, TALISMAPS_PRODUCT_NAME } from "@/lib/talismaps/constants";
import { TALISMAPS_ROUTES } from "@/lib/talismaps/routes";

const EMPTY_STATS: TalisMapsDashboardStats = {
  totalMaps: 0,
  totalPins: 0,
  publishedMaps: 0,
  draftMaps: 0,
  visitors: 0,
  qrScans: 0,
  activeListings: 0,
  rootAccounts: 0,
  derivativeAccounts: 0,
  adproPins: 0,
};

async function safeTalisMapsStats(): Promise<TalisMapsDashboardStats> {
  try {
    return await getTalisMapsDashboardStats();
  } catch {
    return EMPTY_STATS;
  }
}

export default async function TalisMapsAdminHome() {
  const stats = await safeTalisMapsStats();

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
        Platform Administration
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">
        {TALISMAPS_PRODUCT_NAME} Admin
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-500">
        Manage the Talismaps™ platform architecture, monitor adoption, and configure
        ecosystem integrations. This console is separate from Talispros™ Mapsite™ admin.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Total Maps</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">{stats.totalMaps}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Published Maps</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">{stats.publishedMaps}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Visitors</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">{stats.visitors}</p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900">Database Models</h3>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 text-sm text-neutral-600">
          {[
            "Maps",
            "MapPins",
            "PinCategories",
            "PinMedia",
            "MapThemes",
            "MapViews",
            "MapAnalytics",
            "MapPermissions",
            "MapAssets",
            "MapInvitations",
          ].map((model) => (
            <li key={model}>{model}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900">Roadmap</h3>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 text-sm text-neutral-600">
          {TALISMAPS_FUTURE_FEATURES.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href={TALISMAPS_ROUTES.DASHBOARD}
          className="inline-flex rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Open Dashboard
        </Link>
        <Link
          href="/talispros/admin"
          className="inline-flex rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
        >
          Talispros™ Admin
        </Link>
      </div>
    </div>
  );
}
