"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Associate {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  fast_code: string;
  mapsite_slug: string | null;
  created_at: string;
}

export default function AssociatesPage() {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [creating, setCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState<{ fastCode: string; mapsiteSlug: string; name: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAssociates();
  }, []);

  async function fetchAssociates() {
    try {
      const { data } = await supabase
        .from("associates")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        setAssociates(data.map(a => ({
          id: a.id,
          name: a.name,
          email: a.email,
          phone: a.phone,
          fast_code: a.fast_code,
          mapsite_slug: a.mapsite_slug,
          created_at: a.created_at,
        })));
      }
    } catch (err) {
      console.error("Error fetching associates:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAssociate(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        location: "manual-admin",
        participation_level: "referral",
        status: "pending",
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from("applications")
        .insert([payload]);

      if (insertError) {
        console.error("INSERT ERROR FULL:", JSON.stringify(insertError, null, 2));
        setError(insertError.message || "Insert failed");
        setCreating(false);
        return;
      }

      setShowSuccess({ fastCode: "PENDING", mapsiteSlug: "PENDING", name: formData.name });
      setFormData({ name: "", email: "", phone: "" });
    } catch (err) {
      console.error("CREATE ERROR FULL:", JSON.stringify(err, null, 2));
      setError(err instanceof Error ? err.message : "Failed to create application");
    } finally {
      setCreating(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Associates</h1>

      <section className="bg-white border rounded-xl p-4 space-y-4 mb-6">
        <h2 className="text-lg font-semibold">Create Associate</h2>

        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              Application for {showSuccess.name} submitted successfully!
            </p>
            <p className="text-sm text-green-700 mt-1">
              The associate record and FAST Code will be generated once you approve this application in the <Link href="/admin/project-applications" className="underline font-bold">Project Applications</Link> section.
            </p>
            <button
              onClick={() => setShowSuccess(null)}
              className="mt-2 text-sm text-green-600 hover:text-green-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleCreateAssociate} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            required
            placeholder="Associate Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
          />
          <input
            type="email"
            placeholder="Email (optional)"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
          />
          <button
            type="submit"
            disabled={creating || !formData.name.trim()}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {creating ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </section>

      <section className="bg-white border rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-4">Associate List</h2>

        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading...</p>
        ) : associates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Name</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">FAST Code</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Mapsite Slug</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Email</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Created</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Links</th>
                </tr>
              </thead>
              <tbody>
                {associates.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50">
                    <td className="py-2 px-3 font-medium">{a.name}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{a.fast_code}</span>
                        <button
                          onClick={() => copyToClipboard(a.fast_code)}
                          className="text-[#6e6e73] hover:text-black transition-colors"
                          title="Copy FAST Code"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-500 text-xs">{a.mapsite_slug || "—"}</td>
                    <td className="py-2 px-3 text-gray-600">{a.email || "—"}</td>
                    <td className="py-2 px-3 text-gray-500 text-xs">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/associates/${a.id}`}
                          className="text-gray-600 hover:text-black text-xs underline font-medium"
                        >
                          Settings
                        </Link>
                        <Link
                          href={`/mapsite/${a.mapsite_slug}`}
                          target="_blank"
                          className="text-green-600 hover:text-green-800 text-xs underline font-medium"
                        >
                          Open Mapsite
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No associates yet. Create one to get started.
          </p>
        )}
      </section>
    </div>
  );
}