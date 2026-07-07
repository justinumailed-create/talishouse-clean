"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { approveBuildRequest, setBuildRequestStatus } from "./actions";

type BuildRequestRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  requested_account_type: string | null;
  requested_fast_code: string | null;
  registration_link: string | null;
  status: string;
  created_at: string;
};

export default function AdminMarketingPage() {
  const [rows, setRows] = useState<BuildRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  async function refresh() {
    const { data } = await supabase
      .from("build_requests")
      .select(
        "id, first_name, last_name, email, requested_account_type, requested_fast_code, registration_link, status, created_at"
      )
      .order("created_at", { ascending: false });
    setRows((data as BuildRequestRow[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

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
        <p className="text-sm text-gray-500 mt-1">Build Requests</p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
        {loading ? (
          <div className="p-6 text-sm text-neutral-500">Loading build requests...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-left py-3 px-4">FAST Code</th>
                <th className="text-left py-3 px-4">Client Name</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Submission Date</th>
                <th className="text-left py-3 px-4">Account Type</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-neutral-100">
                  <td className="py-3 px-4 font-mono text-xs">{row.requested_fast_code || "—"}</td>
                  <td className="py-3 px-4">{row.first_name} {row.last_name}</td>
                  <td className="py-3 px-4">{row.email}</td>
                  <td className="py-3 px-4">{new Date(row.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4">{row.requested_account_type || "—"}</td>
                  <td className="py-3 px-4">{row.status}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-2">
                      <button className="px-2 py-1 rounded bg-neutral-100" onClick={() => alert(row.id)}>View</button>
                      <button className="px-2 py-1 rounded bg-neutral-100" onClick={() => alert("Edit in build request table")}>Edit</button>
                      <button
                        className="px-2 py-1 rounded bg-green-100 text-green-800"
                        onClick={() => runAction(() => approveBuildRequest(row.id))}
                        disabled={pending}
                      >
                        Approve
                      </button>
                      <button
                        className="px-2 py-1 rounded bg-red-100 text-red-700"
                        onClick={() => runAction(() => setBuildRequestStatus(row.id, "Rejected"))}
                        disabled={pending}
                      >
                        Reject
                      </button>
                      <button
                        className="px-2 py-1 rounded bg-amber-100 text-amber-800"
                        onClick={() => runAction(() => setBuildRequestStatus(row.id, "Changes Requested"))}
                        disabled={pending}
                      >
                        Request Changes
                      </button>
                      <button
                        className="px-2 py-1 rounded bg-blue-100 text-blue-800"
                        onClick={() => runAction(() => setBuildRequestStatus(row.id, "Awaiting Registration"))}
                        disabled={pending}
                      >
                        Activate Registration
                      </button>
                      {row.registration_link ? (
                        <Link className="px-2 py-1 rounded bg-neutral-100" href={row.registration_link} target="_blank">
                          Registration Link
                        </Link>
                      ) : null}
                      <button
                        className="px-2 py-1 rounded bg-purple-100 text-purple-700"
                        onClick={() => runAction(() => setBuildRequestStatus(row.id, "Published"))}
                        disabled={pending}
                      >
                        Publish MapSite
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
