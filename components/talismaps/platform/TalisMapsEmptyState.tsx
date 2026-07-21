import type { LucideIcon } from "lucide-react";

interface TalisMapsEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function TalisMapsEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: TalisMapsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-500">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
