import type { LucideIcon } from "lucide-react";

export type TalisMapsMetricTone =
  | "neutral"
  | "blue"
  | "emerald"
  | "amber"
  | "violet"
  | "rose"
  | "cyan"
  | "indigo"
  | "slate";

const TONE_STYLES: Record<
  TalisMapsMetricTone,
  { card: string; icon: string; accent: string }
> = {
  neutral: {
    card: "border-neutral-200/80 bg-white",
    icon: "bg-neutral-100 text-neutral-700",
    accent: "text-neutral-500",
  },
  blue: {
    card: "border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-white",
    icon: "bg-blue-100 text-blue-700",
    accent: "text-blue-600",
  },
  emerald: {
    card: "border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white",
    icon: "bg-emerald-100 text-emerald-700",
    accent: "text-emerald-600",
  },
  amber: {
    card: "border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white",
    icon: "bg-amber-100 text-amber-700",
    accent: "text-amber-600",
  },
  violet: {
    card: "border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-white",
    icon: "bg-violet-100 text-violet-700",
    accent: "text-violet-600",
  },
  rose: {
    card: "border-rose-200/80 bg-gradient-to-br from-rose-50/90 to-white",
    icon: "bg-rose-100 text-rose-700",
    accent: "text-rose-600",
  },
  cyan: {
    card: "border-cyan-200/80 bg-gradient-to-br from-cyan-50/90 to-white",
    icon: "bg-cyan-100 text-cyan-700",
    accent: "text-cyan-600",
  },
  indigo: {
    card: "border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 to-white",
    icon: "bg-indigo-100 text-indigo-700",
    accent: "text-indigo-600",
  },
  slate: {
    card: "border-slate-200/80 bg-gradient-to-br from-slate-50/90 to-white",
    icon: "bg-slate-100 text-slate-700",
    accent: "text-slate-600",
  },
};

interface TalisMapsMetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: TalisMapsMetricTone;
  hint?: string;
}

export default function TalisMapsMetricCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
}: TalisMapsMetricCardProps) {
  const styles = TONE_STYLES[tone];

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${styles.card}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.accent}`}>
          {label}
        </p>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </div>
      </div>
      <p className="text-3xl font-semibold tracking-tight text-neutral-900 tabular-nums">
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </p>
      {hint ? <p className="mt-2 text-xs text-neutral-400">{hint}</p> : null}
    </div>
  );
}
