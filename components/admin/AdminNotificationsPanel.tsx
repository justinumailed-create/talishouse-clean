"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { AdminNotificationRecord } from "@/lib/talispros/admin-notifications";
import { urlGateCodeFromNotification } from "@/lib/talispros/admin-notifications";
import { markNotificationReadAction } from "@/app/admin/notifications/actions";
import { buildClaimedMapSitePath } from "@/lib/talispros/mapsite-state";

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminNotificationsPanel({
  initialNotifications,
  loadError,
}: {
  initialNotifications: AdminNotificationRecord[];
  loadError?: string | null;
}) {
  const [items, setItems] = useState(initialNotifications);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const unreadCount = useMemo(
    () => items.filter((item) => !item.readAt).length,
    [items],
  );

  function markRead(id: string) {
    setPendingId(id);
    startTransition(async () => {
      const result = await markNotificationReadAction(id);
      setPendingId(null);
      if (!result.success) return;
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, readAt: item.readAt || new Date().toISOString() }
            : item,
        ),
      );
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Secure codes generated from Mapsite™ URL clicks land here so you can
            dictate them over phone or WhatsApp. Codes are single-use and expire
            after 30 minutes.
          </p>
        </div>
        <p className="text-sm text-neutral-600">
          {unreadCount} unread · {items.length} total
        </p>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
          No notifications yet. When a visitor taps URL on a published Mapsite™
          and generates a secure code, it will appear here.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const code = urlGateCodeFromNotification(item);
            const fastCode =
              typeof item.metadata.fastCode === "string"
                ? item.metadata.fastCode
                : null;
            const propertyTitle =
              typeof item.metadata.propertyTitle === "string"
                ? item.metadata.propertyTitle
                : null;
            const expiresAt =
              typeof item.metadata.expiresAt === "string"
                ? item.metadata.expiresAt
                : null;
            const source =
              typeof item.metadata.source === "string"
                ? item.metadata.source
                : null;
            const unread = !item.readAt;

            return (
              <li
                key={item.id}
                className={`rounded-xl border bg-white px-4 py-3 shadow-sm ${
                  unread ? "border-neutral-900/20" : "border-neutral-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="m-0 text-sm font-semibold text-neutral-900">
                        {item.title}
                      </p>
                      {unread ? (
                        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          New
                        </span>
                      ) : null}
                    </div>
                    <p className="m-0 text-xs text-neutral-500">
                      {formatWhen(item.createdAt)}
                      {source ? ` · via ${source}` : ""}
                      {expiresAt ? ` · expires ${formatWhen(expiresAt)}` : ""}
                    </p>
                    {propertyTitle ? (
                      <p className="m-0 text-xs text-neutral-600">{propertyTitle}</p>
                    ) : null}
                    {code ? (
                      <p className="mt-2 inline-flex rounded-lg bg-neutral-100 px-3 py-2 font-mono text-xl tracking-[0.35em] text-neutral-900">
                        {code}
                      </p>
                    ) : (
                      <p className="m-0 text-sm text-neutral-700">{item.body}</p>
                    )}
                    <p className="m-0 text-xs leading-relaxed text-neutral-500">
                      {item.body}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-stretch gap-2">
                    {fastCode ? (
                      <Link
                        href={buildClaimedMapSitePath({ fastCode })}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-neutral-200 px-3 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
                      >
                        Open Mapsite™
                      </Link>
                    ) : null}
                    {unread ? (
                      <button
                        type="button"
                        disabled={pending && pendingId === item.id}
                        onClick={() => markRead(item.id)}
                        className="inline-flex h-9 items-center justify-center rounded-lg bg-neutral-900 px-3 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                      >
                        Mark read
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
