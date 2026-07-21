import type { LucideIcon } from "lucide-react";

interface TalisMapsStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
}

export default function TalisMapsStatCard({
  label,
  value,
  icon: Icon,
  hint,
}: TalisMapsStatCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-3xl font-semibold tracking-tight text-neutral-900">{value}</p>
      {hint ? <p className="mt-2 text-xs text-neutral-400">{hint}</p> : null}
    </div>
  );
}
