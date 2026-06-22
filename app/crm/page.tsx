"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Metrics {
  newRequests: number;
  assigned: number;
  completed: number;
  revenue: number;
  pending: number;
}

export default function CrmDashboard() {
  const [metrics, setMetrics] = useState<Metrics>({
    newRequests: 0,
    assigned: 0,
    completed: 0,
    revenue: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const [
          { count: newCount },
          { count: assignedCount },
          { count: completedCount },
          { count: pendingCount },
        ] = await Promise.all([
          supabase.from("build_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("build_requests").select("*", { count: "exact", head: true }).eq("status", "approved"),
          supabase.from("build_requests").select("*", { count: "exact", head: true }).eq("status", "completed"),
          supabase.from("production_queue").select("*", { count: "exact", head: true }).eq("status", "queued"),
        ]);

        const { count: leadCount } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true });

        setMetrics({
          newRequests: newCount || 0,
          assigned: assignedCount || 0,
          completed: completedCount || 0,
          revenue: leadCount || 0,
          pending: pendingCount || 0,
        });
      } catch (err) {
        console.error("Error fetching CRM metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  const cards = [
    {
      label: "New Requests",
      value: metrics.newRequests,
      color: "bg-blue-50 border-blue-200",
      icon: (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
    {
      label: "Assigned",
      value: metrics.assigned,
      color: "bg-yellow-50 border-yellow-200",
      icon: (
        <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      label: "Completed",
      value: metrics.completed,
      color: "bg-green-50 border-green-200",
      icon: (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Pipeline (Leads)",
      value: metrics.revenue,
      color: "bg-purple-50 border-purple-200",
      icon: (
        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: "Pending Queue",
      value: metrics.pending,
      color: "bg-orange-50 border-orange-200",
      icon: (
        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">CRM Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your TalisPros operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border p-5 ${card.color} ${
              loading ? "animate-pulse" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                {card.label}
              </span>
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                {card.icon}
              </div>
            </div>
            <p className="text-3xl font-bold text-neutral-900">
              {loading ? "—" : card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-neutral-900 mb-1">Quick Links</h2>
        <p className="text-sm text-neutral-500 mb-4">Navigate to CRM modules</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { href: "/crm/leads", label: "Leads" },
            { href: "/crm/build-requests", label: "Build Requests" },
            { href: "/crm/mapsites", label: "MapSites" },
            { href: "/crm/associates", label: "Associates" },
            { href: "/crm/production-queue", label: "Production Queue" },
            { href: "/crm/activity-logs", label: "Activity Logs" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block text-center px-4 py-3 bg-[#f5f5f7] rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
