"use client";

import { useEffect, useState, useMemo } from "react";
import { assignBuildRequest, completeBuildRequest } from "@/lib/build-request-actions";
import {
  listFormsManagerSubmissions,
  updateBuildRequestStatusAdmin,
  updateMapsiteRequestStatusAdmin,
  type FormsManagerBuildMapsiteRow,
  type FormsManagerRow,
  type FormsManagerSource,
} from "@/lib/forms-manager-admin-actions";
import {
  ADPRO_CATEGORY_OPTIONS,
  adproCategoryLabel,
} from "@/lib/talispros/adpro-categories";

type SortKey = "fastCode" | "email" | "accountType" | "status" | "createdAt" | "form";
type SortDir = "asc" | "desc";
type FormFilter = "all" | FormsManagerSource;

const PAGE_SIZE = 15;

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "completed", label: "Completed" },
] as const;

const FORM_FILTERS: { value: FormFilter; label: string }[] = [
  { value: "all", label: "All Forms" },
  { value: "build_mapsite", label: "Build a MapSite™" },
  { value: "registration", label: "Registrations" },
];

function formLabel(row: FormsManagerRow): string {
  return row.source === "build_mapsite" ? "Build a MapSite™" : "Registration";
}

function displayStatus(row: FormsManagerRow): string {
  if (row.source === "registration") {
    if (row.status === "completed") return "completed";
    if (row.status === "assigned" || row.status === "approved") return "assigned";
    return "pending";
  }

  if (row.mapsiteStatus === "completed") return "completed";
  if (
    row.mapsiteStatus === "processing" ||
    row.status === "in_progress" ||
    row.status === "approved"
  ) {
    return "assigned";
  }
  return "pending";
}

function fastCodeForRow(row: FormsManagerRow): string {
  return row.fastCode ?? "—";
}

