"use client";

import { useState, useTransition } from "react";
import { Gift, Loader2 } from "lucide-react";
import {
  grantMapSiteFreePinsAction,
  lookupMapSiteFreePinsAction,
  type FreePinAdminActionResult,
} from "@/lib/talispros/mapsite-free-pin-admin-actions";
import type {
  FreePinAdminSnapshot,
  FreePinGrantRecord,
} from "@/lib/talispros/mapsite-additional-pins-service";
import {
  MAPSITE_MAX_FREE_PIN_CREDITS,
  MAPSITE_MAX_PIN_COUNT,
  formatAdditionalPinMoneyFromCents,
  MAPSITE_ADDITIONAL_PIN_PRICE_CENTS,
} from "@/lib/talispros/mapsite-additional-pins";

type Props = {
  /** Pre-filled FAST Code™ (Mapsite editor). */
  fastCode?: string;
  /** Hide the FAST Code™ field and always act on `fastCode`. */
  lockFastCode?: boolean;
  initialSnapshot?: FreePinAdminSnapshot | null;
  initialGrants?: FreePinGrantRecord[];
  disabled?: boolean;
};

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const inputClass =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";

export default function AdminFreePinCreditsPanel({
  fastCode: initialFastCode = "",
  lockFastCode = false,
  initialSnapshot = null,
  initialGrants = [],
  disabled = false,
}: Props) {
  const [fastCode, setFastCode] = useState(initialFastCode);
  const [count, setCount] = useState(1);
  const [note, setNote] = useState("");
  const [snapshot, setSnapshot] = useState<FreePinAdminSnapshot | null>(initialSnapshot);
  const [grants, setGrants] = useState<FreePinGrantRecord[]>(initialGrants);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const code = (lockFastCode ? initialFastCode : fastCode).trim();
  const safeCount = Math.min(Math.max(Math.trunc(count) || 1, 1), MAPSITE_MAX_FREE_PIN_CREDITS);

  function apply(result: FreePinAdminActionResult, okMessage?: string) {
    if (!result.success) {
      setError(result.error || "Something went wrong.");
      setMessage(null);
      return;
    }
    setError(null);
    if (result.snapshot !== undefined) setSnapshot(result.snapshot ?? null);
    if (result.grants) setGrants(result.grants);
    setMessage(okMessage ?? null);
  }

  function lookup() {
    if (!code) {
      setError("Enter a FAST Code™.");
      return;
    }
    startTransition(async () => {
      apply(await lookupMapSiteFreePinsAction(code));
    });
  }

  function grant(sign: 1 | -1) {
    if (!code) {
      setError("Enter a FAST Code™.");
      return;
    }
    const delta = sign * safeCount;
    startTransition(async () => {
      const result = await grantMapSiteFreePinsAction({ fastCode: code, count: delta, note });
      const applied = result.applied ?? delta;
      const label = Math.abs(applied) === 1 ? "free PIN" : "free PINs";
      apply(
        result,
        applied > 0
          ? `Granted ${applied} ${label} to ${result.snapshot?.fastCode?.toUpperCase() || code.toUpperCase()}.`
          : `Removed ${Math.abs(applied)} ${label} from ${result.snapshot?.fastCode?.toUpperCase() || code.toUpperCase()}.`,
      );
      if (result.success) setNote("");
    });
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
      <div className="flex items-start gap-3">
        <Gift className="mt-0.5 h-5 w-5 text-emerald-600" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Free additional PINs</h2>
          <p className="text-sm text-neutral-500">
            Give a FAST Code™ free extra Mapsite PINs (normally{" "}
            {formatAdditionalPinMoneyFromCents(MAPSITE_ADDITIONAL_PIN_PRICE_CENTS)} CAD each).
            The owner&apos;s PIN Dashboard uses free credits first; any remainder goes through
            Stripe at the normal CAD price. Max {MAPSITE_MAX_FREE_PIN_CREDITS} credits,{" "}
            {MAPSITE_MAX_PIN_COUNT} PINs per Mapsite.
          </p>
        </div>
      </div>

      {message ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1.5fr)]">
        {lockFastCode ? (
          <div className="text-sm">
            <span className="block text-xs font-medium text-neutral-600">FAST Code™</span>
            <span className="mt-1 block font-mono text-sm uppercase">{code}</span>
          </div>
        ) : (
          <label className="block text-xs font-medium text-neutral-600">
            FAST Code™
            <div className="mt-1 flex gap-2">
              <input
                className={`${inputClass} font-mono uppercase`}
                value={fastCode}
                onChange={(event) => setFastCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    lookup();
                  }
                }}
                placeholder="e.g. RM22"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={lookup}
                disabled={pending}
                className="shrink-0 rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                Check
              </button>
            </div>
          </label>
        )}
        <label className="block text-xs font-medium text-neutral-600">
          Free PINs
          <input
            type="number"
            min={1}
            max={MAPSITE_MAX_FREE_PIN_CREDITS}
            className={`${inputClass} mt-1`}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
          />
        </label>
        <label className="block text-xs font-medium text-neutral-600">
          Note (optional, saved in audit)
          <input
            className={`${inputClass} mt-1`}
            value={note}
            maxLength={500}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Reason, e.g. launch promo"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => grant(1)}
          disabled={pending || disabled || !code}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Grant {safeCount} free PIN{safeCount === 1 ? "" : "s"}
        </button>
        <button
          type="button"
          onClick={() => grant(-1)}
          disabled={pending || disabled || !code || (snapshot?.freePinCredits ?? 0) <= 0}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          Remove {safeCount}
        </button>
        {disabled ? (
          <span className="text-xs text-amber-700">Admin writes are disabled.</span>
        ) : null}
      </div>

      {snapshot ? (
        <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div className="rounded-lg bg-emerald-50 px-3 py-2">
            <dt className="text-xs text-emerald-800">Free PIN balance</dt>
            <dd className="text-lg font-semibold text-emerald-900">{snapshot.freePinCredits}</dd>
          </div>
          <div className="rounded-lg bg-neutral-50 px-3 py-2">
            <dt className="text-xs text-neutral-500">FAST Code™</dt>
            <dd className="font-mono font-semibold uppercase">{snapshot.fastCode}</dd>
          </div>
          <div className="rounded-lg bg-neutral-50 px-3 py-2">
            <dt className="text-xs text-neutral-500">PIN capacity</dt>
            <dd className="font-semibold">
              {snapshot.pinQuota} / {MAPSITE_MAX_PIN_COUNT}
            </dd>
          </div>
          <div className="rounded-lg bg-neutral-50 px-3 py-2">
            <dt className="text-xs text-neutral-500">Paid extra PINs</dt>
            <dd className="font-semibold">{snapshot.purchasedPins}</dd>
          </div>
        </dl>
      ) : null}

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {snapshot ? "Grant history" : "Recent grants"}
        </h3>
        {grants.length === 0 ? (
          <p className="text-sm text-neutral-500">No free PIN grants yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-neutral-500">
                <tr>
                  <th className="py-1 pr-3 font-medium">When</th>
                  <th className="py-1 pr-3 font-medium">FAST Code™</th>
                  <th className="py-1 pr-3 font-medium">Change</th>
                  <th className="py-1 pr-3 font-medium">Balance</th>
                  <th className="py-1 pr-3 font-medium">By</th>
                  <th className="py-1 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {grants.map((row) => (
                  <tr key={row.id}>
                    <td className="py-1.5 pr-3 whitespace-nowrap">{formatWhen(row.createdAt)}</td>
                    <td className="py-1.5 pr-3 font-mono uppercase">{row.fastCode}</td>
                    <td
                      className={`py-1.5 pr-3 font-semibold ${row.delta > 0 ? "text-emerald-700" : "text-red-700"}`}
                    >
                      {row.delta > 0 ? `+${row.delta}` : row.delta}
                    </td>
                    <td className="py-1.5 pr-3">{row.balanceAfter}</td>
                    <td className="py-1.5 pr-3">{row.grantedBy}</td>
                    <td className="py-1.5 text-neutral-600">{row.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
