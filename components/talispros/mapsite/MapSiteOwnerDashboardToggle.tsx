"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setMapsiteDashboardViewAction } from "@/app/admin/mapsites/dashboard-view-actions";
import { useT } from "@/lib/i18n/client";

/**
 * Owner (and admin) switch for this Mapsite's dashboard.
 * Stays on screen when the view is off, so it can be turned back on.
 */
export default function MapSiteOwnerDashboardToggle({
  fastCode,
  initialEnabled,
}: {
  fastCode: string;
  initialEnabled: boolean;
}) {
  const t = useT().mapsite.dashboardView;
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onChange(next: boolean) {
    setPending(true);
    setMessage("");
    const result = await setMapsiteDashboardViewAction(fastCode, next);
    setPending(false);
    if (!result.ok) {
      setMessage(
        result.error === "You do not have permission to change this Mapsite."
          ? t.denied
          : t.failed,
      );
      return;
    }
    setEnabled(next);
    setMessage(next ? t.on : t.off);
    router.refresh();
  }

  return (
    <div
      className="mt-3 rounded-xl bg-white/80 px-3 py-2.5 text-left ring-1 ring-black/10"
      data-testid="mapsite-owner-dashboard-toggle"
    >
      <label className="flex items-start gap-2.5 text-[13px] font-medium text-neutral-900">
        <input
          type="checkbox"
          checked={enabled}
          disabled={pending || !fastCode}
          data-testid="mapsite-owner-dashboard-input"
          onChange={(event) => void onChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-neutral-300"
        />
        <span>
          <span className="block font-semibold">{t.label}</span>
          <span className="mt-0.5 block text-[12px] font-normal leading-snug text-neutral-600">
            {t.hint}
          </span>
        </span>
      </label>
      {message ? (
        <p className="mt-2 text-[12px] text-neutral-600" data-testid="mapsite-owner-dashboard-status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
