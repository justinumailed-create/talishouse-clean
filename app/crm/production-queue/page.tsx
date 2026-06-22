"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface QueueItem {
  id: string;
  status: string;
  assignedTo: string | null;
  priority: number;
  fastCode: string | null;
  name: string;
  createdAt: string;
}

export default function CrmProductionQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function fetch() {
      const { data: pqData } = await supabase
        .from("production_queue")
        .select("id, request_id, status, assigned_to, priority, created_at")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);

      if (!pqData) {
        setLoading(false);
        return;
      }

      const ids = pqData.map((r) => r.request_id);
      const [{ data: brData }, { data: fcData }] = await Promise.all([
        supabase.from("build_requests").select("id, first_name, last_name").in("id", ids),
        supabase.from("fast_codes").select("code, request_id").in("request_id", ids),
      ]);

      const nameMap: Record<string, string> = {};
      if (brData) brData.forEach((b) => { nameMap[b.id] = `${b.first_name} ${b.last_name}`; });

      const fcMap: Record<string, string> = {};
      if (fcData) fcData.forEach((f) => { fcMap[f.request_id] = f.code; });

      setItems(
        pqData.map((q) => ({
          id: q.id,
          status: q.status,
          assignedTo: q.assigned_to,
          priority: q.priority,
          fastCode: fcMap[q.request_id] || null,
          name: nameMap[q.request_id] || "Unknown",
          createdAt: q.created_at,
        }))
      );
      setLoading(false);
    }
    fetch();
  }, []);

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      queued: "bg-blue-100 text-blue-700",
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Production Queue</h1>
          <p className="text-sm text-gray-500">Build queue status overview</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-900"
        >
          <option value="all">All</option>
          <option value="queued">Queued</option>
          <option value="processing">Processing</option>
          <option value="ready_for_review">Ready for Review</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-neutral-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-400">No queue items</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Fast Code</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Client</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Assigned</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Priority</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q, i) => (
                  <tr key={q.id} className={`border-b border-neutral-50 hover:bg-neutral-50/50 ${i % 2 === 1 ? "bg-neutral-50/30" : ""}`}>
                    <td className="py-3 px-4">
                      {q.fastCode ? (
                        <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{q.fastCode}</span>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-neutral-900">{q.name}</td>
                    <td className="py-3 px-4">{statusBadge(q.status)}</td>
                    <td className="py-3 px-4 text-neutral-500 text-xs hidden sm:table-cell">{q.assignedTo ? "Yes" : "—"}</td>
                    <td className="py-3 px-4 text-neutral-500 text-xs">{q.priority}</td>
                    <td className="py-3 px-4 text-neutral-500 text-xs">{new Date(q.createdAt).toLocaleDateString()}</td>
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
