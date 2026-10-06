"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { normalizeUrlGatePin } from "@/lib/talispros/mapsite-url-gate";
import { useT } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/format";
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
  const t = useT();
  const u = t.mapsite.urlGate;
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
        setError(result.error || u.errGenerate);
        return;
      }
      setGenerated(true);
      setStatus(
        fmt(u.generated, { ttl: u.ttl }),
      );
    });
  }

  function unlock() {
    setError("");
    startUnlock(async () => {
      const result = await unlockMapSiteUrlWithGatePin(fastCode, pin);
      if (!result.success || !result.url) {
        setError(result.error || u.errUnlock);
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
              {u.headline}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-500">
              {u.intro}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg leading-none text-neutral-500 hover:bg-neutral-100"
            aria-label={t.mapsite.close}
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
              ? u.generating
              : generated
                ? u.generateNew
                : u.generate}
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
              {u.codeLabel}
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
            {pendingUnlock ? u.checking : u.open}
          </button>

          <p className="text-[11px] leading-relaxed text-neutral-400">
            {fmt(u.footnote, { ttl: u.ttl })}
          </p>
        </div>
      </div>
    </div>
  );
}
