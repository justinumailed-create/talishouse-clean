"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getPermissions } from "@/lib/permissions";

interface ActivityLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  performed_by: string | null;
  details: unknown;
  created_at: string;
}

export default function CrmActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const perms = getPermissions("activityLogs");
  const canView = perms.canView;
  const startedRef = useRef(false);

  useEffect(() => {
    if (!canView || startedRef.current) return;
    startedRef.current = true;

    supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setLogs((data || []) as ActivityLog[]);
        setLoading(false);
      });
  }, [canView]);

  const filtered = filter === "all" ? logs : logs.filter((l) => l.table_name === filter);

  const actionBadge = (action: string) => {
    const styles: Record<string, string> = {
      created: "bg-green-100 text-green-700",
      updated: "bg-blue-100 text-blue-700",
      deleted: "bg-red-100 text-red-700",
      assigned: "bg-yellow-100 text-yellow-700",
      completed: "bg-purple-100 text-purple-700",
    };
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[action] || "bg-neutral-100 text-neutral-600"}`}>
        {action}
      </span>
    );
  };

  if (!perms.canView) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Activity Logs</h1>
        <p className="text-sm text-gray-500 mb-6">Audit trail for system changes</p>
        <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700 text-center">
          You do not have permission to view activity logs.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Activity Logs</h1>
          <p className="text-sm text-gray-500">Audit trail for system changes</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-900"
        >
          <option value="all">All Tables</option>
          <option value="build_requests">Build Requests</option>
          <option value="fast_codes">Fast Codes</option>
          <option value="mapsite_requests">MapSites</option>
          <option value="production_queue">Production Queue</option>
          <option value="mapsite_assets">Assets</option>
        </select>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-neutral-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-400">No activity logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Action</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Table</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Record</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">By</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr key={log.id} className={`border-b border-neutral-50 hover:bg-neutral-50/50 ${i % 2 === 1 ? "bg-neutral-50/30" : ""}`}>
                    <td className="py-3 px-4">{actionBadge(log.action)}</td>
                    <td className="py-3 px-4 text-neutral-600">
                      <span className="font-mono text-xs">{log.table_name}</span>
                    </td>
                    <td className="py-3 px-4 text-neutral-500 text-xs hidden sm:table-cell font-mono">
                      {log.record_id.slice(0, 8)}…
                    </td>
                    <td className="py-3 px-4 text-neutral-500 text-xs hidden md:table-cell">
                      {log.performed_by || "system"}
                    </td>
                    <td className="py-3 px-4 text-neutral-500 text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
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
