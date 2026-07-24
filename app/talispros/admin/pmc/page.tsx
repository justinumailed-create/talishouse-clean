import Link from "next/link";
import { requireTalisprosAdminPage } from "@/lib/talispros-admin-auth";
import { isMarketingManagerAuthenticated } from "@/lib/marketing-manager-auth";
import { listPmcRegionalPins } from "@/lib/talispros/pmc-pins-service";
import { listPmcClaimedMapSites } from "@/lib/talispros/pmc-claimed-mapsites";
import PmcPinsAdminEditor from "@/components/talispros-admin/PmcPinsAdminEditor";

export const dynamic = "force-dynamic";

async function requirePmcAdminPage() {
  if (await isMarketingManagerAuthenticated()) return;
  await requireTalisprosAdminPage();
}

export default async function TalisprosPmcAdminPage() {
  await requirePmcAdminPage();
  const [pins, claimedMapSites] = await Promise.all([
    listPmcRegionalPins(),
    listPmcClaimedMapSites(),
  ]);

  return (
    <div className="max-w-5xl space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Talispros™ Admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-900">
            PMC MapSite™ admin
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            Manage regional Root Account™ pins and every generated FAST Code /
            claimed MapSite (pin map, listing copy, MLS® / URL / TEB™ / TTV™).
          </p>
        </div>
        <Link
          href="/talispros/admin"
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          Back
        </Link>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Claimed MapSites
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              All codes from{" "}
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
                fast_codes
              </code>
              . Open one to edit the map pin and resource buttons.
            </p>
          </div>
          <p className="text-xs font-medium text-neutral-500">
            {claimedMapSites.length} code
            {claimedMapSites.length === 1 ? "" : "s"}
          </p>
        </div>

        {claimedMapSites.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-600">
            No FAST Codes found yet. After Claim a Market™, codes appear here.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {claimedMapSites.map((site) => (
              <li key={site.fastCode}>
                <Link
                  href={`/talispros/admin/mapsites/${encodeURIComponent(site.fastCode)}`}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-neutral-50"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold uppercase text-neutral-900">
                      {site.fastCode}
                    </p>
                    <p className="truncate text-sm text-neutral-500">
                      {site.propertyTitle || "Untitled MapSite"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs uppercase tracking-wide text-neutral-400">
                    {site.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Regional Root Account pins
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Canada / USA pins on the brokers browse map (
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
              /talispros/mapsite?audience=brokers
            </code>
            ).
          </p>
        </div>
        <PmcPinsAdminEditor initialPins={pins} />
      </section>
    </div>
  );
}
