"use client";

import { useEffect, useState, useTransition } from "react";
import { useT } from "@/lib/i18n/client";
import {
  generateContractCodeAction,
  listContractCodesAction,
  revokeContractCodeAction,
} from "@/app/admin/agent/contract-codes-actions";
import { mapsiteContractPath } from "@/lib/talispros/mapsite-contract";
import type { ContractCodeSummary } from "@/lib/talispros/mapsite-contract-service";

/** Agent dashboard: generate / list / revoke Mapsite contract access codes. */
export default function ContractAccessCodesPanel({
  fastCodes = [],
}: {
  /** Assigned FAST Codes (empty = free entry). */
  fastCodes?: readonly string[];
}) {
  const t = useT();
  const a = t.mapsite.agentCodes;
  const [fastCode, setFastCode] = useState(fastCodes[0]?.toLowerCase() ?? "");
  const [label, setLabel] = useState("");
  const [days, setDays] = useState(30);
  const [codes, setCodes] = useState<ContractCodeSummary[]>([]);
  const [created, setCreated] = useState<{ code: string; fastCode: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [now] = useState(() => Date.now());

  useEffect(() => {
    void listContractCodesAction().then((result) => {
      if ("codes" in result) setCodes(result.codes);
    });
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-[15px] font-semibold text-neutral-900">{a.title}</h2>
      <p className="mt-1 text-sm text-neutral-500">{a.body}</p>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.5fr_0.7fr_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setCreated(null);
          startTransition(async () => {
            const result = await generateContractCodeAction({ fastCode, label, days });
            if ("error" in result) {
              setError(result.error);
              return;
            }
            setCreated({ code: result.code, fastCode: result.summary.fastCode });
            setCodes((current) => [result.summary, ...current]);
            setLabel("");
          });
        }}
      >
        <label className="text-xs font-semibold text-neutral-700">
          {a.fastCode}
          {fastCodes.length > 0 ? (
            <select
              value={fastCode}
              onChange={(event) => setFastCode(event.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-2 text-sm font-normal uppercase"
            >
              {fastCodes.map((code) => (
                <option key={code} value={code.toLowerCase()}>
                  {code.toUpperCase()}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={fastCode}
              onChange={(event) => setFastCode(event.target.value.trim().toLowerCase())}
              placeholder="rm22"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-2 text-sm font-normal uppercase"
            />
          )}
        </label>
        <label className="text-xs font-semibold text-neutral-700">
          {a.label}
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={120}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-2 text-sm font-normal"
          />
        </label>
        <label className="text-xs font-semibold text-neutral-700">
          {a.days}
          <input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-2 text-sm font-normal"
          />
        </label>
        <button
          type="submit"
          disabled={pending || !fastCode}
          className="rounded-lg bg-[#1E4ED8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? a.generating : a.generate}
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {created ? (
        <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <p>{a.newCode}</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-widest">{created.code}</p>
          <p className="mt-2 break-all text-xs">
            {a.link}: {origin}
            {mapsiteContractPath(created.fastCode)}
          </p>
        </div>
      ) : null}
      <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-neutral-500">{a.recent}</h3>
      {codes.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-500">{a.none}</p>
      ) : (
        <ul className="mt-2 divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 text-sm">
          {codes.map((code) => {
            const expired = new Date(code.expiresAt).getTime() < now;
            return (
              <li key={code.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <span className="min-w-0">
                  <span className="font-mono font-semibold uppercase">{code.fastCode}</span>
                  <span className="ml-2 font-mono text-neutral-500">{code.codeHint}</span>
                  {code.label ? <span className="ml-2 text-neutral-500">{code.label}</span> : null}
                  <span className="ml-2 text-xs text-neutral-400">
                    {code.useCount}/{code.maxUses} · {new Date(code.expiresAt).toLocaleDateString()}
                  </span>
                </span>
                {code.revokedAt || expired ? (
                  <span className="text-xs uppercase text-neutral-400">
                    {code.revokedAt ? "revoked" : "expired"}
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await revokeContractCodeAction(code.id);
                        if ("error" in result) return setError(result.error);
                        setCodes((current) =>
                          current.map((entry) =>
                            entry.id === code.id
                              ? { ...entry, revokedAt: new Date().toISOString() }
                              : entry,
                          ),
                        );
                      })
                    }
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    {a.revoke}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
