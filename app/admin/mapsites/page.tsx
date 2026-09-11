import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-auth";
import { listMapSitesForAdmin } from "@/lib/mapsite-service";

export const dynamic = "force-dynamic";

export default async function AdminMapSitesPage() {
  await requireAdminPage();
  const mapsites = await listMapSitesForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Mapsites™</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Open a Mapsite™ to edit listing text, media, pin placement, and linked Talisbooks™.
        </p>
      </div>

      {mapsites.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
          No Mapsites™ found. New submissions appear here after a build request is generated.
        </div>
      ) : (
        <ul className="space-y-2">
          {mapsites.map((mapsite) => (
            <li key={mapsite.fastCode}>
              <Link
                href={`/admin/mapsites/${mapsite.fastCode}`}
                className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:bg-neutral-50"
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
    </div>
  );
}
