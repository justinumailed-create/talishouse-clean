import Link from "next/link";
import { requireMarketingManagerPage } from "@/lib/marketing-manager-auth";
import { listActiveMapSitesForMarketing } from "@/lib/client-marketing-service";

export const dynamic = "force-dynamic";

export default async function MarketingHomePage() {
  await requireMarketingManagerPage();
  const clients = await listActiveMapSitesForMarketing();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Client Dashboards</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Select a client to post daily metrics and checklist updates
        </p>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
          <p className="text-sm text-neutral-500">No active MapSites found.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clients.map((client) => (
            <li key={client.fastCode}>
              <Link
                href={`/talispros/marketing/clients/${client.fastCode}`}
                className="block rounded-xl border border-neutral-200 bg-white p-5 hover:border-neutral-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-900">{client.ownerName}</p>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {client.propertyTitle ?? client.email}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-medium text-neutral-600 bg-neutral-100 px-2 py-1 rounded">
                    {client.fastCode.toUpperCase()}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
