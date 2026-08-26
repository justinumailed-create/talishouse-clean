"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  createAdminFastCode,
  deleteAdminFastCode,
  listBuildSystemFastCodes,
  updateAdminFastCode,
} from "@/lib/fast-code-admin-actions";

interface FastCodeRow {
  id: string;
  code: string;
  source: "build-system" | "registration";
  type: string;
  request_id: string | null;
  account_type: string | null;
  mapsite_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  timestamp: string;
}

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
    const obj = err as Record<string, unknown>;
    const ownKeys = Object.getOwnPropertyNames(obj);
    const fromKeys = Object.fromEntries(ownKeys.map((key) => [key, obj[key]]));

    const maybe = obj as {
      code?: unknown;
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      status?: unknown;
      statusText?: unknown;
      stage?: unknown;
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
      stage: maybe.stage ?? null,
      stringValue: String(err),
      constructor: (err as { constructor?: { name?: string } }).constructor?.name ?? "Unknown",
      ownKeys,
      ownProps: fromKeys,
    };

    if (maybe.error) extracted.error = toErrorLogObject(maybe.error);
    if (maybe.cause) extracted.cause = toErrorLogObject(maybe.cause);

    return extracted;
  }

  return { message: String(err) };
}

export default function FastCodesPage() {
  const [fastCodes, setFastCodes] = useState<FastCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fetchWarnings, setFetchWarnings] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    type: "mapsite",
    accountType: "",
  });
  const [editFormData, setEditFormData] = useState({
    type: "mapsite",
    accountType: "",
  });

  useEffect(() => {
    fetchFastCodes();
  }, []);

  async function fetchFastCodes() {
    setFetchWarnings([]);
    try {
      const [fastCodesResult, registrationsResult] = await Promise.allSettled([
        listBuildSystemFastCodes(),
        supabase
          .from("fast_code_registrations")
          .select("id, fast_code, first_name, last_name, email, cell_phone, created_at")
          .order("created_at", { ascending: false }),
      ]);

      const warnings: string[] = [];
      const fastCodesData =
        fastCodesResult.status === "fulfilled" && fastCodesResult.value.success
          ? fastCodesResult.value.data
          : [];
      const fastCodesError =
        fastCodesResult.status === "fulfilled" && !fastCodesResult.value.success
          ? fastCodesResult.value.error
          : fastCodesResult.status === "rejected"
            ? fastCodesResult.reason
            : null;

      if (fastCodesError) {
        warnings.push("Build-system FAST codes could not be loaded.");
        console.warn("FAST codes source warning (fast_codes):", toErrorLogObject(fastCodesError));
      }

      const registrationsData =
        registrationsResult.status === "fulfilled" ? registrationsResult.value.data ?? [] : [];
      const registrationsError =
        registrationsResult.status === "fulfilled"
          ? registrationsResult.value.error
          : registrationsResult.reason;

      if (registrationsError) {
        warnings.push("Registration FAST codes could not be loaded.");
        console.warn(
          "FAST codes source error (fast_code_registrations):",
          toErrorLogObject(registrationsError)
        );
      }

      setFetchWarnings(warnings);

      const normalizedFastCodes: FastCodeRow[] = fastCodesData.map((row) => ({
        id: row.id,
        code: row.code,
        source: "build-system",
        type: row.type ?? "legacy-fast-code",
        request_id: row.request_id ?? null,
        account_type: row.account_type ?? null,
        mapsite_id: row.mapsite_id ?? null,
        name: null,
        email: null,
        phone: null,
        timestamp: row.assigned_at,
      }));

      const normalizedRegistrations: FastCodeRow[] = registrationsData.map((row) => ({
        id: row.id,
        code: row.fast_code,
        source: "registration",
        type: "legacy-registration",
        request_id: null,
        account_type: null,
        mapsite_id: null,
        name: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || null,
        email: row.email ?? null,
        phone: row.cell_phone ?? null,
        timestamp: row.created_at,
      }));

      const combined = [...normalizedFastCodes, ...normalizedRegistrations].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setFastCodes(combined);
    } catch (error) {
      console.warn("FAST codes fetch warning:", toErrorLogObject(error));
    } finally {
      setLoading(false);
    }
  }

  async function createFastCode(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await createAdminFastCode({
        code: formData.code,
        type: formData.type,
        accountType: formData.accountType || null,
      });

      if (!result.success || !result.data) {
        console.error("FAST CODE CREATE INSERT ERROR:", result.error);
        alert(result.error || "Error creating FAST code.");
        return;
      }

      const row = result.data;
      console.log("FAST CODE CREATE INSERT SUCCESS:", JSON.stringify(row, null, 2));

      setFastCodes([
        {
          id: row.id,
          code: row.code,
          source: "build-system",
          type: row.type ?? "mapsite",
          request_id: row.request_id ?? null,
          account_type: row.account_type ?? null,
          mapsite_id: row.mapsite_id ?? null,
          name: null,
          email: null,
          phone: null,
          timestamp: row.assigned_at,
        },
        ...fastCodes,
      ]);
      setFormData({ code: "", type: "mapsite", accountType: "" });
      setShowForm(false);
      void fetchFastCodes();
    } catch (error) {
      console.error("Error creating FAST code:", error);
      alert("Error creating FAST code. Code may already exist.");
    }
  }

  async function deleteFastCode(id: string) {
    if (!confirm("Are you sure you want to delete this FAST Code?")) return;

    try {
      const target = fastCodes.find((fc) => fc.id === id);
      if (!target || target.source !== "build-system") return;

      const result = await deleteAdminFastCode(id);
      if (!result.success) {
        throw new Error(result.error || "Delete failed");
      }

      if (editingId === id) {
        setEditingId(null);
      }
      setFastCodes(fastCodes.filter((fc) => fc.id !== id));
    } catch (error) {
      console.error("Error deleting FAST code:", error);
      alert(error instanceof Error ? error.message : "Error deleting FAST code.");
    }
  }

  function startEditing(fc: FastCodeRow) {
    setShowForm(false);
    setEditingId(fc.id);
    setEditFormData({
      type: fc.type || "mapsite",
      accountType: fc.account_type || "",
    });
  }

  function cancelEditing() {
    setEditingId(null);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;

    setSavingEdit(true);
    try {
      const result = await updateAdminFastCode({
        id: editingId,
        type: editFormData.type,
        accountType: editFormData.accountType || null,
      });

      if (!result.success || !result.data) {
        alert(result.error || "Error updating FAST code.");
        return;
      }

      const row = result.data;
      setFastCodes((current) =>
        current.map((fc) =>
          fc.id === editingId
            ? {
                ...fc,
                type: row.type ?? fc.type,
                account_type: row.account_type ?? null,
                mapsite_id: row.mapsite_id ?? null,
              }
            : fc
        )
      );
      setEditingId(null);
    } catch (error) {
      console.error("Error updating FAST code:", error);
      alert("Error updating FAST code.");
    } finally {
      setSavingEdit(false);
    }
  }

  const editingFastCode = editingId
    ? fastCodes.find((fc) => fc.id === editingId) ?? null
    : null;

  const filteredFastCodes = fastCodes.filter(fc =>
    fc.code.toLowerCase().includes(search.toLowerCase()) ||
    fc.source.toLowerCase().includes(search.toLowerCase()) ||
    (fc.type ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (fc.account_type ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (fc.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (fc.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (fc.phone ?? "").toLowerCase().includes(search.toLowerCase())
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
            onClick={() => {
              setEditingId(null);
              setShowForm(!showForm);
            }}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {showForm ? "Cancel" : "Add FAST Code"}
          </button>
        </div>
      </div>

      {fetchWarnings.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {fetchWarnings.join(" ")}
        </div>
      )}

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <input
                type="text"
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                placeholder="mapsite"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
              <input
                type="text"
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                placeholder="root"
              />
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500 mb-3">
                If a Mapsite™ already uses this FAST code (for example{" "}
                <span className="font-mono">LRG1</span>), it will be linked
                automatically.
              </p>
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

      {editingFastCode && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">
            Edit FAST Code{" "}
            <span className="font-mono">{editingFastCode.code}</span>
          </h2>
          <form onSubmit={saveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <input
                type="text"
                required
                value={editFormData.type}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, type: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                placeholder="mapsite"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type
              </label>
              <input
                type="text"
                value={editFormData.accountType}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, accountType: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                placeholder="root"
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={savingEdit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Source</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Account Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Request ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFastCodes.map((fc) => (
                  <tr key={fc.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold">{fc.code}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                        {fc.source === "build-system" ? "Build System" : "Registration"}
                      </span>
                    </td>
                    <td className="py-3 px-4">{fc.type}</td>
                    <td className="py-3 px-4 text-gray-600">{fc.account_type || "-"}</td>
                    <td className="py-3 px-4 text-gray-600">{fc.name || "-"}</td>
                    <td className="py-3 px-4 text-gray-600">{fc.email || "-"}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">{fc.request_id || "-"}</td>
                    <td className="py-3 px-4 text-gray-500 text-sm">
                      {new Date(fc.timestamp).toLocaleDateString("en-US")}
                    </td>
                    <td className="py-3 px-4">
                      {fc.source === "build-system" ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => startEditing(fc)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteFastCode(fc.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
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
