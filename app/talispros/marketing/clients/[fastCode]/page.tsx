import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketingMetricsForm from "./MarketingMetricsForm";
import { requireMarketingManagerPage } from "@/lib/marketing-manager-auth";
import {
  getRecentMetricsForClient,
  listActiveMapSitesForMarketing,
} from "@/lib/client-marketing-service";
import { createMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ fastCode: string }>;
}): Promise<Metadata> {
  const { fastCode } = await params;
  const normalizedCode = fastCode.trim().toLowerCase();
  const clients = await listActiveMapSitesForMarketing();
  const client = clients.find(
    (entry) => entry.fastCode.toLowerCase() === normalizedCode
  );

  if (!client) {
    return createMetadata({
      title: "Client Not Found | Marketing Manager | Talispros™",
      description: "The requested client dashboard could not be found.",
      path: `/talispros/marketing/clients/${normalizedCode}`,
      private: true,
    });
  }

  const label = client.propertyTitle ?? client.ownerName;

  return createMetadata({
    title: `${label} | Marketing Manager | Talispros™`,
    description: `Post daily marketing metrics and checklist updates for ${client.ownerName} (${client.fastCode.toUpperCase()}).`,
    path: `/talispros/marketing/clients/${normalizedCode}`,
    private: true,
  });
}

export default async function MarketingClientPage({
  params,
}: {
  params: Promise<{ fastCode: string }>;
}) {
  await requireMarketingManagerPage();
  const { fastCode } = await params;
  const normalizedCode = fastCode.trim().toLowerCase();

  const clients = await listActiveMapSitesForMarketing();
  const client = clients.find(
    (entry) => entry.fastCode.toLowerCase() === normalizedCode
  );

  if (!client) {
    notFound();
  }

  const recentMetrics = await getRecentMetricsForClient(normalizedCode);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="mb-6">
        <Link href="/talispros/marketing" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← All clients
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">{client.ownerName}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {client.propertyTitle ?? client.email} ·{" "}
          <span className="font-mono">{client.fastCode.toUpperCase()}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Post Daily Metrics
          </h2>
          <MarketingMetricsForm fastCode={normalizedCode} defaultDate={today} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Recent Entries
          </h2>
          {recentMetrics.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
              <p className="text-sm text-neutral-500">No entries yet for this client.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentMetrics.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-sm font-medium text-neutral-900">
                      {new Date(`${entry.reportDate}T12:00:00`).toLocaleDateString("en-US")}
                    </p>
                    <span className="text-xs text-neutral-500 capitalize">
                      {entry.pipelineStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    FB {entry.facebookImpressions.toLocaleString("en-US")} · IG{" "}
                    {entry.instagramImpressions.toLocaleString("en-US")} · Reach{" "}
                    {entry.totalReach.toLocaleString("en-US")} · {entry.emailsReceived} emails ·{" "}
                    {entry.textsReceived} texts
                  </p>
                  {entry.checklistNotes ? (
                    <p className="text-sm text-neutral-700 mt-2 whitespace-pre-wrap">
                      {entry.checklistNotes}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
