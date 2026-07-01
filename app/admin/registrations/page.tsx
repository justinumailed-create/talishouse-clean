"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type RegistrationRow = {
  id: string;
  email: string;
  account_type: string;
  fast_code: string;
  amount_paid: number;
  registration_number: string;
  status: string;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  created_at: string;
};

function toErrorLogObject(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...Object.fromEntries(
        Object.getOwnPropertyNames(err).map((key) => [key, Reflect.get(err, key)])
      ),
    };
  }

  if (typeof err === "object" && err !== null) {
    const maybe = err as {
      code?: unknown;
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      status?: unknown;
      statusText?: unknown;
      error?: unknown;
      cause?: unknown;
    };

    const extracted: Record<string, unknown> = {
      code: maybe.code ?? null,
      message: maybe.message ?? null,
      details: maybe.details ?? null,
      hint: maybe.hint ?? null,
      status: maybe.status ?? null,
      statusText: maybe.statusText ?? null,
      stringValue: String(err),
    };
    if (maybe.error) extracted.error = toErrorLogObject(maybe.error);
    if (maybe.cause) extracted.cause = toErrorLogObject(maybe.cause);
    return extracted;
  }

  return { message: String(err) };
}

export default function RegistrationsPage() {
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchWarning, setFetchWarning] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  async function fetchRegistrations() {
    setLoading(true);
    setFetchWarning(null);
    try {
      const { data, error } = await supabase
        .from("registrations")
        .select(
          "id, email, account_type, fast_code, amount_paid, registration_number, status, paypal_order_id, paypal_capture_id, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRows((data || []) as RegistrationRow[]);
    } catch (err) {
      console.warn("Registrations fetch warning:", toErrorLogObject(err));
      setFetchWarning("Registrations could not be loaded right now.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const passesStatus = statusFilter === "all" || row.status === statusFilter;
      if (!passesStatus) return false;
      if (!q) return true;
      return (
        row.email.toLowerCase().includes(q) ||
        row.fast_code.toLowerCase().includes(q) ||
        row.registration_number.toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter]);

  const markableRows = filteredRows.filter((row) => row.status !== "completed");

  async function markPurchaseCompleted(id: string) {
    const { error } = await supabase.from("registrations").update({ status: "completed" }).eq("id", id);
    if (error) {
      console.error("Error updating registration:", error);
      return;
    }

    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status: "completed" } : row)));
  }

  async function markAllPurchasesCompleted() {
    if (markableRows.length === 0) return;
    setBulkLoading(true);

    try {
      const ids = markableRows.map((row) => row.id);
      const { error } = await supabase.from("registrations").update({ status: "completed" }).in("id", ids);
      if (error) throw error;

      setRows((prev) =>
        prev.map((row) => (ids.includes(row.id) ? { ...row, status: "completed" } : row))
      );
    } catch (err) {
      console.error("Error marking all purchases as completed:", err);
    } finally {
      setBulkLoading(false);
    }
  }

  const completedCount = rows.filter((row) => row.status === "completed").length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registrations</h1>
          <p className="text-sm text-gray-500 mt-1">Review registrations and mark purchases as completed.</p>
        </div>
        <button
          onClick={markAllPurchasesCompleted}
          disabled={bulkLoading || markableRows.length === 0}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-black text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {bulkLoading ? "Updating..." : `Mark All Purchases (${markableRows.length})`}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Total" value={String(rows.length)} />
        <SummaryCard label="Completed" value={String(completedCount)} />
        <SummaryCard label="Pending" value={String(rows.length - completedCount)} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          placeholder="Search by email, FAST code, or registration #"
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {fetchWarning && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {fetchWarning}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading registrations...</div>
        ) : filteredRows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search || statusFilter !== "all" ? "No registrations match your filters." : "No registrations yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Registration #</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">FAST Code</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-700">{row.registration_number}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{row.email}</td>
                    <td className="py-3 px-4 text-sm font-mono text-blue-600">{row.fast_code}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{row.account_type}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">${row.amount_paid.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          row.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {row.status === "completed" ? (
                        <span className="text-xs text-gray-400">Completed</span>
                      ) : (
                        <button
                          onClick={() => markPurchaseCompleted(row.id)}
                          className="text-xs px-2.5 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                        >
                          Mark Completed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
