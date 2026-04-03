"use client";

import { useEffect, useState } from "react";
import { supabase, Project, FastCode, Payment } from "@/lib/supabase";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    projects: 0,
    fastCodes: 0,
    associates: 0,
    payments: 0,
    recentProjects: [] as Project[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [projectsRes, fastCodesRes, paymentsRes] = await Promise.all([
          supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(5),
          supabase.from("fast_codes").select("id"),
          supabase.from("payments").select("id"),
        ]);

        if (projectsRes.error) console.warn("Projects fetch error:", projectsRes.error.message);
        if (fastCodesRes.error) console.warn("FastCodes fetch error:", fastCodesRes.error.message);
        if (paymentsRes.error) console.warn("Payments fetch error:", paymentsRes.error.message);

        setStats({
          projects: projectsRes.data?.length || 0,
          fastCodes: fastCodesRes.data?.length || 0,
          associates: 0,
          payments: paymentsRes.data?.length || 0,
          recentProjects: projectsRes.data || [],
        });
      } catch (error: any) {
        console.warn("Stats fetch failed:", error?.message || error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Projects", value: stats.projects, icon: "📁" },
    { label: "FAST Codes", value: stats.fastCodes, icon: "🔑" },
    { label: "Associates", value: stats.associates, icon: "👥" },
    { label: "Payments", value: stats.payments, icon: "💳" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold mt-1">
                  {loading ? "..." : card.value}
                </p>
              </div>
              <span className="text-3xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold mb-4">Recent Projects</h2>
        {stats.recentProjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Location</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentProjects.map((project) => (
                  <tr key={project.id} className="border-b border-gray-50">
                    <td className="py-3 px-4">{project.name}</td>
                    <td className="py-3 px-4 text-gray-600">{project.location}</td>
                    <td className="py-3 px-4 text-gray-600">{project.phone}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === "new" ? "bg-blue-100 text-blue-700" :
                        project.status === "contacted" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-sm">
                      {new Date(project.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No projects yet. Data will appear once users submit projects.
          </p>
        )}
      </div>
    </div>
  );
}
