"use client";

import type { LucideIcon } from "lucide-react";
import type { TalisMapsActivityItem } from "@/lib/talismaps/types";

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatBadgeLabel(value: string): string {
  return value.replace(/_/g, " ");
}

interface TalisMapsActivityPanelProps {
  title: string;
  description: string;
  icon: LucideIcon;
  items: TalisMapsActivityItem[];
  emptyTitle: string;
  emptyDescription: string;
}

export default function TalisMapsActivityPanel({
  title,
  description,
  icon: Icon,
  items,
  emptyTitle,
  emptyDescription,
}: TalisMapsActivityPanelProps) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
      <div className="border-b border-neutral-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">{title}</h3>
            <p className="text-xs text-neutral-500">{description}</p>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center px-5 py-10 text-center">
          <p className="text-sm font-medium text-neutral-900">{emptyTitle}</p>
          <p className="mt-2 text-xs leading-relaxed text-neutral-500">{emptyDescription}</p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((item) => (
            <li key={item.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-900">{item.title}</p>
                  <p className="mt-0.5 truncate text-sm text-neutral-500">{item.subtitle}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-neutral-400" suppressHydrationWarning>
                    {formatRelativeTime(item.timestamp)}
                  </p>
                  {item.badge ? (
                    <span className="mt-1 inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium capitalize text-neutral-600">
                      {formatBadgeLabel(item.badge)}
                    </span>
                  ) : null}
                </div>
              </div>
              {item.status ? (
                <span className="mt-2 inline-flex rounded-full bg-neutral-900 px-2.5 py-0.5 text-[10px] font-medium capitalize text-white">
                  {item.status}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
