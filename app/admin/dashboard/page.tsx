"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAdminAuth } from "@/components/useAdminAuth";

export default function AdminDashboard() {
  const { role } = useAdminAuth();
  const [adminCode, setAdminCode] = useState("ADMIN123");
  const [stats, setStats] = useState({
    totalDeals: 0,
    activeDeals: 0,
    closedDeals: 0,
    earnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!role) return;

    async function fetchStats() {
      try {
        const [allDealsRes, activeDealsRes, closedDealsRes] = await Promise.all([
          supabase.from("deals").select("id"),
          supabase.from("deals").select("id").eq("status", "open"),
          supabase.from("deals").select("id").eq("status", "won"),
        ]);

        const { data: dealsData } = await supabase
          .from("deals")
          .select("project_value, commission_percent, split_percent, status");

        let totalEarnings = 0;
        if (dealsData) {
          totalEarnings = dealsData.reduce((sum, deal) => {
            const pv = deal.project_value || 0;
            const commission = deal.commission_percent || 10;
            const split = deal.split_percent || 50;
            return sum + (pv * (commission / 100) * (split / 100));
          }, 0);
        }

        setStats({
          totalDeals: allDealsRes.data?.length || 0,
          activeDeals: activeDealsRes.data?.length || 0,
          closedDeals: closedDealsRes.data?.length || 0,
          earnings: totalEarnings,
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    }

    fetchStats();
  }, [role]);

  const statCards = [
    { label: "Total Deals", value: stats.totalDeals },
    { label: "Active Deals", value: stats.activeDeals },
    { label: "Closed Deals", value: stats.closedDeals },
    { label: "Earnings", value: `$${stats.earnings.toLocaleString()}` },
  ];

  if (!role) return null;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        {role === "admin" && (
          <div className="flex items-center gap-3 bg-white px-4 py-2 border rounded-lg shadow-sm">
            <span className="text-xs font-medium text-[#6e6e73] uppercase tracking-wider">Super Admin FAST Code</span>
            <input 
              type="text" 
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value.toUpperCase())}
              className="font-mono font-bold text-sm bg-transparent border-none p-0 focus:ring-0 w-24 text-right"
              readOnly
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div 
            key={card.label} 
            className="bg-white border border-[#e5e5e5] rounded-xl p-6 shadow-sm"
          >
            <p className="text-sm text-[#6e6e73] font-medium">{card.label}</p>
            <p className="text-3xl font-semibold mt-2 tracking-tight">
              {loading ? "..." : card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
