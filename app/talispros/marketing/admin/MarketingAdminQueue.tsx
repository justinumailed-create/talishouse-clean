"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  listMarketingRegistrations,
  marketingActivateMapSite,
  marketingApproveBuildRequest,
  marketingAssignFastCode,
  marketingGenerateDraftMapSite,
  marketingSendRegistration,
  marketingSetBuildRequestStatus,
} from "./actions";
import type { BuildRequestListRow } from "@/app/admin/marketing/actions";
import { MARKETING_ADMIN_PATH } from "@/lib/mapsite-account-session";
import { REGISTRATION_MARKET_COPY } from "@/lib/registration-market";
import type { RegistrationMarket } from "@/lib/registration-market";
import {
  ADPRO_CATEGORY_OPTIONS,
  adproCategoryLabel,
} from "@/lib/talispros/adpro-categories";

function marketLabel(marketType: string | null): string {
  if (!marketType) return "—";
  const market = marketType as RegistrationMarket;
  return REGISTRATION_MARKET_COPY[market]?.label ?? marketType;
}

export default function MarketingAdminQueue() {
  const [rows, setRows] = useState<BuildRequestListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [queryError, setQueryError] = useState<string | null>(null);
  const [adproCategoryFilter, setAdproCategoryFilter] = useState("all");

  const refresh = useCallback(async () => {
    const result = await listMarketingRegistrations();
    if (!result.ok) {
      setQueryError(result.error || "Unable to load registrations");
      setRows([]);
    } else {
      setQueryError(null);
      setRows(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => {
      void refresh();
    }, 10000);
    return () => window.clearInterval(poll);
  }, [refresh]);

  const runAction = (action: () => Promise<{ ok: boolean; error?: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        alert(result.error || "Action failed");
        return;
      }
      await refresh();
    });
  };

  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">
            Pending Build Requests
          </h2>
          <p className="text-xs text-neutral-500">
            Mapsite™ claims from Start → fullscreen map onboarding
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={pending}
          className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs hover:bg-neutral-100 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {queryError ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {queryError}
        </div>
      ) : null}

      <div className="border-b border-neutral-200 bg-white px-4 py-3">
        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-neutral-500 sm:max-w-xs">
          Adpros category
          <select
            value={adproCategoryFilter}
            onChange={(event) => setAdproCategoryFilter(event.target.value)}
            className="h-9 rounded border border-neutral-300 px-2 text-sm font-normal tracking-normal text-neutral-900"
          >
            <option value="all">All categories</option>
            {ADPRO_CATEGORY_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-neutral-500">Loading registrations...</div>
      ) : rows.filter((row) => {
          if (adproCategoryFilter === "all") return true;
          return row.adpro_category === adproCategoryFilter;
        }).length === 0 ? (
        <div className="p-8 text-center text-sm text-neutral-500">
          No registrations yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Market</th>
                <th className="px-4 py-3 text-left">Account</th>
                <th className="px-4 py-3 text-left">Adpros Category</th>
                <th className="px-4 py-3 text-left">Submitted</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((row) => {
                  if (adproCategoryFilter === "all") return true;
                  return row.adpro_category === adproCategoryFilter;
                })
                .map((row) => (
                <tr key={row.id} className="border-b border-neutral-100">
                  <td className="px-4 py-3">
                    {row.first_name} {row.last_name}
                  </td>
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3">{marketLabel(row.market_type)}</td>
                  <td className="px-4 py-3">{row.requested_account_type || "—"}</td>
                  <td className="px-4 py-3">
                    {adproCategoryLabel(row.adpro_category) || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(
                      row.submitted_at || row.created_at || new Date().toISOString()
                    ).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`${MARKETING_ADMIN_PATH}/${row.id}`}
                        className="rounded bg-neutral-100 px-2 py-1"
                      >
                        Review
                      </Link>
                      <button
                        type="button"
                        className="rounded bg-emerald-100 px-2 py-1 text-emerald-800"
                        onClick={() =>
                          runAction(() => marketingApproveBuildRequest(row.id))
                        }
                        disabled={pending}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="rounded bg-indigo-100 px-2 py-1 text-indigo-800"
                        onClick={() => runAction(() => marketingAssignFastCode(row.id))}
                        disabled={pending}
                      >
                        FAST Code
                      </button>
                      <button
                        type="button"
                        className="rounded bg-green-100 px-2 py-1 text-green-800"
                        onClick={() =>
                          runAction(() => marketingGenerateDraftMapSite(row.id))
                        }
                        disabled={pending}
                      >
                        Convert to Active Mapsite™
                      </button>
                      <button
                        type="button"
                        className="rounded bg-teal-100 px-2 py-1 text-teal-900"
                        onClick={() =>
                          runAction(() => marketingActivateMapSite(row.id))
                        }
                        disabled={pending}
                      >
                        Activate Mapsite™
                      </button>
                      <button
                        type="button"
                        className="rounded bg-blue-100 px-2 py-1 text-blue-800"
                        onClick={() =>
                          runAction(() => marketingSendRegistration(row.id))
                        }
                        disabled={pending}
                      >
                        Payment Link
                      </button>
                      <button
                        type="button"
                        className="rounded bg-red-100 px-2 py-1 text-red-700"
                        onClick={() =>
                          runAction(() =>
                            marketingSetBuildRequestStatus(row.id, "Rejected")
                          )
                        }
                        disabled={pending}
                      >
                        Reject
                      </button>
                      {row.registration_link ? (
                        <Link
                          href={row.registration_link}
                          target="_blank"
                          className="rounded bg-neutral-100 px-2 py-1"
                        >
                          Open Link
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
