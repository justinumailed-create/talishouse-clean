"use client";

import { useEffect, useId, type ReactNode } from "react";
import { useT } from "@/lib/i18n/client";
import { MAPSITE_DASHBOARD_MENU_ITEMS } from "@/lib/talispros/mapsite-owner-customizations";

type MapSiteDashboardPanelProps = {
  title: string;
  fastCode: string;
  onClose: () => void;
  children: ReactNode;
  /** Wider panels (Bookshelf / Ebook Editor). Default matches PIN Dashboard. */
  wide?: boolean;
};

/**
 * Closeable owner Dashboard panel over the Mapsite map canvas.
 * Shared shell for PIN Dashboard, Logo & Card Editor, Bookshelf Editor and
 * Ebook Editor so every Dashboard item looks and closes the same way.
 */
export default function MapSiteDashboardPanel({
  title,
  fastCode,
  onClose,
  children,
  wide = false,
}: MapSiteDashboardPanelProps) {
  const titleId = useId();
  const t = useT();
  const menuId = MAPSITE_DASHBOARD_MENU_ITEMS.find((item) => item.label === title)?.id;
  const localizedTitle = menuId ? t.mapsite.dashboardMenu[menuId] : title;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <section
      role="dialog"
      aria-labelledby={titleId}
      className={`pointer-events-auto absolute right-3 top-3 z-30 flex max-h-[min(72vh,40rem)] flex-col overflow-hidden rounded-xl bg-white text-neutral-900 shadow-xl sm:right-4 sm:top-4 ${
        wide
          ? "w-[min(calc(100%-1.5rem),34rem)]"
          : "w-[min(calc(100%-1.5rem),22rem)]"
      }`}
    >
      <header className="flex items-start justify-between gap-3 border-b border-neutral-200 px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Mapsites
          </p>
          <h2 id={titleId} className="text-sm font-semibold">
            {localizedTitle}
          </h2>
          <p className="mt-0.5 font-mono text-[11px] text-neutral-500">
            FAST Code™ {fastCode.trim().toUpperCase()}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-100"
        >
          {t.mapsite.close}
        </button>
      </header>
      <div className="space-y-4 overflow-y-auto px-4 py-3 text-sm">{children}</div>
    </section>
  );
}

export function DashboardNotice({
  tone,
  children,
}: {
  tone: "info" | "success" | "error";
  children: ReactNode;
}) {
  const cls =
    tone === "success"
      ? "bg-emerald-50 text-emerald-800"
      : tone === "error"
        ? "bg-red-50 text-red-700"
        : "bg-neutral-50 text-neutral-600";
  return (
    <p
      className={`rounded-md px-3 py-2 text-xs ${cls}`}
      role={tone === "error" ? "alert" : undefined}
    >
      {children}
    </p>
  );
}
