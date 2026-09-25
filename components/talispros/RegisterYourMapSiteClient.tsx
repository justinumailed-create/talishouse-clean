"use client";

import { useState, useTransition } from "react";
import {
  MAPSITE_URL_GATE_HEADLINE,
  MAPSITE_URL_GATE_TTL_LABEL,
  normalizeUrlGatePin,
} from "@/lib/talispros/mapsite-url-gate";
import {
  requestMapSiteUrlGateCode,
  unlockMapSiteUrlWithGatePin,
} from "@/lib/talispros/mapsite-url-gate-actions";

export default function RegisterYourMapSiteClient({
  fastCode,
}: {
  fastCode: string;
  /** @deprecated PIN is visitor-generated; kept for call-site compatibility. */
  pinIssued?: boolean;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pendingGenerate, startGenerate] = useTransition();
  const [pendingUnlock, startUnlock] = useTransition();

  function generate() {
    setError("");
    setStatus("");
    startGenerate(async () => {
      const result = await requestMapSiteUrlGateCode(fastCode);
      if (!result.success) {
        setError(result.error || "Could not generate a secure code.");
        return;
      }
      setStatus(
        `Secure code sent to Admin Notifications. Ask admin for the 6-digit code (valid ${result.ttlLabel || MAPSITE_URL_GATE_TTL_LABEL}, single-use).`,
      );
    });
  }

  function unlock() {
    setError("");
    startUnlock(async () => {
      const result = await unlockMapSiteUrlWithGatePin(fastCode, pin);
      if (!result.success || !result.url) {
        setError(result.error || "Could not unlock the URL.");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-md px-5 py-16">
        <h1 className="text-center text-3xl font-semibold tracking-tight text-neutral-900">
          {MAPSITE_URL_GATE_HEADLINE}
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-neutral-500">
          Generate a secure code for Admin Notifications, then enter the code
          they give you to open the payment/listing URL for this Mapsite™.
        </p>

        <div className="mt-8 space-y-4">
          <button
            type="button"
            disabled={pendingGenerate}
            onClick={generate}
            className="flex h-12 w-full items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-sm font-medium text-neutral-900 hover:bg-neutral-100 disabled:opacity-50"
          >
            {pendingGenerate ? "Generating…" : "Generate secure code"}
          </button>

          {status ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {status}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-neutral-500">
              6-digit secure code
            </span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={pin}
              onChange={(event) =>
                setPin(normalizeUrlGatePin(event.target.value))
              }
              className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-center font-mono text-xl tracking-[0.4em] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
              placeholder="••••••"
            />
          </label>
          <button
            type="button"
            disabled={pendingUnlock || pin.length !== 6}
            onClick={unlock}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {pendingUnlock ? "Checking…" : "Open URL"}
          </button>
        </div>
      </div>
    </div>
  );
}
