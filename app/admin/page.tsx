"use client";

import { useEffect, useState } from "react";
import { supabase, Project, FastCode, Payment } from "@/lib/supabase";
import Link from "next/link";

function generateFastCode(name: string): string {
  const initial = name.trim() ? name[0].toUpperCase() : "A";
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${initial}${random}`;
}

async function checkFastCodeUnique(code: string): Promise<boolean> {
  const { data } = await supabase
    .from("fast_codes")
    .select("code")
    .eq("code", code)
    .maybeSingle();
  return !data;
}

async function findUniqueFastCode(name: string): Promise<string> {
  let code = generateFastCode(name);
  let attempts = 0;
  while (!(await checkFastCodeUnique(code)) && attempts < 10) {
    code = generateFastCode(name);
    attempts++;
  }
  return code;
}

interface Associate {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  fast_code: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    projects: 0,
    fastCodes: 0,
    associates: 0,
    payments: 0,
    recentProjects: [] as Project[],
  });
  const [loading, setLoading] = useState(true);
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [creating, setCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState<{ fastCode: string; name: string } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [projectsRes, fastCodesRes, paymentsRes, usersRes] = await Promise.all([
          supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(5),
          supabase.from("fast_codes").select("id"),
          supabase.from("payments").select("id"),
          supabase.from("users").select("*").eq("role", "associate"),
        ]);

        if (projectsRes.error) console.warn("Projects fetch error:", projectsRes.error.message);
        if (fastCodesRes.error) console.warn("FastCodes fetch error:", fastCodesRes.error.message);
        if (paymentsRes.error) console.warn("Payments fetch error:", paymentsRes.error.message);

        setStats({
          projects: projectsRes.data?.length || 0,
          fastCodes: fastCodesRes.data?.length || 0,
          associates: usersRes.data?.length || 0,
          payments: paymentsRes.data?.length || 0,
          recentProjects: projectsRes.data || [],
        });

        if (usersRes.data) {
          setAssociates(usersRes.data.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            fast_code: u.fast_code,
            created_at: u.created_at,
          })));
        }
      } catch (error: any) {
        console.warn("Stats fetch failed:", error?.message || error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  async function handleCreateAssociate(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setCreating(true);

    try {
      const fastCode = await findUniqueFastCode(formData.name);

      const payload = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        fast_code: fastCode,
        role: "associate",
        role_type: "referral",
      };

      const { error: insertError } = await supabase.from("users").insert([payload]);

      if (insertError) {
        console.error("INSERT ERROR:", insertError);
        setCreating(false);
        return;
      }

      await supabase.from("fast_codes").insert([{
        code: fastCode,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
      }]);

      const { data: newUsers } = await supabase
        .from("users")
        .select("*")
        .eq("fast_code", fastCode)
        .maybeSingle();

      if (newUsers) {
        setAssociates(prev => [{
          id: newUsers.id,
          name: newUsers.name,
          email: newUsers.email,
          phone: newUsers.phone,
          fast_code: newUsers.fast_code,
          created_at: newUsers.created_at,
        }, ...prev]);
      }

      setShowSuccess({ fastCode, name: formData.name });
      setFormData({ name: "", email: "", phone: "" });
    } catch (error) {
      console.error("Error creating associate:", error);
    } finally {
      setCreating(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

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

      <section className="bg-white border rounded-xl p-4 space-y-4">
        <h2 className="text-lg font-semibold">Associate Management</h2>

        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              {showSuccess.name} created successfully!
            </p>
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-700">FAST Code:</span>
                <code className="bg-green-100 px-2 py-1 rounded font-mono font-bold">
                  {showSuccess.fastCode}
                </code>
                <button
                  onClick={() => copyToClipboard(showSuccess.fastCode)}
                  className="text-xs text-green-600 hover:text-green-800 underline"
                >
                  Copy
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-700">Page URL:</span>
                <code className="bg-green-100 px-2 py-1 rounded text-xs">
                  talishouse.com/a/{showSuccess.fastCode}
                </code>
                <button
                  onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/a/${showSuccess.fastCode}`)}
                  className="text-xs text-green-600 hover:text-green-800 underline"
                >
                  Copy
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowSuccess(null)}
              className="mt-2 text-sm text-green-600 hover:text-green-800"
            >
              Dismiss
            </button>
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
            {creating ? "Creating..." : "Create Associate Page"}
          </button>
        </form>

        {associates.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Created Associates</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Name</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">FAST Code</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Email</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Phone</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {associates.map((a) => (
                    <tr key={a.id} className="border-b border-gray-50">
                      <td className="py-2 px-3 font-medium">{a.name}</td>
                      <td className="py-2 px-3 font-mono text-xs">{a.fast_code}</td>
                      <td className="py-2 px-3 text-gray-600">{a.email || "—"}</td>
                      <td className="py-2 px-3 text-gray-600">{a.phone || "—"}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/a/${a.fast_code}`}
                            target="_blank"
                            className="text-blue-600 hover:text-blue-800 text-xs underline"
                          >
                            View Page
                          </Link>
                          <button
                            onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/a/${a.fast_code}`)}
                            className="text-gray-500 hover:text-gray-700 text-xs"
                            title="Copy link"
                          >
                            📋
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
