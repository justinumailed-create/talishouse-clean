"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, DealV2 } from "@/lib/supabase";

interface DealWithUser extends DealV2 {
  userInfo?: {
    id: string;
    fast_code: string;
    name: string;
  };
}

export default function DealsPage() {
  const [deals, setDeals] = useState<DealWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [editDeal, setEditDeal] = useState<DealWithUser | null>(null);
  const [stats, setStats] = useState({
    totalValue: 0,
    newDeals: 0,
    wonDeals: 0,
    lostDeals: 0,
  });

  useEffect(() => {
    fetchDeals();
  }, [filter]);

  async function fetchDeals() {
    setLoading(true);
    try {
      let query = supabase
        .from("deals")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data: dealsData } = await query;

      if (dealsData && dealsData.length > 0) {
        const userIds = dealsData.map(d => d.user_id).filter(Boolean);
        let userMap: Record<string, { id: string; fast_code: string; name: string }> = {};
        
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from("users")
            .select("id, fast_code, name")
            .in("id", userIds);

          if (usersData) {
            usersData.forEach(user => {
              userMap[user.id] = user;
            });
          }
        }

        const enrichedDeals = dealsData.map(deal => ({
          ...deal,
          userInfo: deal.user_id ? userMap[deal.user_id] : undefined
        }));
        
        setDeals(enrichedDeals);

        const totalValue = dealsData.reduce((sum, d) => sum + (d.value || 0), 0);
        const newDeals = dealsData.filter(d => d.status === "new").length;
        const wonDeals = dealsData.filter(d => d.status === "won").length;
        const lostDeals = dealsData.filter(d => d.status === "lost").length;

        setStats({ totalValue, newDeals, wonDeals, lostDeals });
      } else {
        setDeals(dealsData || []);
        setStats({ totalValue: 0, newDeals: 0, wonDeals: 0, lostDeals: 0 });
      }
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setLoading(false);
    }
  }

  const updateDeal = async (data: { value: number; status: string }) => {
    if (!editDeal) return;
    
    await supabase.from("deals").update(data).eq("id", editDeal.id);
    
    setEditDeal(null);
    fetchDeals();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Deals</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <p className="text-sm text-[#6e6e73]">Total Value</p>
          <p className="text-2xl font-semibold mt-2">${stats.totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <p className="text-sm text-[#6e6e73]">New</p>
          <p className="text-2xl font-semibold mt-2">{stats.newDeals}</p>
        </div>
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <p className="text-sm text-[#6e6e73]">Won</p>
          <p className="text-2xl font-semibold mt-2">{stats.wonDeals}</p>
        </div>
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <p className="text-sm text-[#6e6e73]">Lost</p>
          <p className="text-2xl font-semibold mt-2">{stats.lostDeals}</p>
        </div>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-[#6e6e73] text-center py-12">Loading...</p>
        ) : deals.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e5]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#6e6e73]">Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#6e6e73]">Phone</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#6e6e73]">Partner</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#6e6e73]">Value</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#6e6e73]">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#6e6e73]">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#6e6e73]"></th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.id} className="border-b border-[#e5e5e5] last:border-0">
                  <td className="py-3 px-4 font-medium">{deal.client_name}</td>
                  <td className="py-3 px-4 text-[#6e6e73]">{deal.phone || "—"}</td>
                  <td className="py-3 px-4">
                    {deal.userInfo ? (
                      <Link
                        href={`/admin/users/${deal.userInfo.id}`}
                        className="text-[#1E4ED8] font-mono text-sm bg-[#f5f5f7] px-2 py-1 rounded"
                      >
                        {deal.userInfo.fast_code}
                      </Link>
                    ) : (
                      <span className="text-[#d2d2d7]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#6e6e73]">
                    ${(deal.value || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      deal.status === "won" ? "bg-[#e8f5e9] text-[#1b5e20]" :
                      deal.status === "new" ? "bg-[#f5f5f7] text-[#111]" :
                      "bg-[#fce4ec] text-[#c62828]"
                    }`}>
                      {deal.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#6e6e73] text-sm">
                    {new Date(deal.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setEditDeal(deal)}
                      className="text-xs px-3 py-1 bg-[#f5f5f7] text-[#111] rounded-full hover:opacity-80"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-[#6e6e73] text-center py-12">
            No deals found.
          </p>
        )}
      </div>

      {editDeal && (
        <EditModal
          deal={editDeal}
          onClose={() => setEditDeal(null)}
          onSave={updateDeal}
        />
      )}
    </div>
  );
}

function EditModal({ deal, onClose, onSave }: { deal: DealWithUser; onClose: () => void; onSave: (data: { value: number; status: string }) => void }) {
  const [value, setValue] = useState(deal.value || 50000);
  const [status, setStatus] = useState(deal.status || "new");

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4">
        <h3 className="text-xl font-semibold mb-2">Edit Deal</h3>
        <p className="text-sm text-[#6e6e73] mb-6">{deal.client_name}</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#6e6e73] mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input"
            >
              <option value="new">New</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-[#6e6e73] mb-2">
              Value
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="input"
              min="0"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ value, status })}
            className="btn-primary flex-1"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
