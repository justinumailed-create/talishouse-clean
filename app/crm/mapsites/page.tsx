"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface MapSite {
  id: string;
  fastCode: string | null;
  name: string;
  type: string;
  status: string;
  assignedTo: string | null;
  createdAt: string;
}

export default function CrmMapsitesPage() {
  const [mapsites, setMapsites] = useState<MapSite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data: msData } = await supabase
        .from("mapsite_requests")
        .select("id, request_id, type, status, assigned_to, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!msData) {
        setLoading(false);
        return;
      }

      const ids = msData.map((m) => m.request_id);

      const [{ data: brData }, { data: fcData }] = await Promise.all([
        supabase.from("build_requests").select("id, first_name, last_name").in("id", ids),
        supabase.from("fast_codes").select("code, request_id").in("request_id", ids),
      ]);

      const nameMap: Record<string, string> = {};
      if (brData) brData.forEach((b) => { nameMap[b.id] = `${b.first_name} ${b.last_name}`; });

      const fcMap: Record<string, string> = {};
      if (fcData) fcData.forEach((f) => { fcMap[f.request_id] = f.code; });

      setMapsites(
        msData.map((m) => ({
          id: m.id,
          fastCode: fcMap[m.request_id] || null,
          name: nameMap[m.request_id] || "Unknown",
          type: m.type,
          status: m.status,
          assignedTo: m.assigned_to,
          createdAt: m.created_at,
        }))
      );
      setLoading(false);
    }
    fetch();
  }, []);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-blue-100 text-blue-700",
      processing: "bg-yellow-100 text-yellow-700",
      ready_for_review: "bg-purple-100 text-purple-700",
      completed: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
    };
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-neutral-100 text-neutral-600"}`}>
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">MapSites</h1>
      <p className="text-sm text-gray-500 mb-6">All MapSite build records</p>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-neutral-400">Loading...</div>
        ) : mapsites.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-400">No MapSites yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Fast Code</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Client</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Assigned</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody>
                {mapsites.map((m, i) => (
                  <tr key={m.id} className={`border-b border-neutral-50 hover:bg-neutral-50/50 ${i % 2 === 1 ? "bg-neutral-50/30" : ""}`}>
                    <td className="py-3 px-4">
                      {m.fastCode ? (
                        <a href={`/ma/${m.fastCode}`} target="_blank" className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100">
                          {m.fastCode}
                        </a>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-neutral-900">{m.name}</td>
                    <td className="py-3 px-4 text-neutral-500 hidden sm:table-cell">{m.type}</td>
                    <td className="py-3 px-4">{statusBadge(m.status)}</td>
                    <td className="py-3 px-4 text-neutral-500 text-xs hidden md:table-cell">{m.assignedTo ? "Yes" : "—"}</td>
                    <td className="py-3 px-4 text-neutral-500 text-xs">{new Date(m.createdAt).toLocaleDateString()}</td>
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
