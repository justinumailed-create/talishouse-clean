import { Map } from "lucide-react";
import TalisMapsEmptyState from "@/components/talismaps/platform/TalisMapsEmptyState";
import TalisMapsPageHeader from "@/components/talismaps/platform/TalisMapsPageHeader";
import { listTalisMaps } from "@/lib/talismaps/map-service";

export const dynamic = "force-dynamic";

export default async function TalisMapsMapsPage() {
  const maps = await listTalisMaps();

  return (
    <div className="mx-auto max-w-6xl">
      <TalisMapsPageHeader
        title="Maps"
        description="Create and manage TalisMaps™ instances for root accounts, derivative networks, and Adpro PINs."
      />

      {maps.length === 0 ? (
        <TalisMapsEmptyState
          icon={Map}
          title="Map library is empty"
          description="Maps will appear here once created. Each map supports themes, permissions, invitations, and analytics."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {maps.map((map) => (
            <article
              key={map.id}
              className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-neutral-900">{map.name}</h2>
                  <p className="mt-1 text-sm text-neutral-500">{map.description || "No description"}</p>
                </div>
                <span className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium capitalize text-neutral-600">
                  {map.status}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-neutral-500">
                <div>
                  <dt className="font-medium text-neutral-400">Slug</dt>
                  <dd className="mt-0.5 text-neutral-700">{map.slug}</dd>
                </div>
                <div>
                  <dt className="font-medium text-neutral-400">Account Type</dt>
                  <dd className="mt-0.5 capitalize text-neutral-700">{map.accountType}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
