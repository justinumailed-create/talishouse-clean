import type { ReactNode } from "react";

/** Shared card / heading styles for the agent console (Stripe/PayPal-style). */
export const cardClass = "rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]";
export const fieldClass =
  "block h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition focus:border-[#1E4ED8] focus:outline-none focus:ring-4 focus:ring-[#1E4ED8]/15 disabled:bg-neutral-50";
export const textareaClass =
  "block w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition focus:border-[#1E4ED8] focus:outline-none focus:ring-4 focus:ring-[#1E4ED8]/15";
export const primaryButton =
  "inline-flex h-11 items-center justify-center rounded-xl bg-[#1E4ED8] px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.08)] transition hover:bg-[#1a43bd] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1E4ED8]/30 disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButton =
  "inline-flex h-11 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1E4ED8]/20 disabled:cursor-not-allowed disabled:opacity-50";

export function PageHeader({ kicker, title, subtitle, actions }: { kicker: string; title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#1E4ED8]">{kicker}</p>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-neutral-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function PresenceDot({ online, className = "" }: { online: boolean; className?: string }) {
  return (
    <span
      aria-label={online ? "Online" : "Offline"}
      className={`inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white ${online ? "bg-green-500" : "bg-neutral-300"} ${className}`}
    />
  );
}
