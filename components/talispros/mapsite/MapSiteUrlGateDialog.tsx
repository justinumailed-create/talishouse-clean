"use client";

import { useEffect, useId, useState, useTransition } from "react";
import {
  MAPSITE_URL_GATE_HEADLINE,
  MAPSITE_URL_GATE_TTL_LABEL,
  normalizeUrlGatePin,
} from "@/lib/talispros/mapsite-url-gate";
import {
  requestMapSiteUrlGateCode,
  unlockMapSiteUrlWithGatePin,
} from "@/lib/talispros/mapsite-url-gate-actions";

export default function MapSiteUrlGateDialog({
  open,
  fastCode,
  onClose,
}: {
  open: boolean;
  fastCode: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [generated, setGenerated] = useState(false);
  const [pendingGenerate, startGenerate] = useTransition();
  const [pendingUnlock, startUnlock] = useTransition();

  useEffect(() => {
    if (!open) return;
    setPin("");
    setError("");
    setStatus("");
    setGenerated(false);
  }, [open, fastCode]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function generate() {
    setError("");
    setStatus("");
    startGenerate(async () => {
      const result = await requestMapSiteUrlGateCode(fastCode);
      if (!result.success) {
        setError(result.error || "Could not generate a secure code.");
        return;
      }
      setGenerated(true);
      setStatus(
        `Secure code generated and sent to Admin Notifications. Ask admin for the 6-digit code (valid ${result.ttlLabel || MAPSITE_URL_GATE_TTL_LABEL}, single-use).`,
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
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id={titleId}
              className="m-0 text-lg font-semibold tracking-tight text-neutral-900"
            >
              {MAPSITE_URL_GATE_HEADLINE}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-500">
              Payment and listing links stay locked until a secure code from
              Global Admin is entered.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg leading-none text-neutral-500 hover:bg-neutral-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            disabled={pendingGenerate}
            onClick={generate}
            className="flex h-11 w-full items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-sm font-medium text-neutral-900 hover:bg-neutral-100 disabled:opacity-50"
          >
            {pendingGenerate
              ? "Generating…"
              : generated
                ? "Generate a new secure code"
                : "Generate secure code"}
          </button>

          {status ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-800">
              {status}
            </p>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">
              {error}
            </p>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-neutral-500">
              Enter 6-digit secure code
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
            className="flex h-11 w-full items-center justify-center rounded-xl bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {pendingUnlock ? "Checking…" : "Open URL"}
          </button>

          <p className="text-[11px] leading-relaxed text-neutral-400">
            Codes appear under Admin → Notifications with FAST Code and time.
            Each code works once and expires after {MAPSITE_URL_GATE_TTL_LABEL}.
          </p>
        </div>
      </div>
    </div>
  );
}
