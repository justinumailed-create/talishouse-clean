"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  assignFastCode,
  generateDraftMapSite,
  listBuildRequests,
  sendRegistration,
  setBuildRequestStatus,
  type BuildRequestListRow,
} from "./actions";

type BuildRequestRow = BuildRequestListRow;

export default function AdminMarketingPage() {
  const [rows, setRows] = useState<BuildRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [queryError, setQueryError] = useState<string | null>(null);

  async function fetchRows(): Promise<{ data: BuildRequestRow[]; error: string | null }> {
    const result = await listBuildRequests();
    if (!result.ok) return { data: [], error: result.error || "Unable to load build requests" };
    return { data: result.data, error: null };
  }

  const refresh = useCallback(async () => {
    const { data, error } = await fetchRows();
    setRows(data);
    setQueryError(error);
    setLoading(false);
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void refresh();
    }, 0);

    const poll = window.setInterval(() => {
      void refresh();
    }, 5000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(poll);
    };
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marketing Manager</h1>
        <p className="text-sm text-gray-500 mt-1">Manage production workflow and registration handoff</p>
      </div>

      <section className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Build Requests</h2>
            <p className="text-xs text-neutral-500">Submissions from /talispros/build-mapsite</p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="px-3 py-1.5 text-xs rounded bg-white border border-neutral-300 hover:bg-neutral-100"
            disabled={pending}
          >
            Refresh
          </button>
        </div>
        {queryError ? (
          <div className="px-4 py-3 border-b border-red-200 bg-red-50 text-sm text-red-700">
            Failed to load build requests: {queryError}
          </div>
        ) : null}
        <div className="overflow-x-auto">
        {loading ? (
          <div className="p-6 text-sm text-neutral-500">Loading build requests...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-left py-3 px-4">Client Name</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Requested Account Type</th>
                <th className="text-left py-3 px-4">Submission Date</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-neutral-100">
                  <td className="py-3 px-4">{row.first_name} {row.last_name}</td>
                  <td className="py-3 px-4">{row.email}</td>
                  <td className="py-3 px-4">{row.requested_account_type || "—"}</td>
                  <td className="py-3 px-4">
                    {new Date(row.submitted_at || row.created_at || new Date().toISOString()).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">{row.status}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-2">
                      <Link className="px-2 py-1 rounded bg-neutral-100" href={`/admin/marketing/${row.id}`}>View</Link>
                      <Link className="px-2 py-1 rounded bg-neutral-100" href={`/admin/marketing/${row.id}`}>Edit</Link>
                      <button className="px-2 py-1 rounded bg-indigo-100 text-indigo-800" onClick={() => runAction(() => assignFastCode(row.id))} disabled={pending}>Assign FAST Code</button>
                      <button className="px-2 py-1 rounded bg-green-100 text-green-800" onClick={() => runAction(() => generateDraftMapSite(row.id))} disabled={pending}>Generate MapSite</button>
                      <button className="px-2 py-1 rounded bg-blue-100 text-blue-800" onClick={() => runAction(() => sendRegistration(row.id))} disabled={pending}>Send Registration</button>
                      <button
                        className="px-2 py-1 rounded bg-red-100 text-red-700"
                        onClick={() => runAction(() => setBuildRequestStatus(row.id, "Rejected"))}
                        disabled={pending}
                      >
                        Reject
                      </button>
                      {row.registration_link ? (
                        <Link className="px-2 py-1 rounded bg-neutral-100" href={row.registration_link} target="_blank">
                          Registration Link
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      </section>
    </div>
  );
}
