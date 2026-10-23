"use client";

import { useState } from "react";
import { exportLeadsAction } from "@/app/admin/agent/leads/actions";
import { secondaryButton } from "@/components/admin/agents/ui";
import type { LeadListFilters } from "@/lib/crm-leads/model";

export default function ExportLeadsButton({
  filters,
  label,
  emptyLabel,
}: {
  filters: LeadListFilters;
  label: string;
  emptyLabel: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function download() {
    setPending(true);
    setMessage(null);
    try {
      const result = await exportLeadsAction(filters);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      const lines = result.csv.trim().split("\n");
      if (lines.length <= 1) {
        setMessage(emptyLabel);
        return;
      }
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const day = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `${day}-brokerage-leads.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button type="button" className={secondaryButton} onClick={download} disabled={pending}>
        {label}
      </button>
      {message ? <span className="mt-1 text-xs text-neutral-500">{message}</span> : null}
    </span>
  );
}
