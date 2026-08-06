import Link from "next/link";
import { requireTalisprosAdminPage } from "@/lib/talispros-admin-auth";
import { listMapSitesForAdmin } from "@/lib/mapsite-service";
import TalisprosAdminLogoutButton from "./TalisprosAdminLogoutButton";

export const dynamic = "force-dynamic";

export default async function TalisprosAdminOverviewPage() {
  await requireTalisprosAdminPage();

  const mapsites = await listMapSitesForAdmin();

  return (
    <div className="max-w-2xl">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold text-neutral-900">Talispros™ Admin</h1>
        <TalisprosAdminLogoutButton />
      </div>
      <p className="text-sm text-neutral-600 mb-8">
        Configure Mapsite™ templates, subscription tiers shown to visitors, and
        when the Express an Interest form is enabled.
      </p>

      <section className="grid gap-3 sm:grid-cols-2 mb-6">
        <Link
          href="/talispros/admin/pmc"
          className="rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:bg-neutral-50"
        >
          <p className="text-sm font-semibold text-neutral-900">PMC Mapsite™ admin</p>
          <p className="text-xs text-neutral-500 mt-1">
            Edit claimed Mapsite™ pins on a map, plus Canada/USA regional Root pins.
          </p>
        </Link>
        <Link
          href="/talispros/admin/forms-manager"
          className="rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:bg-neutral-50"
        >
          <p className="text-sm font-semibold text-neutral-900">Forms Manager</p>
          <p className="text-xs text-neutral-500 mt-1">
            View Build a Mapsite™ submissions and registration checkouts.
          </p>
        </Link>
        <Link
          href="/talispros/admin/registrations"
          className="rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:bg-neutral-50"
        >
          <p className="text-sm font-semibold text-neutral-900">Registrations</p>
          <p className="text-xs text-neutral-500 mt-1">
            Mark purchases completed individually or in bulk.
          </p>
        </Link>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Mapsites™</h2>

        {mapsites.length === 0 ? (
          <div className="text-sm text-neutral-600 space-y-3">
            <p>No Mapsites™ found in the database.</p>
            <p>
              Apply pending migrations with{" "}
              <code className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded">
                npx supabase db push --include-all
              </code>{" "}
              to seed Mapsite™ records.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {mapsites.map((mapsite) => (
              <li key={mapsite.fastCode}>
                <Link
                  href={`/talispros/admin/mapsites/${mapsite.fastCode}`}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 hover:bg-neutral-50"
                >
                  <div>
                    <p className="font-mono text-sm font-medium text-neutral-900">
                      {mapsite.fastCode}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {mapsite.propertyTitle || "Untitled Mapsite™"}
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-neutral-400">
                    {mapsite.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
