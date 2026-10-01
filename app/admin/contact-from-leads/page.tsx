"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, type Lead } from "@/lib/supabase";
import { OWNERSHIP_CONTACT_SOURCE } from "@/lib/talispros/ownership-contact";

type ContactLead = Lead & {
  notes?: string | null;
};

export default function ContactFromLeadsPage() {
  const [leads, setLeads] = useState<ContactLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("leads")
        .select("*")
        .eq("source", OWNERSHIP_CONTACT_SOURCE)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setLeads([]);
      } else {
        setLeads((data as ContactLead[]) || []);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((lead) => {
      const hay = [
        lead.name,
        lead.email,
        lead.phone,
        lead.message,
        lead.location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [leads, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Contact from leads
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Inquiries from homepage ownership Learn More forms (Conventional,
          SPLITS, Fractionalization). Tokenization keeps the dedicated
          /learn-more page.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, topic…"
          className="w-full max-w-md rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#046BD9]"
        />
        <span className="text-xs text-neutral-500">
          {filtered.length} of {leads.length}
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
          No ownership Learn More contacts yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="min-w-full divide-y divide-neutral-100 text-left text-sm">
            <thead className="bg-neutral-50 text-[11px] uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Topic</th>
                <th className="px-4 py-3 font-semibold">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((lead) => (
                <tr key={lead.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                    {lead.created_at
                      ? new Date(lead.created_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {lead.name}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    <div>{lead.email || "—"}</div>
                    <div className="text-neutral-500">{lead.phone || ""}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {(lead.location || "").replace(
                      /^Ownership Learn More —\s*/,
                      "",
                    ) || "—"}
                  </td>
                  <td className="max-w-md px-4 py-3 text-neutral-600">
                    <p className="whitespace-pre-wrap">{lead.message || "—"}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
