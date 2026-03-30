"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, Lead } from "@/lib/supabase";

interface FastCodeUser {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  associate_id: string | null;
  created_at: string;
}

interface DealHistory {
  id: string;
  name: string;
  location: string;
  status: string;
  created_at: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<FastCodeUser | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<DealHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const userId = params.id as string;

      const { data: fastCodeData } = await supabase
        .from("fast_codes")
        .select("*")
        .eq("id", userId)
        .single();

      if (fastCodeData) {
        setUser(fastCodeData);

        const { data: leadsData } = await supabase
          .from("leads")
          .select("*")
          .eq("fast_code", fastCodeData.code)
          .order("created_at", { ascending: false });

        setLeads(leadsData || []);

        const { data: dealsData } = await supabase
          .from("projects")
          .select("*")
          .eq("fast_code", fastCodeData.code)
          .order("created_at", { ascending: false });

        setDeals(dealsData || []);
      }
      setLoading(false);
    }

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">User not found</p>
        <Link href="/admin/users" className="text-blue-600 hover:underline">
          Back to Users
        </Link>
      </div>
    );
  }

  const stats = {
    totalLeads: leads.length,
    newLeads: leads.filter(l => l.status === "new").length,
    contacted: leads.filter(l => l.status === "contacted").length,
    converted: leads.filter(l => l.status === "converted").length,
    totalDeals: deals.length,
    closedDeals: deals.filter(d => d.status === "closed").length,
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/users"
          className="text-gray-500 hover:text-black"
        >
          ← Back
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-gray-500 mt-1">FAST Code: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{user.code}</span></p>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium">{user.phone || "Not provided"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{user.email || "Not provided"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Member Since</p>
            <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Leads</p>
          <p className="text-2xl font-bold">{stats.totalLeads}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">New</p>
          <p className="text-2xl font-bold text-blue-600">{stats.newLeads}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Contacted</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.contacted}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Converted</p>
          <p className="text-2xl font-bold text-green-600">{stats.converted}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold mb-4">Recent Leads</h2>
          {leads.length > 0 ? (
            <div className="space-y-3">
              {leads.slice(0, 5).map((lead) => (
                <div key={lead.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{lead.name}</p>
                    <p className="text-xs text-gray-500">{lead.location}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    lead.status === "new" ? "bg-blue-100 text-blue-700" :
                    lead.status === "contacted" ? "bg-yellow-100 text-yellow-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {lead.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No leads yet</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold mb-4">Deal History</h2>
          {deals.length > 0 ? (
            <div className="space-y-3">
              {deals.slice(0, 5).map((deal) => (
                <div key={deal.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{deal.name}</p>
                    <p className="text-xs text-gray-500">{deal.location}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    deal.status === "new" ? "bg-blue-100 text-blue-700" :
                    deal.status === "contacted" ? "bg-yellow-100 text-yellow-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {deal.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No deals yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
