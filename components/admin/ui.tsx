import Link from "next/link";
import type { ReactNode } from "react";

export { PageHeader, PresenceDot, cardClass, fieldClass, primaryButton, secondaryButton, textareaClass } from "./agents/ui";

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="text-[13px] font-medium text-neutral-500">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight text-neutral-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-neutral-500">{hint}</div> : null}
    </div>
  );
}

export function LinkButton({ href, children, variant = "secondary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  return (
    <Link
      href={href}
      className={
        variant === "primary"
          ? "inline-flex h-10 items-center justify-center rounded-xl bg-[#1E4ED8] px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.08)] hover:bg-[#1a43bd]"
          : "inline-flex h-10 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
      }
    >
      {children}
    </Link>
  );
}

export function StatusPill({ tone, children }: { tone: "green" | "red" | "amber" | "neutral" | "blue"; children: ReactNode }) {
  const tones = {
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-800",
    neutral: "bg-neutral-100 text-neutral-700",
    blue: "bg-[#1E4ED8]/10 text-[#1E4ED8]",
  } as const;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
