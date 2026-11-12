"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { disqualifyBrokerageAction, restoreBrokerageAction } from "@/app/admin/agent/disqualify-actions";

type Locale = "en" | "de";

const COPY = {
  en: {
    disqualify: "Disqualify",
    restore: "Restore",
    reason: "Reason",
    reasonHint: "Why this brokerage is out of the market.",
    submit: "Disqualify from this market",
    restoreSubmit: "Restore this brokerage",
    cancel: "Cancel",
    working: "Saving…",
    failed: "That did not work. Please try again.",
    forbidden: "You cannot change this brokerage.",
    invalid: "Enter a short reason.",
    needsNext: "This market has no qualified brokerage left. Source the next one. Aim for 3 candidates so there is a fallback.",
    stillQualified: (n: number) =>
      n === 1
        ? "1 qualified brokerage remains in this market. The aim is 3, so there is a fallback."
        : `${n} qualified brokerages remain in this market. The aim is 3, so there is a fallback.`,
    saved: "Disqualified. The brokerage stays on record and is off the call list and the public Mapsite.",
    restored: "Restored. The brokerage is back on the call list and the public Mapsite.",
  },
  de: {
    disqualify: "Disqualifizieren",
    restore: "Wieder aufnehmen",
    reason: "Grund",
    reasonHint: "Warum dieses Maklerbüro nicht in den Markt gehört.",
    submit: "Aus diesem Markt nehmen",
    restoreSubmit: "Maklerbüro wieder aufnehmen",
    cancel: "Abbrechen",
    working: "Wird gespeichert …",
    failed: "Das hat nicht geklappt. Bitte versuchen Sie es erneut.",
    forbidden: "Sie können dieses Maklerbüro nicht ändern.",
    invalid: "Bitte einen kurzen Grund eingeben.",
    needsNext:
      "In diesem Markt ist kein qualifiziertes Maklerbüro mehr. Das nächste recherchieren. Ziel sind 3 Kandidaten, damit es einen Ersatz gibt.",
    stillQualified: (n: number) =>
      n === 1
        ? "1 qualifiziertes Maklerbüro bleibt in diesem Markt. Das Ziel sind 3, damit es einen Ersatz gibt."
        : `${n} qualifizierte Maklerbüros bleiben in diesem Markt. Das Ziel sind 3, damit es einen Ersatz gibt.`,
    saved: "Disqualifiziert. Das Maklerbüro bleibt gespeichert und ist von der Anrufliste und der öffentlichen Mapsite weg.",
    restored: "Wieder aufgenommen. Das Maklerbüro ist zurück auf der Anrufliste und der öffentlichen Mapsite.",
  },
} as const;

export default function DisqualifyBrokerageControl({
  locale,
  fastCode = null,
  prospectQueueId = null,
  mode = "disqualify",
}: {
  locale: Locale;
  fastCode?: string | null;
  prospectQueueId?: string | null;
  mode?: "disqualify" | "restore";
}) {
  const copy = COPY[locale];
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    setMessage(null);
    start(async () => {
      if (mode === "restore") {
        const res = await restoreBrokerageAction({ fastCode, prospectQueueId, reason });
        if (!res.ok) {
          setMessage(res.error === "forbidden" ? copy.forbidden : copy.failed);
          return;
        }
        setOpen(false);
        setReason("");
        setMessage(copy.restored);
        router.refresh();
        return;
      }
      const res = await disqualifyBrokerageAction({ fastCode, prospectQueueId, reason });
      if (!res.ok) {
        setMessage(res.error === "forbidden" ? copy.forbidden : res.error === "invalid" ? copy.invalid : copy.failed);
        return;
      }
      setOpen(false);
      setReason("");
      setMessage(res.needsNext ? `${copy.saved} ${copy.needsNext}` : res.market && res.qualified < 3 ? `${copy.saved} ${copy.stillQualified(res.qualified)}` : copy.saved);
      router.refresh();
    });
  };

  return (
    <div className="mt-3" data-testid={mode === "restore" ? "restore-brokerage" : "disqualify-brokerage"}>
      {open ? (
        <form
          className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label className="block text-[13px] font-medium text-neutral-800">
            {copy.reason}
            <textarea
              required
              minLength={3}
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              aria-describedby="disqualify-reason-hint"
              rows={3}
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900"
            />
            <span id="disqualify-reason-hint" className="mt-1 block text-[12px] font-normal text-neutral-500">
              {copy.reasonHint}
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className="h-9 rounded-lg bg-neutral-900 px-3 text-xs font-semibold text-white disabled:opacity-50"
            >
              {pending ? copy.working : mode === "restore" ? copy.restoreSubmit : copy.submit}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-800"
            >
              {copy.cancel}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setOpen(true);
          }}
          className="inline-flex h-9 items-center rounded-lg border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
        >
          {mode === "restore" ? copy.restore : copy.disqualify}
        </button>
      )}
      {message ? <p className="mt-2 text-[13px] text-neutral-700">{message}</p> : null}
    </div>
  );
}
