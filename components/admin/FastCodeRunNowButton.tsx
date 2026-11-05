"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runFastCodeJobNowAction } from "@/app/admin/dashboard/fast-code-tracker-actions";

const COPY = {
  en: { run: "Run now", running: "Running…", done: "Done: {n} codes checked, {s} new brokerages from Google, {a} assigned", failed: "Run failed. Please try again." },
  de: { run: "Jetzt ausführen", running: "Läuft …", done: "Fertig: {n} Codes geprüft, {s} neue Maklerbüros von Google, {a} zugewiesen", failed: "Lauf fehlgeschlagen. Bitte erneut versuchen." },
} as const;

export default function FastCodeRunNowButton({ locale }: { locale: "en" | "de" }) {
  const t = COPY[locale];
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        data-testid="fast-codes-run-now"
        onClick={() =>
          start(async () => {
            setMsg(null);
            const res = await runFastCodeJobNowAction();
            if (!res.ok) return setMsg(t.failed);
            setMsg(t.done.replace("{n}", String(res.summary.refreshed)).replace("{s}", String(res.summary.sourcing?.added ?? 0)).replace("{a}", String(res.summary.assigned.length)));
            router.refresh();
          })
        }
        className="rounded-lg border border-[#1E4ED8] px-3 py-1.5 text-xs font-semibold text-[#1E4ED8] hover:bg-[#1E4ED8]/5 disabled:opacity-50"
      >
        {pending ? t.running : t.run}
      </button>
      {msg ? <span className="text-[11px] text-neutral-600">{msg}</span> : null}
    </span>
  );
}
