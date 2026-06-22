"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { assignBuildRequest, completeBuildRequest } from "@/lib/build-request-actions";

type SortKey = "fastCode" | "name" | "email" | "type" | "status" | "createdAt";
type SortDir = "asc" | "desc";

interface FastCodeRow {
  id: string;
  code: string;
}

interface MapsiteRow {
  id: string;
  type: string;
  status: string;
  assigned_to: string | null;
}

interface BuildRequestRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  account_type: string;
  address: string;
  status: string;
  created_at: string;
  fast_code: FastCodeRow | null;
  mapsite: MapsiteRow | null;
}

const PAGE_SIZE = 15;

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "completed", label: "Completed" },
] as const;

export default function BuildRequestsPage() {
  const [requests, setRequests] = useState<BuildRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    try {
      const { data: buildData, error } = await supabase
        .from("build_requests")
        .select("id, first_name, last_name, email, phone, account_type, address, status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const buildRequests: BuildRequestRow[] = (buildData || []).map((br) => ({
        ...br,
        fast_code: null,
        mapsite: null,
      }));

      if (buildRequests.length > 0) {
        const ids = buildRequests.map((br) => br.id);

        const { data: fcData } = await supabase
          .from("fast_codes")
          .select("id, code, request_id")
          .in("request_id", ids);

        const fcMap: Record<string, FastCodeRow> = {};
        if (fcData) {
          fcData.forEach((fc) => {
            fcMap[fc.request_id] = { id: fc.id, code: fc.code };
          });
        }

        const { data: msData } = await supabase
          .from("mapsite_requests")
          .select("id, request_id, type, status, assigned_to")
          .in("request_id", ids);

        const msMap: Record<string, MapsiteRow> = {};
        if (msData) {
          msData.forEach((ms) => {
            msMap[ms.request_id] = {
              id: ms.id,
              type: ms.type,
              status: ms.status,
              assigned_to: ms.assigned_to,
            };
          });
        }

        buildRequests.forEach((br) => {
          br.fast_code = fcMap[br.id] || null;
          br.mapsite = msMap[br.id] || null;
        });
      }

      setRequests(buildRequests);
    } catch (err) {
      console.error("Error fetching build requests:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateBuildStatus(id: string, status: string) {
    try {
      const { error } = await supabase
        .from("build_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch (err) {
      console.error("Error updating status:", err);
    }
  }

  async function updateMapsiteStatus(requestId: string, status: string) {
    try {
      const { error } = await supabase
        .from("mapsite_requests")
        .update({ status })
        .eq("request_id", requestId);
      if (error) throw error;
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId && r.mapsite
            ? { ...r, mapsite: { ...r.mapsite, status } }
            : r
        )
      );
    } catch (err) {
      console.error("Error updating mapsite status:", err);
    }
  }

  const displayStatus = (r: BuildRequestRow): string => {
    if (r.mapsite?.status === "completed") return "completed";
    if (r.mapsite?.status === "processing" || r.status === "in_progress" || r.status === "approved")
      return "assigned";
    return "pending";
  };

  const filtered = useMemo(() => {
    let result = [...requests];

    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (r) =>
          `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.fast_code?.code || "").toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((r) => displayStatus(r) === statusFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "fastCode":
          cmp = (a.fast_code?.code || "").localeCompare(b.fast_code?.code || "");
          break;
        case "name":
          cmp = `${a.first_name} ${a.last_name}`.localeCompare(
            `${b.first_name} ${b.last_name}`
          );
          break;
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "type":
          cmp = (a.mapsite?.type || "").localeCompare(b.mapsite?.type || "");
          break;
        case "status":
          cmp = displayStatus(a).localeCompare(displayStatus(b));
          break;
        case "createdAt":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [requests, search, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function SortIcon({ columnKey }: { columnKey: SortKey }) {
    if (sortKey !== columnKey) return <span className="ml-1 text-gray-300">↕</span>;
    return <span className="ml-1 text-gray-600">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  function handleFilterChange(val: string) {
    setStatusFilter(val);
    setPage(1);
  }

  async function handleAssign(requestId: string) {
    const associateId = prompt("Enter associate ID to assign this request:");
    if (!associateId) return;
    const result = await assignBuildRequest(requestId, associateId);
    if (result.success) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: "approved",
                mapsite: r.mapsite
                  ? { ...r.mapsite, assigned_to: associateId, status: "processing" }
                  : null,
              }
            : r
        )
      );
    } else {
      alert(`Failed to assign: ${result.error}`);
    }
  }

  async function handleMarkComplete(requestId: string) {
    const result = await completeBuildRequest(requestId);
    if (result.success) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: "completed", mapsite: r.mapsite ? { ...r.mapsite, status: "completed" } : null }
            : r
        )
      );
    } else {
      alert(`Failed to complete: ${result.error}`);
    }
  }

  async function handleResetStatus(requestId: string) {
    await updateBuildStatus(requestId, "pending");
    await updateMapsiteStatus(requestId, "pending");
  }

  const statusBadge = (r: BuildRequestRow) => {
    const s = displayStatus(r);
    switch (s) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            Pending
          </span>
        );
      case "assigned":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Assigned
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Completed
          </span>
        );
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Build Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage MapSite build requests from the form
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or FAST code..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
        />
        <div className="flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-black text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col py-3 px-4 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-28" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32 hidden sm:block" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16 hidden md:block" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-18" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-14" />
                <div className="h-6 bg-gray-200 rounded animate-pulse w-24 ml-auto" />
              </div>
            ))}
          </div>
        ) : paged.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <Th onClick={() => toggleSort("fastCode")}>
                    Fast Code <SortIcon columnKey="fastCode" />
                  </Th>
                  <Th onClick={() => toggleSort("name")}>
                    Name <SortIcon columnKey="name" />
                  </Th>
                  <Th onClick={() => toggleSort("email")}>
                    Email <SortIcon columnKey="email" />
                  </Th>
                  <Th onClick={() => toggleSort("type")} className="hidden md:table-cell">
                    Type <SortIcon columnKey="type" />
                  </Th>
                  <Th onClick={() => toggleSort("status")}>
                    Status <SortIcon columnKey="status" />
                  </Th>
                  <Th onClick={() => toggleSort("createdAt")}>
                    Created <SortIcon columnKey="createdAt" />
                  </Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {paged.map((r, index) => (
                  <tr
                    key={r.id}
                    className={`border-b border-gray-50 last:border-0 transition-colors hover:bg-gray-50/50 ${
                      index % 2 === 1 ? "bg-gray-50/30" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      {r.fast_code ? (
                        <span className="font-mono text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {r.fast_code.code}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
                      {r.first_name} {r.last_name}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-sm whitespace-nowrap">
                      {r.email}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-sm hidden md:table-cell">
                      {r.mapsite?.type || r.account_type || "—"}
                    </td>
                    <td className="py-3 px-4">{statusBadge(r)}</td>
                    <td className="py-3 px-4 text-gray-500 text-sm whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5 justify-end whitespace-nowrap">
                        {displayStatus(r) === "pending" && (
                          <ActionButton
                            onClick={() => handleAssign(r.id)}
                            label="Assign"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                          />
                        )}
                        <ActionButton
                          onClick={() =>
                            window.open(`/admin/build-requests/${r.id}`, "_blank")
                          }
                          label="View"
                          className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                        />
                        <ActionButton
                          onClick={() =>
                            window.open(`/admin/build-requests/${r.id}/edit`, "_blank")
                          }
                          label="Edit"
                          className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                        />
                        {displayStatus(r) !== "completed" ? (
                          <ActionButton
                            onClick={() => handleMarkComplete(r.id)}
                            label="Complete"
                            className="bg-green-100 text-green-700 hover:bg-green-200"
                          />
                        ) : (
                          <ActionButton
                            onClick={() => handleResetStatus(r.id)}
                            label="Reopen"
                            className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <svg
              className="w-12 h-12 text-gray-300 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-base font-medium text-gray-900">No build requests</h3>
            <p className="text-sm text-gray-500 text-center mt-1">
              {search || statusFilter !== "all"
                ? "No requests match your filters."
                : "Build requests from the MapSite form will appear here."}
            </p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <p className="text-gray-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </p>
          <div className="flex gap-1">
            <PageButton
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              label="Previous"
            />
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <PageButton
                  key={pageNum}
                  active={page === pageNum}
                  onClick={() => setPage(pageNum)}
                  label={String(pageNum)}
                />
              );
            })}
            <PageButton
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              label="Next"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <th
      onClick={onClick}
      className={`text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider select-none ${
        onClick ? "cursor-pointer hover:text-gray-700" : ""
      } ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function ActionButton({
  onClick,
  label,
  className,
}: {
  onClick: () => void;
  label: string;
  className: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-md transition-colors ${className}`}
    >
      {label}
    </button>
  );
}

function PageButton({
  onClick,
  label,
  active,
  disabled,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[32px] px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active
          ? "bg-black text-white"
          : disabled
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}
