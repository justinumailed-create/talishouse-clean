"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AgentActionResult } from "@/app/admin/agents/actions";

export type AgentPageValues = {
  pageHeadline: string;
  pageSubtext: string;
  pageCta: string;
  pageBio: string;
  videoUrl: string;
  showContactForm: boolean;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none";

export default function AgentPageForm({
  initial,
  save,
  publicHref,
}: {
  initial: AgentPageValues;
  save: (input: AgentPageValues) => Promise<AgentActionResult>;
  publicHref: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof AgentPageValues>(key: K, value: AgentPageValues[K]) {
    setSaved(false);
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await save(values);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-neutral-900">Agent landing page</h2>
        <a href={publicHref} target="_blank" rel="noopener noreferrer" className="text-sm text-[#1E4ED8] underline">
          View public page
        </a>
      </div>
      <label className="block text-sm text-neutral-700">
        Headline
        <input className={inputClass} maxLength={200} value={values.pageHeadline} onChange={(e) => set("pageHeadline", e.target.value)} />
      </label>
      <label className="block text-sm text-neutral-700">
        Subtext
        <input className={inputClass} maxLength={500} value={values.pageSubtext} onChange={(e) => set("pageSubtext", e.target.value)} />
      </label>
      <label className="block text-sm text-neutral-700">
        Bio / about
        <textarea className={inputClass} rows={5} maxLength={4000} value={values.pageBio} onChange={(e) => set("pageBio", e.target.value)} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-neutral-700">
          Call-to-action button text
          <input className={inputClass} maxLength={80} value={values.pageCta} onChange={(e) => set("pageCta", e.target.value)} />
        </label>
        <label className="text-sm text-neutral-700">
          Video URL (https://)
          <input className={inputClass} value={values.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" checked={values.showContactForm} onChange={(e) => set("showContactForm", e.target.checked)} />
        Show contact form
      </label>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {saved ? <p className="text-sm text-green-700">Saved.</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save page"}
      </button>
    </form>
  );
}
