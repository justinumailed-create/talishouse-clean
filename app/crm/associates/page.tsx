"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getPermissions } from "@/lib/permissions";

interface AssociateRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  fast_code: string;
  created_at: string;
}

export default function CrmAssociatesPage() {
  const [associates, setAssociates] = useState<AssociateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const perms = getPermissions("associates");

  useEffect(() => {
    supabase
      .from("users")
      .select("id, name, email, phone, fast_code, created_at")
      .eq("role", "associate")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAssociates((data || []) as AssociateRecord[]);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Associates</h1>
      <p className="text-sm text-gray-500 mb-6">Registered associates and their FAST codes</p>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-neutral-400">Loading...</div>
        ) : associates.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-400">No associates found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">FAST Code</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Phone</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody>
                {associates.map((a, i) => (
                  <tr key={a.id} className={`border-b border-neutral-50 hover:bg-neutral-50/50 ${i % 2 === 1 ? "bg-neutral-50/30" : ""}`}>
                    <td className="py-3 px-4 font-medium text-neutral-900">{a.name}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{a.fast_code}</span>
                    </td>
                    <td className="py-3 px-4 text-neutral-500 hidden sm:table-cell">{a.email || "—"}</td>
                    <td className="py-3 px-4 text-neutral-500 hidden md:table-cell">{a.phone || "—"}</td>
                    <td className="py-3 px-4 text-neutral-500 text-xs">{new Date(a.created_at).toLocaleDateString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!perms.canView && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
          You do not have permission to view associate details.
        </div>
      )}
    </div>
  );
}
