"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { agentAddPinsAction, agentRecordCashPaymentAction } from "@/app/admin/agent/actions";

type Status = { kind: "ok" | "error"; text: string } | null;

const input = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm";
const button =
  "rounded-lg bg-[#1E4ED8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";

function StatusLine({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p className={`text-sm ${status.kind === "ok" ? "text-green-700" : "text-red-600"}`}>{status.text}</p>
  );
}

function todayIso(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/**
 * Agent work tools on /admin/agent. Each form only renders when the privilege
 * is granted; the server actions re-check privilege + assignment regardless.
 */
export default function AgentWorkPanel({
  canMapSites,
  canEbooks,
  canPins,
  canCash,
  readOnly = false,
}: {
  canMapSites: boolean;
  canEbooks: boolean;
  canPins: boolean;
  canCash: boolean;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [openCode, setOpenCode] = useState("");
  const [pinStatus, setPinStatus] = useState<Status>(null);
  const [cashStatus, setCashStatus] = useState<Status>(null);
  const [paidOn] = useState(todayIso);

  if (!canMapSites && !canEbooks && !canPins && !canCash) return null;
  const code = openCode.trim().toLowerCase();

  function onPins(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPinStatus(null);
    startTransition(async () => {
      const result = await agentAddPinsAction({
        fastCode: String(form.get("fastCode") || ""),
        count: Number(form.get("count") || 0),
        note: String(form.get("note") || ""),
      });
      setPinStatus(result.ok ? { kind: "ok", text: result.message } : { kind: "error", text: result.error });
    });
  }

  function onCash(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    const fastCode = String(form.get("fastCode") || "");
    const amount = String(form.get("amountCad") || "");
    if (!window.confirm(`Mark ${fastCode.toUpperCase()} as paid: CA$${amount} cash? This activates the Mapsite.`)) {
      return;
    }
    setCashStatus(null);
    startTransition(async () => {
      const result = await agentRecordCashPaymentAction({
        fastCode,
        amountCad: amount,
        paidOn: String(form.get("paidOn") || ""),
        note: String(form.get("note") || ""),
      });
      setCashStatus(result.ok ? { kind: "ok", text: result.message } : { kind: "error", text: result.error });
      if (result.ok) {
        target.reset();
        router.refresh();
      }
    });
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-6">
      <h2 className="text-lg font-semibold text-neutral-900">Work on a FAST Code™</h2>
      {readOnly ? (
        <p className="text-sm text-neutral-500">Read-only preview — forms are disabled.</p>
      ) : null}

      {canMapSites || canEbooks || canPins ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-800" htmlFor="agent-open-code">
            Open a Mapsite
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="agent-open-code"
              className={`${input} max-w-xs font-mono uppercase`}
              placeholder="FAST Code"
              value={openCode}
              onChange={(event) => setOpenCode(event.target.value)}
              disabled={readOnly}
            />
            {canMapSites ? (
              <button type="button" className={button} disabled={readOnly || !code}
                onClick={() => router.push(`/admin/mapsites/${encodeURIComponent(code)}`)}>
                Edit Mapsite
              </button>
            ) : null}
            {canEbooks ? (
              <button type="button" className={button} disabled={readOnly || !code}
                onClick={() => router.push(`/talispros/mapsites/${encodeURIComponent(code)}/ebooks/new`)}>
                Create ebook
              </button>
            ) : null}
            {canPins ? (
              <button type="button" className={button} disabled={readOnly || !code}
                onClick={() => window.open(`/mapsite/${encodeURIComponent(code)}`, "_blank", "noopener")}>
                Place PINs
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {canPins ? (
        <form onSubmit={onPins} className="space-y-2 border-t border-neutral-200 pt-4">
          <h3 className="text-sm font-semibold text-neutral-900">Add new PINs (no Stripe)</h3>
          <p className="text-xs text-neutral-500">
            Adds free PIN credits (1–25) to the Mapsite; then use “Place PINs” to drop them on the map.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <input name="fastCode" required placeholder="FAST Code" className={`${input} font-mono uppercase`} disabled={readOnly} />
            <input name="count" type="number" min={1} max={25} required defaultValue={1} className={input} disabled={readOnly} />
            <input name="note" placeholder="Note (optional)" className={input} disabled={readOnly} />
          </div>
          <button type="submit" className={button} disabled={readOnly || pending}>Add PINs</button>
          <StatusLine status={pinStatus} />
        </form>
      ) : null}

      {canCash ? (
        <form onSubmit={onCash} className="space-y-2 border-t border-neutral-200 pt-4">
          <h3 className="text-sm font-semibold text-neutral-900">Mark FAST Code™ as paid (cash)</h3>
          <p className="text-xs text-neutral-500">
            Records a cash payment in CAD and activates the Mapsite. A superadmin can reverse it.
          </p>
          <div className="grid gap-2 sm:grid-cols-4">
            <input name="fastCode" required placeholder="FAST Code" className={`${input} font-mono uppercase`} disabled={readOnly} />
            <input name="amountCad" required inputMode="decimal" placeholder="Amount CAD" className={input} disabled={readOnly} />
            <input name="paidOn" type="date" required defaultValue={paidOn} className={input} disabled={readOnly} />
            <input name="note" placeholder="Note (receipt #, who paid)" className={input} disabled={readOnly} />
          </div>
          <button type="submit" className={button} disabled={readOnly || pending}>Record cash payment</button>
          <StatusLine status={cashStatus} />
        </form>
      ) : null}
    </section>
  );
}
