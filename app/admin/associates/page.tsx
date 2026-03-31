import React from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

async function getAssociates() {
  try {
    const { data, error } = await supabase
      .from("associates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error fetching associates:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Unexpected error fetching associates:", err);
    return [];
  }
}

export default async function AssociatesPage() {
  const data = await getAssociates();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Associates
        </h1>

        <Link
          href="/admin/associates/new"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
        >
          Create Associate
        </Link>
      </div>

      {!data || data.length === 0 ? (
        <div className="border border-gray-200 rounded-xl p-6 text-center text-gray-500">
          No associates yet.
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((a: any) => (
            <div
              key={a.id}
              className="bg-white border border-gray-200 rounded-xl p-5 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-gray-900">{a.name}</p>
                <p className="text-sm text-gray-500">{a.email}</p>
              </div>

              <div className="text-right flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    {a.fast_code}
                  </p>
                  <p className="text-xs text-gray-400">
                    {a.created_at ? new Date(a.created_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                {a.id ? (
                  <Link
                    href={`/admin/associates/${a.id}`}
                    className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Edit
                  </Link>
                ) : (
                  <span className="text-xs text-red-500">Invalid ID</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
