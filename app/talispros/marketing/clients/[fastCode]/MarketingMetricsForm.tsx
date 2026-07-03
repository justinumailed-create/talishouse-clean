"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertDailyMetrics } from "@/lib/marketing-metrics-actions";

const PIPELINE_OPTIONS = [
  { value: "prospecting", label: "Prospecting" },
  { value: "active", label: "Active" },
  { value: "nurturing", label: "Nurturing" },
  { value: "under_contract", label: "Under Contract" },
  { value: "closed", label: "Closed" },
];

interface MarketingMetricsFormProps {
  fastCode: string;
  defaultDate: string;
}

export default function MarketingMetricsForm({
  fastCode,
  defaultDate,
}: MarketingMetricsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    reportDate: defaultDate,
    facebookImpressions: 0,
    instagramImpressions: 0,
    totalReach: 0,
    emailsReceived: 0,
    textsReceived: 0,
    pipelineStatus: "active",
    checklistNotes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const result = await upsertDailyMetrics({
        fastCode,
        ...form,
      });

      if (!result.success) {
        setError(result.error || "Unable to save metrics.");
        return;
      }

      setSuccess(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="reportDate" className="block text-sm font-medium text-neutral-700 mb-1.5">
          Report Date
        </label>
        <input
          id="reportDate"
          type="date"
          value={form.reportDate}
          onChange={(e) => setForm((prev) => ({ ...prev, reportDate: e.target.value }))}
          className="w-full h-11 px-4 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-900"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(
          [
            ["facebookImpressions", "Facebook Impressions"],
            ["instagramImpressions", "Instagram Impressions"],
            ["totalReach", "Total Reach"],
            ["emailsReceived", "Emails Received"],
            ["textsReceived", "Texts Received"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <label htmlFor={key} className="block text-sm font-medium text-neutral-700 mb-1.5">
              {label}
            </label>
            <input
              id={key}
              type="number"
              min={0}
              value={form[key]}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  [key]: Number(e.target.value) || 0,
                }))
              }
              className="w-full h-11 px-4 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-900"
              required
            />
          </div>
        ))}
      </div>

      <div>
        <label htmlFor="pipelineStatus" className="block text-sm font-medium text-neutral-700 mb-1.5">
          Pipeline Status
        </label>
        <select
          id="pipelineStatus"
          value={form.pipelineStatus}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, pipelineStatus: e.target.value }))
          }
          className="w-full h-11 px-4 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-900"
        >
          {PIPELINE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="checklistNotes" className="block text-sm font-medium text-neutral-700 mb-1.5">
          Daily Checklist Notes
        </label>
        <textarea
          id="checklistNotes"
          value={form.checklistNotes}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, checklistNotes: e.target.value }))
          }
          rows={4}
          placeholder="What was completed today?"
          className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-900 resize-y"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? (
        <p className="text-sm text-green-600">Metrics saved successfully.</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="h-11 px-5 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Post Daily Update"}
      </button>
    </form>
  );
}
