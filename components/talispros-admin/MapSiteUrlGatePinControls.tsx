"use client";

import { useState, useTransition } from "react";
import { issueMapSiteUrlGatePin } from "@/lib/talispros/mapsite-url-gate-actions";

export default function MapSiteUrlGatePinControls({
  fastCode,
  issuedAt: initialIssuedAt,
  disabled,
}: {
  fastCode: string;
  issuedAt?: string | null;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [issuedAt, setIssuedAt] = useState(initialIssuedAt ?? null);
  const [pin, setPin] = useState<string | null>(null);
  const [error, setError] = useState("");

  function issue() {
    setError("");
    startTransition(async () => {
      const result = await issueMapSiteUrlGatePin(fastCode);
      if (!result.success) {
        setError(result.error || "Could not issue a PIN.");
        return;
      }
      setPin(result.pin ?? null);
      setIssuedAt(result.issuedAt ?? new Date().toISOString());
    });
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 space-y-2">
      <p className="text-sm font-medium text-neutral-900">URL gate PIN</p>
      <p className="text-xs text-neutral-500">
        Visitors who tap URL on the pin card must enter a 6-digit PIN you issue
        here before the submitted listing URL opens.
      </p>
      {issuedAt ? (
        <p className="text-xs text-neutral-600">
          PIN authorized {new Date(issuedAt).toLocaleString()}. Issue a new PIN
          to replace it.
        </p>
      ) : (
        <p className="text-xs text-neutral-600">No PIN issued yet.</p>
      )}
      {pin ? (
        <p className="rounded-lg bg-white px-3 py-2 font-mono text-lg tracking-[0.35em] text-neutral-900">
          {pin}
        </p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <button
        type="button"
        disabled={disabled || pending}
        onClick={issue}
        className="inline-flex h-10 items-center rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Issuing…" : issuedAt ? "Issue new PIN" : "Issue URL PIN"}
      </button>
    </div>
  );
}
