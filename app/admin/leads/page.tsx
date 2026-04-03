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

interface AssistantMessage {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  created_at: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<(Lead & { fastCodeInfo?: FastCodeInfo })[]>([]);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [dealModalLead, setDealModalLead] = useState<Lead | null>(null);

  useEffect(() => {
  fetchLeads();
}, [filter, sourceFilter]);

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
      if (sourceFilter !== "all") {
  query = query.eq("source", sourceFilter);
}

      const { data: leadsData } = await query;

      const { data: messagesData } = await supabase
        .from('assistant_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesData) {
        setAssistantMessages(messagesData);
      }

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
    
    const dealPayload = {
      user_id: userId,
      client_name: dealModalLead.name,
      phone: dealModalLead.phone,
      project_type: null,
      status: "new",
      value: data.project_value
    };
    console.log("DEAL INSERT - Payload:", JSON.stringify(dealPayload, null, 2));

    const { error: dealError } = await supabase.from("deals").insert([dealPayload]);
    if (dealError) {
      console.error("DEAL INSERT ERROR:", JSON.stringify(dealError, null, 2));
    } else {
      console.log("DEAL INSERT SUCCESS");
    }
    
    const updatePayload = {
      status: "converted",
      project_value: data.project_value,
      commission_rate: data.commission_rate,
      split_percentage: data.split_percentage,
      deal_status: "active"
    };
    console.log("LEAD UPDATE - Payload:", JSON.stringify(updatePayload, null, 2));

    const { error: updateError } = await supabase.from("leads").update(updatePayload).eq("id", dealModalLead.id);
    if (updateError) {
      console.error("LEAD UPDATE ERROR:", JSON.stringify(updateError, null, 2));
    } else {
      console.log("LEAD UPDATE SUCCESS");
    }
    
    setDealModalLead(null);
    fetchLeads();
  };

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and convert incoming leads</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input w-auto text-sm"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="input w-auto text-sm"
          >
            <option value="all">All Sources</option>
            <option value="talisbot">TalisBOT</option>
            <option value="website">Website</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col py-3 px-4 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-28"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24 hidden sm:block"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20 hidden md:block"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-14"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-14 hidden lg:block"></div>
                <div className="h-6 bg-gray-200 rounded-full animate-pulse w-18"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-14 hidden sm:block"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-16 ml-auto"></div>
              </div>
            ))}
          </div>
        ) : leads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Location</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">FAST</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Value</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, index) => (
                  <tr 
                    key={lead.id} 
                    className={`border-b border-gray-50 last:border-0 transition-colors hover:bg-gray-50/50 ${index % 2 === 1 ? "bg-gray-50/30" : ""}`}
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">{lead.name}</td>
                    <td className="py-3 px-4 text-gray-500">{lead.phone}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        lead.source === "talisbot" ? "bg-purple-100 text-purple-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {lead.source || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 hidden md:table-cell">{lead.location}</td>
                    <td className="py-3 px-4">
                      {lead.fastCodeInfo ? (
                        <Link
                          href={`/admin/users/${lead.fastCodeInfo.id}`}
                          className="text-blue-600 font-mono text-sm bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
                        >
                          {lead.fast_code}
                        </Link>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500 hidden lg:table-cell">
                      {lead.project_value ? `$${lead.project_value.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        lead.status === "new" ? "bg-gray-100 text-gray-700" :
                        lead.status === "contacted" ? "bg-yellow-100 text-yellow-800" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-sm hidden sm:table-cell">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5 whitespace-nowrap">
                        {lead.status === "new" && (
                          <button
                            onClick={() => updateStatus(lead.id, "contacted")}
                            className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                          >
                            Contact
                          </button>
                        )}
                        {lead.status === "contacted" && (
                          <button
                            onClick={() => updateStatus(lead.id, "converted")}
                            className="text-xs px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors"
                          >
                            Convert
                          </button>
                        )}
                        {lead.status === "converted" && (!lead.deal_status || lead.deal_status === "none") && (
                          <button
                            onClick={() => setDealModalLead(lead)}
                            className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-gray-900">No leads yet</h3>
            <p className="text-sm text-gray-500 text-center mt-1">New leads from TalisBOT and website will appear here</p>
          </div>
        )}
      </div>

      {dealModalLead && (
        <DealModal
          lead={dealModalLead}
          onClose={() => setDealModalLead(null)}
          onSave={createDeal}
        />
      )}

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Assistant Messages</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {assistantMessages.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Name</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Phone</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {assistantMessages.map((msg, index) => (
                    <tr 
                      key={msg.id} 
                      className={`border-b border-gray-50 last:border-0 transition-colors hover:bg-gray-50/50 ${index % 2 === 1 ? "bg-gray-50/30" : ""}`}
                    >
                      <td className="py-3 px-4 text-sm text-gray-700 max-w-xs truncate">{msg.message}</td>
                      <td className="py-3 px-4 text-gray-500 hidden md:table-cell">{msg.name}</td>
                      <td className="py-3 px-4 text-gray-500 hidden lg:table-cell">{msg.phone}</td>
                      <td className="py-3 px-4 text-gray-500 hidden lg:table-cell">{msg.email}</td>
                      <td className="py-3 px-4 text-gray-500 text-sm hidden sm:table-cell">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No assistant messages yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
