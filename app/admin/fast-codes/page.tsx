"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import {
  createAdminFastCode,
  deleteAdminFastCode,
  listBuildSystemFastCodes,
  updateAdminFastCode,
} from "@/lib/fast-code-admin-actions";

function displayFastCode(code: string | null | undefined): string {
  return (code ?? "").trim().toUpperCase();
}

function formatStripeDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

interface FastCodeRow {
  id: string;
  code: string;
  source: "build-system";
  type: string;
  request_id: string | null;
  account_type: string | null;
  mapsite_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  timestamp: string;
  paymentSuccessful: boolean;
  stripeTransactionId: string | null;
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
      const result = await listBuildSystemFastCodes();
      const warnings: string[] = [];

      if (!result.success) {
        warnings.push("Build-system FAST codes could not be loaded.");
        console.warn("FAST codes source warning (fast_codes):", toErrorLogObject(result.error));
      }

      setFetchWarnings(warnings);

      const normalizedFastCodes: FastCodeRow[] = (result.data ?? []).map((row) => ({
        id: row.id,
        code: displayFastCode(row.code),
        source: "build-system",
        type: row.type ?? "legacy-fast-code",
        request_id: row.request_id ?? null,
        account_type: row.account_type ?? null,
        mapsite_id: row.mapsite_id ?? null,
        name: null,
        email: row.email ?? null,
        phone: null,
        timestamp: row.assigned_at,
        paymentSuccessful: Boolean(row.paymentSuccessful),
        stripeTransactionId: row.stripeTransactionId ?? null,
      }));

      setFastCodes(normalizedFastCodes);
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
          code: displayFastCode(row.code),
          source: "build-system",
          type: row.type ?? "mapsite",
          request_id: row.request_id ?? null,
          account_type: row.account_type ?? null,
          mapsite_id: row.mapsite_id ?? null,
          name: null,
          email: null,
          phone: null,
          timestamp: row.assigned_at,
          paymentSuccessful: false,
          stripeTransactionId: null,
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
    if (!confirm("Are you sure you want to delete this FAST Code? The connected Mapsite™ and Talisbooks™ bookshelf will also be removed.")) return;

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

  const filteredFastCodes = fastCodes.filter((fc) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const statusLabel = fc.paymentSuccessful ? "succeeded successful" : "incomplete unpaid";
    return (
      displayFastCode(fc.code).toLowerCase().includes(q) ||
      fc.source.toLowerCase().includes(q) ||
      (fc.type ?? "").toLowerCase().includes(q) ||
      (fc.account_type ?? "").toLowerCase().includes(q) ||
      (fc.name ?? "").toLowerCase().includes(q) ||
      (fc.email ?? "").toLowerCase().includes(q) ||
      (fc.phone ?? "").toLowerCase().includes(q) ||
      (fc.stripeTransactionId ?? "").toLowerCase().includes(q) ||
      (fc.request_id ?? "").toLowerCase().includes(q) ||
      statusLabel.includes(q)
    );
  });

  return (
    <div className="text-[#0a2540]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight">
            FAST Codes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading
              ? "Loading…"
              : `${filteredFastCodes.length} result${filteredFastCodes.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#635bff] px-3.5 text-sm font-medium text-white shadow-sm hover:bg-[#5851ea]"
        >
          {showForm ? (
            "Cancel"
          ) : (
            <>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add FAST Code
            </>
          )}
        </button>
      </div>

      <div className="mb-4">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search FAST codes, email, or payment ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-slate-200 bg-white py-0 pl-9 pr-3 text-sm text-[#0a2540] shadow-sm outline-none placeholder:text-slate-400 focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20"
          />
        </label>
      </div>

      {fetchWarnings.length > 0 && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {fetchWarnings.join(" ")}
        </div>
      )}

      {showForm && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold">Create FAST Code</h2>
          <form onSubmit={createFastCode} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="h-9 w-full rounded-md border border-slate-200 px-3 font-mono text-sm uppercase outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20"
                placeholder="RM22"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <input
                type="text"
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20"
                placeholder="mapsite"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Account type</label>
              <input
                type="text"
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20"
                placeholder="root"
              />
            </div>
            <div className="md:col-span-2">
              <p className="mb-3 text-sm text-slate-500">
                If a Mapsite™ already uses this FAST code (for example{" "}
                <span className="font-mono">LRG1</span>), it will be linked
                automatically.
              </p>
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-md bg-[#635bff] px-4 text-sm font-medium text-white hover:bg-[#5851ea]"
              >
                Create FAST Code
              </button>
            </div>
          </form>
        </div>
      )}

      {editingFastCode && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold">
            Edit{" "}
            <span className="font-mono">{displayFastCode(editingFastCode.code)}</span>
          </h2>
          <form onSubmit={saveEdit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <input
                type="text"
                required
                value={editFormData.type}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, type: e.target.value })
                }
                className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20"
                placeholder="mapsite"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Account type
              </label>
              <input
                type="text"
                value={editFormData.accountType}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, accountType: e.target.value })
                }
                className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20"
                placeholder="root"
              />
            </div>
            <div className="flex gap-2 md:col-span-2">
              <button
                type="submit"
                disabled={savingEdit}
                className="inline-flex h-9 items-center rounded-md bg-[#635bff] px-4 text-sm font-medium text-white hover:bg-[#5851ea] disabled:opacity-60"
              >
                {savingEdit ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,34,67,0.04)]">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading FAST codes…</div>
        ) : filteredFastCodes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">FAST code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Payment ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500"> </th>
                </tr>
              </thead>
              <tbody>
                {filteredFastCodes.map((fc) => {
                  const code = displayFastCode(fc.code);
                  const description = [fc.type, fc.account_type]
                    .filter((value) => value && value.trim())
                    .join(" · ");
                  return (
                    <tr
                      key={fc.id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3 align-top">
                        <p className="font-mono text-[15px] font-semibold tracking-wide">
                          {code}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {fc.source === "build-system" ? "Build System" : "Registration"}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top text-slate-600">
                        {description || "—"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="text-slate-700">{fc.email || fc.name || "—"}</p>
                        {fc.request_id ? (
                          <p className="mt-0.5 max-w-[12rem] truncate font-mono text-[11px] text-slate-400" title={fc.request_id}>
                            {fc.request_id}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {fc.paymentSuccessful ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#d6f6e3] px-2 py-[3px] text-xs font-medium text-[#0e6245]">
                            <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                            Succeeded
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-[3px] text-xs font-medium text-slate-500">
                            Incomplete
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top font-mono text-xs text-slate-600">
                        {fc.stripeTransactionId || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-top text-slate-500">
                        {formatStripeDate(fc.timestamp)}
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        {fc.source === "build-system" ? (
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => startEditing(fc)}
                              className="text-sm font-medium text-[#635bff] hover:text-[#4b45c6]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteFastCode(fc.id)}
                              className="text-sm font-medium text-slate-400 hover:text-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-slate-500">
            {search ? "No FAST codes match your search." : "No FAST codes yet. Create one to get started."}
          </div>
        )}
      </div>
    </div>
  );
}
