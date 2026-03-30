"use client";

import { useEffect, useState } from "react";
import { supabase, FastCode } from "@/lib/supabase";

export default function FastCodesPage() {
  const [fastCodes, setFastCodes] = useState<FastCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    fetchFastCodes();
  }, []);

  async function fetchFastCodes() {
    try {
      const { data, error } = await supabase
        .from("fast_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFastCodes(data || []);
    } catch (error) {
      console.error("Error fetching FAST codes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createFastCode(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from("fast_codes")
        .insert([{
          code: formData.code.toUpperCase(),
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
        }])
        .select();

      if (error) throw error;
      if (data) {
        setFastCodes([data[0], ...fastCodes]);
        setFormData({ code: "", name: "", phone: "", email: "" });
        setShowForm(false);
      }
    } catch (error) {
      console.error("Error creating FAST code:", error);
      alert("Error creating FAST code. Code may already exist.");
    }
  }

  async function deleteFastCode(id: string) {
    if (!confirm("Are you sure you want to delete this FAST Code?")) return;
    
    try {
      const { error } = await supabase
        .from("fast_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setFastCodes(fastCodes.filter(fc => fc.id !== id));
    } catch (error) {
      console.error("Error deleting FAST code:", error);
    }
  }

  const filteredFastCodes = fastCodes.filter(fc =>
    fc.code.toLowerCase().includes(search.toLowerCase()) ||
    fc.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">FAST Codes</h1>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
          />
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {showForm ? "Cancel" : "Add FAST Code"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Create New FAST Code</h2>
          <form onSubmit={createFastCode} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black uppercase"
                placeholder="FAST001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                placeholder="(555) 000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                placeholder="john@example.com"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create FAST Code
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredFastCodes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Code</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFastCodes.map((fc) => (
                  <tr key={fc.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold">{fc.code}</td>
                    <td className="py-3 px-4">{fc.name}</td>
                    <td className="py-3 px-4 text-gray-600">{fc.phone || "-"}</td>
                    <td className="py-3 px-4 text-gray-600">{fc.email || "-"}</td>
                    <td className="py-3 px-4 text-gray-500 text-sm">
                      {new Date(fc.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => deleteFastCode(fc.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            {search ? "No FAST codes match your search." : "No FAST codes yet. Create one to get started."}
          </div>
        )}
      </div>
    </div>
  );
}
