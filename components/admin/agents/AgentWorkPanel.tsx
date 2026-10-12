"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { agentAddPinsAction, agentRecordCashPaymentAction } from "@/app/admin/agent/actions";

type Status = { kind: "ok" | "error"; text: string } | null;

const field =
  "block h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition focus:border-[#1E4ED8] focus:outline-none focus:ring-4 focus:ring-[#1E4ED8]/15 disabled:bg-neutral-50 disabled:text-neutral-400";
const codeField = `${field} font-mono uppercase tracking-wide`;
const primary =
  "inline-flex h-11 items-center justify-center rounded-xl bg-[#1E4ED8] px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.08)] transition hover:bg-[#1a43bd] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1E4ED8]/30 disabled:cursor-not-allowed disabled:opacity-50";
const secondary =
  "inline-flex h-11 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1E4ED8]/20 disabled:cursor-not-allowed disabled:opacity-50";
const label = "mb-1.5 block text-xs font-medium text-neutral-700";

function StatusLine({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p
      role="status"
      className={`rounded-lg px-3 py-2 text-sm ${
        status.kind === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
      }`}
    >
      {status.text}
    </p>
  );
}

function todayIso(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const ICONS: Record<string, ReactNode> = {
  map: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" />,
  book: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm0 14a2 2 0 0 1 2-2h13" />,
  pin: <path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  cash: <path d="M3 7h18v10H3V7Zm9 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM6 10v.01M18 14v.01" />,
};

export function TaskCard({
  icon,
  title,
  description,
  children,
}: {
  icon: keyof typeof ICONS;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1E4ED8]/10 text-[#1E4ED8]">
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            {ICONS[icon]}
          </svg>
        </span>
        <div>
          <h3 className="text-[15px] font-semibold text-neutral-900">{title}</h3>
          <p className="mt-0.5 text-[13px] leading-5 text-neutral-500">{description}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-1 flex-col justify-end gap-3">{children}</div>
    </section>
  );
}

/**
 * Agent task cards on /admin/agent. Each card only renders when its privilege
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
  const [mapsiteCode, setMapsiteCode] = useState("");
  const [ebookCode, setEbookCode] = useState("");
  const [pinStatus, setPinStatus] = useState<Status>(null);
  const [cashStatus, setCashStatus] = useState<Status>(null);
  const [paidOn] = useState(todayIso);

  if (!canMapSites && !canEbooks && !canPins && !canCash) {
    return (
      <section className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
        <p className="text-sm font-medium text-neutral-900">No tasks assigned yet</p>
        <p className="mt-1 text-sm text-neutral-500">Ask a superadmin to grant you a privilege.</p>
      </section>
    );
  }

  const slug = (value: string) => encodeURIComponent(value.trim().toLowerCase());

  function onPins(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPinStatus(null);
    startTransition(async () => {
      try {
        const result = await agentAddPinsAction({
          fastCode: String(form.get("fastCode") || ""),
          count: Number(form.get("count") || 0),
          note: String(form.get("note") || ""),
        });
        setPinStatus(result.ok ? { kind: "ok", text: result.message } : { kind: "error", text: result.error });
      } catch {
        setPinStatus({ kind: "error", text: "Network error. Please try again." });
      }
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
      try {
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
      } catch {
        setCashStatus({ kind: "error", text: "Network error. Please try again." });
      }
    });
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {canMapSites ? (
        <TaskCard icon="map" title="Manage a Mapsite" description="Edit details and content. Deleting and pricing stay with a superadmin.">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (mapsiteCode.trim()) router.push(`/admin/mapsites/${slug(mapsiteCode)}`);
            }}
          >
            <input aria-label="FAST Code" className={codeField} placeholder="FAST Code" value={mapsiteCode}
              onChange={(e) => setMapsiteCode(e.target.value)} disabled={readOnly} />
            <button type="submit" className={primary} disabled={readOnly || !mapsiteCode.trim()}>Open</button>
          </form>
        </TaskCard>
      ) : null}

      {canEbooks ? (
        <TaskCard icon="book" title="Create an eBook" description="Start a new eBook attached to a FAST Code.">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (ebookCode.trim()) router.push(`/talispros/mapsites/${slug(ebookCode)}/ebooks/new`);
            }}
          >
            <input aria-label="FAST Code" className={codeField} placeholder="FAST Code" value={ebookCode}
              onChange={(e) => setEbookCode(e.target.value)} disabled={readOnly} />
            <button type="submit" className={primary} disabled={readOnly || !ebookCode.trim()}>Create</button>
          </form>
        </TaskCard>
      ) : null}

      {canPins ? (
        <TaskCard icon="pin" title="Add PINs to a Mapsite" description="Adds 1–25 free PIN credits (no Stripe). Then place them on the map.">
          <form onSubmit={onPins} className="space-y-3">
            <div className="grid grid-cols-[1fr_96px] gap-2">
              <div>
                <label className={label} htmlFor="pins-code">FAST Code</label>
                <input id="pins-code" name="fastCode" required placeholder="FAST Code" className={codeField} disabled={readOnly} />
              </div>
              <div>
                <label className={label} htmlFor="pins-count">PINs</label>
                <input id="pins-count" name="count" type="number" min={1} max={25} required defaultValue={1} className={field} disabled={readOnly} />
              </div>
            </div>
            <input aria-label="Note" name="note" placeholder="Note (optional)" className={field} disabled={readOnly} />
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={primary} disabled={readOnly || pending}>Add PINs</button>
              <button
                type="button"
                className={secondary}
                disabled={readOnly}
                onClick={(e) => {
                  const code = (e.currentTarget.form?.elements.namedItem("fastCode") as HTMLInputElement | null)?.value || "";
                  if (code.trim()) window.open(`/mapsite/${slug(code)}`, "_blank", "noopener");
                }}
              >
                Place PINs
              </button>
            </div>
            <StatusLine status={pinStatus} />
          </form>
        </TaskCard>
      ) : null}

      {canCash ? (
        <TaskCard icon="cash" title="Mark a FAST Code paid (cash)" description="Records a CAD cash payment and activates the Mapsite. Logged; a superadmin can reverse it.">
          <form onSubmit={onCash} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={label} htmlFor="cash-code">FAST Code</label>
                <input id="cash-code" name="fastCode" required placeholder="FAST Code" className={codeField} disabled={readOnly} />
              </div>
              <div>
                <label className={label} htmlFor="cash-amount">Amount (CAD)</label>
                <input id="cash-amount" name="amountCad" required inputMode="decimal" placeholder="CA$ 0.00" className={field} disabled={readOnly} />
              </div>
              <div>
                <label className={label} htmlFor="cash-date">Paid on</label>
                <input id="cash-date" name="paidOn" type="date" required defaultValue={paidOn} className={field} disabled={readOnly} />
              </div>
              <div>
                <label className={label} htmlFor="cash-note">Note</label>
                <input id="cash-note" name="note" placeholder="Receipt #, payer" className={field} disabled={readOnly} />
              </div>
            </div>
            <button type="submit" className={primary} disabled={readOnly || pending}>Record cash payment</button>
            <StatusLine status={cashStatus} />
          </form>
        </TaskCard>
      ) : null}
    </div>
  );
}
