"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteLeadAction } from "@/app/admin/agent/leads/actions";
import { crmCopy } from "@/lib/crm-leads/copy";
import { useLocale } from "@/lib/i18n/client";

export default function DeleteLeadButton({ leadId, name }: { leadId: string; name: string }) {
  const copy = crmCopy(useLocale());
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteLeadAction(leadId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/agent/leads");
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50"
      >
        {copy.delete}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="delete-lead-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 id="delete-lead-title" className="text-lg font-semibold text-neutral-900">{copy.deleteTitle}</h2>
            <p className="mt-1 text-sm font-medium text-neutral-800">{name}</p>
            <p className="mt-2 text-sm text-neutral-600">{copy.deleteBody}</p>
            {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" className="inline-flex h-11 items-center rounded-xl border border-neutral-300 px-4 text-sm font-semibold" onClick={() => setOpen(false)} disabled={pending}>
                {copy.cancel}
              </button>
              <button type="button" className="inline-flex h-11 items-center rounded-xl bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-50" onClick={confirm} disabled={pending}>
                {pending ? copy.deleting : copy.deleteConfirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
