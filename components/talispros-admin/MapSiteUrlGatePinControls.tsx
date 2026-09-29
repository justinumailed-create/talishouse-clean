"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  isMapsiteUrlGateExempt,
  MAPSITE_URL_GATE_TTL_LABEL,
  resolveMapsiteListingUrl,
} from "@/lib/talispros/mapsite-url-gate";
import { issueMapSiteUrlGatePin } from "@/lib/talispros/mapsite-url-gate-actions";

export default function MapSiteUrlGatePinControls({
  fastCode,
  issuedAt: initialIssuedAt,
  disabled,
  brokerUrl,
}: {
  fastCode: string;
  issuedAt?: string | null;
  disabled?: boolean;
  /** Optional stored broker URL — used only to display the effective listing URL when exempt. */
  brokerUrl?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [issuedAt, setIssuedAt] = useState(initialIssuedAt ?? null);
  const [pin, setPin] = useState<string | null>(null);
  const [error, setError] = useState("");
  const exempt = isMapsiteUrlGateExempt(fastCode);
  const listingUrl = resolveMapsiteListingUrl(fastCode, brokerUrl);

  function issue() {
    setError("");
    startTransition(async () => {
      const result = await issueMapSiteUrlGatePin(fastCode);
      if (!result.success) {
        setError(result.error || "Could not issue a secure code.");
        return;
      }
      setPin(result.pin ?? null);
      setIssuedAt(result.issuedAt ?? new Date().toISOString());
    });
  }

  if (exempt) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 space-y-2">
        <p className="text-sm font-medium text-neutral-900">URL secure code</p>
        <p className="text-xs text-neutral-600">
          URL gate is disabled for FAST{" "}
          <span className="font-mono uppercase">{fastCode.trim()}</span>. The
          published URL button opens the listing link directly (no Admin
          Notifications code).
        </p>
        {listingUrl ? (
          <a
            href={listingUrl}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-xs font-medium text-neutral-900 underline hover:text-neutral-700"
          >
            {listingUrl}
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 space-y-2">
      <p className="text-sm font-medium text-neutral-900">URL secure code</p>
      <p className="text-xs text-neutral-500">
        Visitors who tap URL on the published Mapsite™ generate a 6-digit code.
        The code ships to{" "}
        <Link href="/admin/notifications" className="underline hover:text-neutral-800">
          Notifications
        </Link>{" "}
        (valid {MAPSITE_URL_GATE_TTL_LABEL}, single-use). You can also generate
        one here while on a call.
      </p>
      {issuedAt ? (
        <p className="text-xs text-neutral-600">
          Last code {new Date(issuedAt).toLocaleString()}. Generating replaces
          any unused code.
        </p>
      ) : (
        <p className="text-xs text-neutral-600">No secure code generated yet.</p>
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
        {pending ? "Generating…" : issuedAt ? "Generate new code" : "Generate URL code"}
      </button>
    </div>
  );
}
