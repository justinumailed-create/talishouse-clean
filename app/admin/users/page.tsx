"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface FastCodeUser {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<FastCodeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const { data } = await supabase
        .from("fast_codes")
        .select("*")
        .order("created_at", { ascending: false });
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        ...formData, 
        active: true,
        code: formData.code.toUpperCase()
      };
      console.log("FAST CODE INSERT - Payload:", JSON.stringify(payload, null, 2));

      const { error } = await supabase.from("fast_codes").insert([payload]);
      if (error) {
        console.error("FAST CODE INSERT ERROR:", JSON.stringify(error, null, 2));
        return;
      }
      console.log("FAST CODE INSERT SUCCESS");
      
      setShowForm(false);
      setFormData({ name: "", code: "", phone: "", email: "" });
      fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error);
    }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    await supabase.from("fast_codes").update({ active: !currentActive }).eq("id", id);
    setUsers(users.map(u => u.id === id ? { ...u, active: !currentActive } : u));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Users</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#1279c9] text-white px-4 py-2 rounded-lg hover:bg-[#0f6bb1] transition-colors"
        >
          {showForm ? "Cancel" : "Add User"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Add New User</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
              required
            />
            <input
              type="text"
              placeholder="FAST Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black uppercase"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
            />
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors md:col-span-2"
            >
              Create User
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading...</p>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">FAST Code</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50">
                    <td className="py-3 px-4 font-medium">
                      <Link href={`/admin/users/${user.id}`} className="hover:text-blue-600 hover:underline">
                        {user.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{user.code}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.email || "-"}</td>
                    <td className="py-3 px-4 text-gray-600">{user.phone || "-"}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {user.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          View Profile
                        </Link>
                        <button
                          onClick={() => toggleActive(user.id, user.active)}
                          className={`text-sm px-3 py-1 rounded ${
                            user.active
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          {user.active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No users yet. Add your first user to get started.
          </p>
        )}
      </div>
    </div>
  );
}
