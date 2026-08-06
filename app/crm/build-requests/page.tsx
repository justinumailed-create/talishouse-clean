"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface BuildRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  created_at: string;
  fastCode?: string;
}

export default function CrmBuildRequestsPage() {
  const [requests, setRequests] = useState<BuildRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data: brData } = await supabase
        .from("build_requests")
        .select("id, first_name, last_name, email, status, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!brData) {
        setLoading(false);
        return;
      }

      const ids = brData.map((r) => r.id);
      const { data: fcData } = await supabase
        .from("fast_codes")
        .select("code, request_id")
        .in("request_id", ids);

      const fcMap: Record<string, string> = {};
      if (fcData) {
        fcData.forEach((fc) => {
          fcMap[fc.request_id] = fc.code;
        });
      }

      setRequests(
        brData.map((r) => ({
          ...r,
          fastCode: fcMap[r.id],
        }))
      );
      setLoading(false);
    }
    fetch();
  }, []);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-neutral-100 text-neutral-600",
      pending: "bg-blue-100 text-blue-700",
      approved: "bg-yellow-100 text-yellow-700",
      in_progress: "bg-purple-100 text-purple-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-neutral-100 text-neutral-600"}`}>
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Build Requests</h1>
      <p className="text-sm text-gray-500 mb-6">Mapsite™ build requests from the public form</p>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-neutral-400">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-400">No build requests yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Fast Code</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r, i) => (
                  <tr key={r.id} className={`border-b border-neutral-50 hover:bg-neutral-50/50 ${i % 2 === 1 ? "bg-neutral-50/30" : ""}`}>
                    <td className="py-3 px-4">
                      {r.fastCode ? (
                        <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{r.fastCode}</span>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-neutral-900">{r.first_name} {r.last_name}</td>
                    <td className="py-3 px-4 text-neutral-500 hidden sm:table-cell">{r.email}</td>
                    <td className="py-3 px-4">{statusBadge(r.status)}</td>
                    <td className="py-3 px-4 text-neutral-500 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