export default function FormsManagerPage() {
  const [rows, setRows] = useState<FormsManagerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchWarning, setFetchWarning] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formFilter, setFormFilter] = useState<FormFilter>("all");
  const [adproCategoryFilter, setAdproCategoryFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  async function fetchSubmissions() {
    setLoading(true);
    setFetchWarning(null);

    const result = await listFormsManagerSubmissions();
    if (!result.success) {
      setFetchWarning(result.error || "Submissions could not be loaded.");
      setRows([]);
      setLoading(false);
      return;
    }

    const combined: FormsManagerRow[] = [
      ...result.buildMapsite,
      ...result.registrations,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setRows(combined);
    setLoading(false);
  }

  useEffect(() => {
    void fetchSubmissions();
  }, []);

  async function handleResetStatus(requestId: string) {
    const buildResult = await updateBuildRequestStatusAdmin(requestId, "pending");
    const mapsiteResult = await updateMapsiteRequestStatusAdmin(
      requestId,
      "pending"
    );
    if (!buildResult.success || !mapsiteResult.success) {
      alert(
        buildResult.error ||
          mapsiteResult.error ||
          "Failed to reopen submission."
      );
      return;
    }
    await fetchSubmissions();
  }

  async function handleAssign(requestId: string) {
    const associateId = prompt("Enter associate ID to assign this request:");
    if (!associateId) return;
    const result = await assignBuildRequest(requestId, associateId);
    if (result.success) {
      await fetchSubmissions();
    } else {
      alert(`Failed to assign: ${result.error}`);
    }
  }

  async function handleMarkComplete(requestId: string) {
    const result = await completeBuildRequest(requestId);
    if (result.success) {
      await fetchSubmissions();
    } else {
      alert(`Failed to complete: ${result.error}`);
    }
  }

  const filtered = useMemo(() => {
    let result = [...rows];

    if (formFilter !== "all") {
      result = result.filter((row) => row.source === formFilter);
    }

    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter((row) => {
        const code = (row.fastCode ?? "").toLowerCase();
        const accountType = row.accountType.toLowerCase();
        const email = row.email.toLowerCase();
        const regNumber =
          row.source === "registration"
            ? row.registrationNumber.toLowerCase()
            : "";
        return (
          code.includes(q) ||
          accountType.includes(q) ||
          email.includes(q) ||
          regNumber.includes(q)
        );
      });
    }

    if (statusFilter !== "all") {
      result = result.filter((row) => displayStatus(row) === statusFilter);
    }

    if (adproCategoryFilter !== "all") {
      result = result.filter((row) => {
        if (row.source !== "build_mapsite") return false;
        return row.adproCategory === adproCategoryFilter;
      });
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "fastCode":
          cmp = fastCodeForRow(a).localeCompare(fastCodeForRow(b));
          break;
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "accountType":
          cmp = a.accountType.localeCompare(b.accountType);
          break;
        case "form":
          cmp = formLabel(a).localeCompare(formLabel(b));
          break;
        case "status":
          cmp = displayStatus(a).localeCompare(displayStatus(b));
          break;
        case "createdAt":
          cmp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [
    rows,
    search,
    statusFilter,
    formFilter,
    adproCategoryFilter,
    sortKey,
    sortDir,
  ]);

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

  const statusBadge = (row: FormsManagerRow) => {
    const s = displayStatus(row);
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
          <h1 className="text-2xl font-bold text-gray-900">Forms Manager</h1>
          <p className="text-sm text-gray-500 mt-1">
            Build a MapSite™ submissions and registration checkouts
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchSubmissions()}
          className="self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {FORM_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => {
              setFormFilter(f.value);
              setPage(1);
            }}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              formFilter === f.value
                ? "bg-black text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by email, FAST code, or account type..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
        />
        <div className="flex gap-2 flex-wrap">
          <select
            value={adproCategoryFilter}
            onChange={(e) => {
              setAdproCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
          >
            <option value="all">All Adpros Categories</option>
            {ADPRO_CATEGORY_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
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

      {fetchWarning && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {fetchWarning}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col py-3 px-4 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-28" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32 hidden sm:block" />
              </div>
            ))}
          </div>
        ) : paged.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <Th onClick={() => toggleSort("form")}>
                    Form <SortIcon columnKey="form" />
                  </Th>
                  <Th onClick={() => toggleSort("fastCode")}>
                    FAST Code <SortIcon columnKey="fastCode" />
                  </Th>
                  <Th onClick={() => toggleSort("email")}>
                    Email <SortIcon columnKey="email" />
                  </Th>
                  <Th onClick={() => toggleSort("accountType")}>
                    Account <SortIcon columnKey="accountType" />
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
                {paged.map((row, index) => (
                  <tr
                    key={`${row.source}-${row.id}`}
                    className={`border-b border-gray-50 last:border-0 transition-colors hover:bg-gray-50/50 ${
                      index % 2 === 1 ? "bg-gray-50/30" : ""
                    }`}
                  >
                    <td className="py-3 px-4 text-gray-700 text-sm whitespace-nowrap">
                      {formLabel(row)}
                    </td>
                    <td className="py-3 px-4">
                      {row.fastCode ? (
                        <span className="font-mono text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {row.fastCode}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-sm whitespace-nowrap">
                      {row.email}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-sm whitespace-nowrap">
                      <div>{row.accountType || "—"}</div>
                      {row.source === "build_mapsite" && row.adproCategory ? (
                        <div className="text-xs text-gray-400">
                          {adproCategoryLabel(row.adproCategory)}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3 px-4">{statusBadge(row)}</td>
                    <td className="py-3 px-4 text-gray-500 text-sm whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      {row.source === "build_mapsite" ? (
                        <BuildMapsiteActions
                          row={row}
                          onAssign={handleAssign}
                          onComplete={handleMarkComplete}
                          onReopen={handleResetStatus}
                          displayStatus={displayStatus(row)}
                        />
                      ) : (
                        <span className="text-xs text-gray-400">Checkout complete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <h3 className="text-base font-medium text-gray-900">No submissions</h3>
            <p className="text-sm text-gray-500 text-center mt-1">
              {search || statusFilter !== "all" || formFilter !== "all"
                ? "No submissions match your filters."
                : "Build a MapSite™ and registration submissions will appear here."}
            </p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <p className="text-gray-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-1">
            <PageButton
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              label="Previous"
            />
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

function BuildMapsiteActions({
  row,
  displayStatus,
  onAssign,
  onComplete,
  onReopen,
}: {
  row: FormsManagerBuildMapsiteRow;
  displayStatus: string;
  onAssign: (id: string) => void;
  onComplete: (id: string) => void;
  onReopen: (id: string) => void;
}) {
  return (
    <div className="flex gap-1.5 justify-end whitespace-nowrap">
      {displayStatus === "pending" && (
        <ActionButton
          onClick={() => onAssign(row.id)}
          label="Assign"
          className="bg-blue-600 text-white hover:bg-blue-700"
        />
      )}
      {displayStatus !== "completed" ? (
        <ActionButton
          onClick={() => onComplete(row.id)}
          label="Complete"
          className="bg-green-100 text-green-700 hover:bg-green-200"
        />
      ) : (
        <ActionButton
          onClick={() => onReopen(row.id)}
          label="Reopen"
          className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
        />
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
      type="button"
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
  disabled,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[32px] px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
        disabled
          ? "text-gray-300 cursor-not-allowed"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}
