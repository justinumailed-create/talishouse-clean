"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, Lead } from "@/lib/supabase";

interface FastCodeInfo {
  id: string;
  code: string;
}

interface DealModalProps {
  lead: Lead;
  onClose: () => void;
  onSave: (data: { project_value: number; commission_rate: number; split_percentage: number }) => void;
}

function DealModal({ lead, onClose, onSave }: DealModalProps) {
  const [projectValue, setProjectValue] = useState(50000);
  const [commissionRate, setCommissionRate] = useState(10);
  const [splitPercentage, setSplitPercentage] = useState(50);

  const earnings = (projectValue * commissionRate * splitPercentage) / 10000;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4">
        <h3 className="text-xl font-semibold mb-2">Create Deal</h3>
        <p className="text-sm text-[#6e6e73] mb-6">{lead.name}</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#6e6e73] mb-2">
              Project Value
            </label>
            <input
              type="number"
              value={projectValue}
              onChange={(e) => setProjectValue(Number(e.target.value))}
              className="input"
              min="0"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#6e6e73] mb-2">
                Commission %
              </label>
              <input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                className="input"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm text-[#6e6e73] mb-2">
                Split %
              </label>
              <input
                type="number"
                value={splitPercentage}
                onChange={(e) => setSplitPercentage(Number(e.target.value))}
                className="input"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="bg-[#f5f5f7] p-4 rounded-xl">
            <p className="text-sm text-[#6e6e73]">Estimated Earnings</p>
            <p className="text-2xl font-semibold mt-1">${earnings.toLocaleString()}</p>
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
            onClick={() => onSave({ project_value: projectValue, commission_rate: commissionRate, split_percentage: splitPercentage })}
            className="btn-primary flex-1"
          >
            Create Deal
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<(Lead & { fastCodeInfo?: FastCodeInfo })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [dealModalLead, setDealModalLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [filter]);

  async function fetchLeads() {
    setLoading(true);
    try {
      let query = supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data: leadsData } = await query;

      if (leadsData && leadsData.length > 0) {
        const fastCodes = leadsData
          .map(l => l.fast_code)
          .filter((fc): fc is string => !!fc);

        let fastCodeMap: Record<string, FastCodeInfo> = {};
        
        if (fastCodes.length > 0) {
          const { data: fcData } = await supabase
            .from("fast_codes")
            .select("id, code")
            .in("code", [...new Set(fastCodes)]);

          if (fcData) {
            fcData.forEach(fc => {
              fastCodeMap[fc.code] = fc;
            });
          }
        }

        const enrichedLeads = leadsData.map(lead => ({
          ...lead,
          fastCodeInfo: lead.fast_code ? fastCodeMap[lead.fast_code] : undefined
        }));
        
        setLeads(enrichedLeads);
      } else {
        setLeads(leadsData || []);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("leads").update({ status }).eq("id", id);
    setLeads(leads.map(l => l.id === id ? { ...l, status: status as Lead["status"] } : l));
  };

  const createDeal = async (data: { project_value: number; commission_rate: number; split_percentage: number }) => {
    if (!dealModalLead) return;
    
    let userId: string | null = null;
    if (dealModalLead.fast_code) {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("fast_code", dealModalLead.fast_code)
        .single();
      userId = userData?.id || null;
    }
    
    await supabase.from("deals").insert({
      user_id: userId,
      client_name: dealModalLead.name,
      phone: dealModalLead.phone,
      project_type: null,
      status: "new",
      value: data.project_value
    });
    
    await supabase.from("leads").update({
      status: "converted",
      project_value: data.project_value,
      commission_rate: data.commission_rate,
      split_percentage: data.split_percentage,
      deal_status: "active"
    }).eq("id", dealModalLead.id);
    
    setDealModalLead(null);
    fetchLeads();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-[#6e6e73] text-center py-12">Loading...</p>
        ) : leads.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e5]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#6e6e73]">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#6e6e73]">Phone</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#6e6e73]">Location</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#6e6e73]">FAST Code</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#6e6e73]">Value</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#6e6e73]">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#6e6e73]">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#6e6e73]"></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-[#e5e5e5] last:border-0">
                  <td className="py-3 px-4 font-medium">{lead.name}</td>
                  <td className="py-3 px-4 text-[#6e6e73]">{lead.phone}</td>
                  <td className="py-3 px-4 text-[#6e6e73]">{lead.location}</td>
                  <td className="py-3 px-4">
                    {lead.fastCodeInfo ? (
                      <Link
                        href={`/admin/users/${lead.fastCodeInfo.id}`}
                        className="text-[#1E4ED8] font-mono text-sm bg-[#f5f5f7] px-2 py-1 rounded"
                      >
                        {lead.fast_code}
                      </Link>
                    ) : (
                      <span className="text-[#d2d2d7]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#6e6e73]">
                    {lead.project_value ? `$${lead.project_value.toLocaleString()}` : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      lead.status === "new" ? "bg-[#f5f5f7] text-[#111]" :
                      lead.status === "contacted" ? "bg-[#f5f5f7] text-[#6e6e73]" :
                      "bg-[#e8f5e9] text-[#1b5e20]"
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#6e6e73] text-sm">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {lead.status === "new" && (
                        <button
                          onClick={() => updateStatus(lead.id, "contacted")}
                          className="text-xs px-3 py-1 bg-[#f5f5f7] text-[#111] rounded-full hover:opacity-80"
                        >
                          Contact
                        </button>
                      )}
                      {lead.status === "contacted" && (
                        <button
                          onClick={() => updateStatus(lead.id, "converted")}
                          className="text-xs px-3 py-1 bg-[#e8f5e9] text-[#1b5e20] rounded-full hover:opacity-80"
                        >
                          Convert
                        </button>
                      )}
                      {lead.status === "converted" && (!lead.deal_status || lead.deal_status === "none") && (
                        <button
                          onClick={() => setDealModalLead(lead)}
                          className="text-xs px-3 py-1 bg-[#1E4ED8] text-white rounded-full hover:opacity-80"
                        >
                          Create Deal
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-[#6e6e73] text-center py-12">
            No leads found.
          </p>
        )}
      </div>

      {dealModalLead && (
        <DealModal
          lead={dealModalLead}
          onClose={() => setDealModalLead(null)}
          onSave={createDeal}
        />
      )}
    </div>
  );
}
