"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { assignDemoEbookAction } from "@/app/talispros/demo-mapsite/assign-actions";

/**
 * ASSIGN TO ACCOUNT (beside Claim Your Market™ on demo eBooks / Mapsites):
 * enter a FAST Code → server checks the account is paid up → moves the demo
 * eBook onto that account (logged). Not paid → clear "not paid up" message.
 */
export default function DemoAssignToAccountButton({
  mapsiteId,
  onOpenChange,
}: {
  mapsiteId: string;
  onOpenChange?: (open: boolean) => void;
}) {
  const d = useT().demo;
  const router = useRouter();
  const [open, setOpenState] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notPaid, setNotPaid] = useState(false);
  const [pending, start] = useTransition();

  function setOpen(next: boolean) {
    setOpenState(next);
    onOpenChange?.(next);
  }

  function submit() {
    setError(null);
    setNotPaid(false);
    start(async () => {
      const r = await assignDemoEbookAction({ mapsiteId, fastCode: code }).catch(() => null);
      if (!r) {
        setError(d.assignError);
        return;
      }
      if (!r.ok) {
        if (r.reason === "not_paid") {
          setNotPaid(true);
          return;
        }
        setError(r.error);
        return;
      }
      router.push(r.href);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="demo-assign-to-account"
        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--talis-nav-blue)] bg-white px-4 py-2 text-sm font-medium text-[var(--talis-nav-blue)] transition hover:bg-[#046BD9]/5"
      >
        {d.assignCta}
      </button>
    );
  }

  return (
    <div className="w-full max-w-[280px] space-y-3 rounded-2xl border border-neutral-200 bg-white p-3 text-left shadow-sm">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{d.assignCta}</p>
      <p className="text-[12px] leading-snug text-neutral-600">{d.assignPrompt}</p>
      <input
        value={code}
        onChange={(e) => {
          setCode(e.target.value.toUpperCase());
          setError(null);
          setNotPaid(false);
        }}
        disabled={pending}
        autoCapitalize="characters"
        autoComplete="off"
        placeholder="FAST Code"
        className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 font-mono text-sm uppercase text-neutral-900 outline-none focus:border-neutral-400 disabled:opacity-50"
      />
      {notPaid ? (
        <p role="alert" className="rounded-lg bg-amber-50 px-2.5 py-2 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
          <span className="font-semibold">{d.assignNotPaidTitle}</span> {d.assignNotPaidBody}
        </p>
      ) : null}
      {error ? <p role="alert" className="text-xs leading-relaxed text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setError(null);
            setNotPaid(false);
          }}
          className="inline-flex min-h-9 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
        >
          {d.cancel}
        </button>
        <button
          type="button"
          disabled={pending || !code.trim()}
          onClick={submit}
          className="inline-flex min-h-9 flex-1 items-center justify-center rounded-xl bg-[#046BD9] px-3 text-sm font-medium text-white transition hover:bg-[#0357b0] disabled:opacity-50"
        >
          {pending ? d.assigning : d.assignSubmit}
        </button>
      </div>
    </div>
  );
}
