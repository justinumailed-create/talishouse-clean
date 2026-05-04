'use client';

import { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { formatCAD } from "@/utils/currency";

interface TalisBotLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  intent: string;
  size: string;
  budget: string;
  location: string;
  recommended_product_ids: string[];
  last_step: string;
  session_id: string;
  created_at: string;
}

interface Stats {
  totalLeads: number;
  conversionRate: number;
  avgBudget: string;
  topIntent: string;
}

export default function TalisBotAnalytics() {
  const [leads, setLeads] = useState<TalisBotLead[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    conversionRate: 0,
    avgBudget: 'N/A',
    topIntent: 'N/A',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
  .from('leads')
  .select('*')
  .eq('source', 'talisbot')
  .order('created_at', { ascending: false })
  .limit(100);

      if (data) {
        setLeads(data);

        // Calculate stats
        const totalLeads = data.length;
        
        // Intent breakdown
        const intentCounts: Record<string, number> = {};
        const budgetCounts: Record<string, number> = {};
        const stepDropoffs: Record<string, number> = {};
        
        data.forEach(lead => {
          if (lead.intent) {
            intentCounts[lead.intent] = (intentCounts[lead.intent] || 0) + 1;
          }
          if (lead.budget) {
            budgetCounts[lead.budget] = (budgetCounts[lead.budget] || 0) + 1;
          }
          if (lead.last_step) {
            stepDropoffs[lead.last_step] = (stepDropoffs[lead.last_step] || 0) + 1;
          }
        });

        // Top intent
        const topIntent = Object.entries(intentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        // Avg budget
        let avgBudget = 'N/A';
        const budgetValues: Record<string, number> = {
          under_25k: 17500,
          '25k_75k': 50000,
          over_75k: 100000,
        };
        const budgetSum = Object.entries(budgetCounts).reduce((sum, [key, count]) => {
          return sum + (budgetValues[key] || 0) * count;
        }, 0);
        if (totalLeads > 0) {
          avgBudget = formatCAD(budgetSum / totalLeads);
        }

        setStats({
          totalLeads,
          conversionRate: totalLeads > 0 ? Math.round((totalLeads / Math.max(totalLeads * 2, 1)) * 100) : 0,
          avgBudget,
          topIntent: topIntent.charAt(0).toUpperCase() + topIntent.slice(1),
        });
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Calculate distributions
  const intentCounts: Record<string, number> = {};
  const budgetCounts: Record<string, number> = {};
  const stepCounts: Record<string, number> = {};
  
  leads.forEach(lead => {
    if (lead.intent) intentCounts[lead.intent] = (intentCounts[lead.intent] || 0) + 1;
    if (lead.budget) budgetCounts[lead.budget] = (budgetCounts[lead.budget] || 0) + 1;
    if (lead.last_step) stepCounts[lead.last_step] = (stepCounts[lead.last_step] || 0) + 1;
  });

  const intentLabels: Record<string, string> = {
    personal: 'Personal Home',
    rental: 'Rental Investment',
    commercial: 'Commercial Space',
  };

  const budgetLabels: Record<string, string> = {
    under_25k: 'Under $25k',
    '25k_75k': '$25k–$75k',
    over_75k: '$75k+',
  };

  const stepLabels: Record<string, string> = {
    greeting: 'Started Chat',
    intent: 'Selected Intent',
    size: 'Selected Size',
    budget: 'Selected Budget',
    location: 'Entered Location',
    finish: 'Selected Finish',
    installation: 'Selected Installation',
    recommend: 'Saw Recommendations',
    convert: 'Conversion Prompt',
    lead: 'Submitted Lead',
    complete: 'Completed',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">TalisBOT Analytics</h1>
        <span className="text-sm text-gray-500">Real-time data</span>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Leads</p>
          <p className="text-2xl font-bold mt-1">{stats.totalLeads}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Conversion Rate</p>
          <p className="text-2xl font-bold mt-1">{stats.conversionRate}%</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Budget</p>
          <p className="text-2xl font-bold mt-1">{stats.avgBudget}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Top Intent</p>
          <p className="text-2xl font-bold mt-1">{stats.topIntent}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Intent Breakdown */}
        <div className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold mb-4">Lead Intent Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(intentCounts).length === 0 ? (
              <p className="text-sm text-gray-500">No data yet</p>
            ) : (
              Object.entries(intentCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([intent, count]) => {
                  const percent = stats.totalLeads > 0 ? Math.round((count / stats.totalLeads) * 100) : 0;
                  return (
                    <div key={intent} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span>{intentLabels[intent] || intent}</span>
                          <span className="text-gray-500">{count} ({percent}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full mt-1">
                          <div
                            className="h-full bg-black rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Budget Distribution */}
        <div className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold mb-4">Budget Distribution</h2>
          <div className="space-y-3">
            {Object.entries(budgetCounts).length === 0 ? (
              <p className="text-sm text-gray-500">No data yet</p>
            ) : (
              Object.entries(budgetCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([budget, count]) => {
                  const percent = stats.totalLeads > 0 ? Math.round((count / stats.totalLeads) * 100) : 0;
                  return (
                    <div key={budget} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span>{budgetLabels[budget] || budget}</span>
                          <span className="text-gray-500">{count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full mt-1">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Drop-off Analysis */}
      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-4">User Flow & Drop-off Analysis</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-gray-500">Step</th>
                <th className="text-right py-2 text-gray-500">Users</th>
                <th className="text-right py-2 text-gray-500">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stepCounts).length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-500">No drop-off data yet</td>
                </tr>
              ) : (
                Object.entries(stepCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([step, count]) => {
                    const percent = stats.totalLeads > 0 ? Math.round((count / stats.totalLeads) * 100) : 0;
                    return (
                      <tr key={step} className="border-b">
                        <td className="py-2">{stepLabels[step] || step}</td>
                        <td className="text-right py-2">{count}</td>
                        <td className="text-right py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            percent > 70 ? 'bg-green-100 text-green-700' :
                            percent > 40 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {percent}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Leads Table */}
      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-4">Recent TalisBOT Leads</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-gray-500">Name</th>
                <th className="text-left py-2 text-gray-500">Phone</th>
                <th className="text-left py-2 text-gray-500">Intent</th>
                <th className="text-left py-2 text-gray-500">Budget</th>
                <th className="text-left py-2 text-gray-500">Location</th>
                <th className="text-right py-2 text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">No leads yet</td>
                </tr>
              ) : (
                leads.slice(0, 10).map((lead) => (
                  <tr key={lead.id} className="border-b">
                    <td className="py-2">{lead.name}</td>
                    <td className="py-2">{lead.phone}</td>
                    <td className="py-2">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {intentLabels[lead.intent] || lead.intent || '-'}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                        {budgetLabels[lead.budget] || lead.budget || '-'}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500">{lead.location || '-'}</td>
                    <td className="text-right py-2 text-gray-500">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
