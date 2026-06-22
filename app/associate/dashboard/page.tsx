"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAssociate } from "@/context/AssociateContext";
import { supabase } from "@/lib/supabase";

interface MapsiteRecord {
  id: string;
  type: string;
  status: string;
  request_id: string;
}

interface BuildRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}

interface FastCodeRecord {
  id: string;
  code: string;
  request_id: string;
}

interface DashboardItem {
  id: string;
  fastCode: string | null;
  name: string;
  email: string;
  type: string;
  status: "pending" | "in_progress" | "completed";
  createdAt: string;
}

type TabKey = "pending" | "in_progress" | "completed";

const TABS: { key: TabKey; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

export default function AssociateDashboardPage() {
  const { associate, associateId, isLoading: associateLoading } = useAssociate();
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("pending");

  const fetchAssignedRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data: msData, error } = await supabase
        .from("mapsite_requests")
        .select("id, type, status, request_id")
        .eq("assigned_to", associateId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!msData || msData.length === 0) {
        setItems([]);
        return;
      }

      const mapsiteRecords = msData as MapsiteRecord[];
      const requestIds = mapsiteRecords.map((m) => m.request_id);

      const requestIdToMapsite: Record<string, MapsiteRecord> = {};
      mapsiteRecords.forEach((m) => {
        requestIdToMapsite[m.request_id] = m;
      });

      const { data: brData } = await supabase
        .from("build_requests")
        .select("id, first_name, last_name, email, phone, status, created_at")
        .in("id", requestIds);

      const buildMap: Record<string, BuildRecord> = {};
      if (brData) {
        (brData as BuildRecord[]).forEach((br) => {
          buildMap[br.id] = br;
        });
      }

      const { data: fcData } = await supabase
        .from("fast_codes")
        .select("id, code, request_id")
        .in("request_id", requestIds);

      const fcMap: Record<string, FastCodeRecord> = {};
      if (fcData) {
        (fcData as FastCodeRecord[]).forEach((fc) => {
          fcMap[fc.request_id] = fc;
        });
      }

      const dashboardItems: DashboardItem[] = mapsiteRecords.map((ms) => {
        const br = buildMap[ms.request_id];
        const fc = fcMap[ms.request_id];

        let derivedStatus: DashboardItem["status"];
        switch (ms.status) {
          case "completed":
          case "failed":
            derivedStatus = "completed";
            break;
          case "processing":
            derivedStatus = "in_progress";
            break;
          default:
            derivedStatus = "pending";
        }

        return {
          id: ms.id,
          fastCode: fc?.code || null,
          name: br ? `${br.first_name} ${br.last_name}` : "Unknown",
          email: br?.email || "",
          type: ms.type || br?.status || "",
          status: derivedStatus,
          createdAt: br?.created_at || "",
        };
      });

      setItems(dashboardItems);
    } catch (err) {
      console.error("Error fetching assigned requests:", err);
    } finally {
      setLoading(false);
    }
  }, [associateId]);

  useEffect(() => {
    if (associateLoading) return;
    if (!associateId) {
      setLoading(false);
      return;
    }
    fetchAssignedRequests();
  }, [associateId, associateLoading, fetchAssignedRequests]);

  const filteredItems = useMemo(
    () => items.filter((item) => item.status === activeTab),
    [items, activeTab]
  );

  const counts = useMemo(() => {
    const p = items.filter((i) => i.status === "pending").length;
    const ip = items.filter((i) => i.status === "in_progress").length;
    const c = items.filter((i) => i.status === "completed").length;
    return { pending: p, in_progress: ip, completed: c };
  }, [items]);

  if (associateLoading) return null;

  if (!associate || !associateId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg className="w-12 h-12 text-neutral-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <h3 className="text-base font-medium text-neutral-900">Profile not found</h3>
        <p className="text-sm text-neutral-500 mt-1">Your associate profile could not be loaded. Please contact support.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
            My Requests
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {items.length} request{items.length !== 1 ? "s" : ""} assigned
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-white border border-neutral-200 rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-neutral-900 text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span
                className={`ml-1.5 text-xs ${
                  activeTab === tab.key ? "text-white/60" : "text-neutral-400"
                }`}
              >
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-neutral-200 rounded-xl p-5">
              <div className="h-4 bg-neutral-100 rounded animate-pulse w-24 mb-3" />
              <div className="h-3 bg-neutral-100 rounded animate-pulse w-48" />
            </div>
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-neutral-200 rounded-xl p-5 hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {item.fastCode ? (
                      <span className="font-mono text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {item.fastCode}
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-300">No code</span>
                    )}
                    <StatusBadge status={item.status} />
                  </div>
                  <h3 className="text-sm font-medium text-neutral-900 truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs text-neutral-400 truncate">{item.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-neutral-400">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                  <p className="text-xs text-neutral-300 mt-0.5">{item.type}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg className="w-12 h-12 text-neutral-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-base font-medium text-neutral-900">
            No {activeTab.replace("_", " ")} requests
          </h3>
          <p className="text-sm text-neutral-500 mt-1 max-w-xs">
            {activeTab === "pending"
              ? "When an admin assigns a build request, it will appear here."
              : activeTab === "in_progress"
                ? "Mark a pending request as in progress to track it here."
                : "Completed requests will show here."}
          </p>
        </div>
      )}

      <div className="mt-10 border border-dashed border-neutral-300 rounded-xl p-6 text-center">
        <svg className="w-8 h-8 text-neutral-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-sm font-medium text-neutral-500">Commission Tracking</h3>
        <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
          Commission tracking and earnings breakdown for completed requests will be available here.
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "pending"
      ? "bg-neutral-100 text-neutral-600"
      : status === "in_progress"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-green-100 text-green-700";

  const label =
    status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
