"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, Unlink } from "lucide-react";
import { cardClass, fieldClass, primaryButton } from "@/components/admin/ui";
import {
  linkMapSitePartnersAction,
  unlinkMapSitePartnersAction,
} from "@/app/admin/mapsites/partner-link-actions";
import type { MapSitePartnerLink } from "@/lib/talispros/mapsite-partner-links";

/**
 * Superadmin: link two FAST Codes / Mapsites as partners. Each linked Mapsite
 * shows a button to the other (their PINs are too far apart for one map).
 * Several pairs can share a FAST Code, so groups of 3+ also work.
 */
export default function AdminMapSitePartnerLinksPanel({
  initialLinks,
  fastCodes,
}: {
  initialLinks: MapSitePartnerLink[];
  fastCodes: string[];
}) {
  const router = useRouter();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await linkMapSitePartnersAction(a, b);
      if (!result.ok) {
        setError(result.error || "Could not link these Mapsites.");
        return;
      }
      setMessage(`Linked ${a.trim().toUpperCase()} ↔ ${b.trim().toUpperCase()}.`);
      setA("");
      setB("");
      router.refresh();
    });
  }

  function unlink(id: string) {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await unlinkMapSitePartnersAction(id);
      if (!result.ok) setError(result.error || "Could not unlink.");
      else router.refresh();
    });
  }

  return (
    <section className={`${cardClass} p-5 sm:p-6`} data-testid="admin-partner-links">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1E4ED8]/10 text-[#1E4ED8]">
          <Link2 className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Partner-linked Mapsites</h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Link two FAST Codes as partners. Their PINs stay on separate maps; each Mapsite shows a
            button that opens the other.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
        <input
          list="partner-fast-codes"
          value={a}
          onChange={(e) => setA(e.target.value)}
          placeholder="FAST Code A"
          aria-label="FAST Code A"
          className={`${fieldClass} font-mono uppercase`}
          disabled={pending}
          required
        />
        <span aria-hidden className="hidden text-center text-neutral-400 sm:block">↔</span>
        <input
          list="partner-fast-codes"
          value={b}
          onChange={(e) => setB(e.target.value)}
          placeholder="FAST Code B"
          aria-label="FAST Code B"
          className={`${fieldClass} font-mono uppercase`}
          disabled={pending}
          required
        />
        <button type="submit" className={primaryButton} disabled={pending}>
          {pending ? "Saving…" : "Link Mapsites"}
        </button>
        <datalist id="partner-fast-codes">
          {fastCodes.map((code) => (
            <option key={code} value={code.toUpperCase()} />
          ))}
        </datalist>
      </form>
      {error ? <p className="mt-3 text-sm text-red-600" role="alert">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-green-700">{message}</p> : null}

      <div className="mt-5 overflow-hidden rounded-xl border border-neutral-200">
        {initialLinks.length === 0 ? (
          <p className="px-4 py-4 text-sm text-neutral-500">No partner links yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {initialLinks.map((link) => (
              <li key={link.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span className="flex items-center gap-2 font-mono text-sm font-semibold text-neutral-900">
                  <span className="rounded-lg bg-neutral-100 px-2 py-1">{link.fastCodeA.toUpperCase()}</span>
                  <span className="text-neutral-400">↔</span>
                  <span className="rounded-lg bg-neutral-100 px-2 py-1">{link.fastCodeB.toUpperCase()}</span>
                </span>
                <button
                  type="button"
                  onClick={() => unlink(link.id)}
                  disabled={pending}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                >
                  <Unlink className="h-4 w-4" aria-hidden />
                  Unlink
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
