"use client";

import { useState } from "react";
import { setMapsiteDashboardViewAction } from "@/app/admin/mapsites/dashboard-view-actions";

/**
 * Global Admin control on /admin/mapsites/[fastCode].
 * Default is on. Saving off needs migration 126, which is not applied here.
 */
export default function MapSiteDashboardViewToggle({
  fastCode,
  initialEnabled,
}: {
  fastCode: string;
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onChange(next: boolean) {
    setPending(true);
    setMessage("");
    const result = await setMapsiteDashboardViewAction(fastCode, next);
    setPending(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setEnabled(next);
    setMessage(next ? "Dashboard view is on." : "Dashboard view is off.");
  }

  return (
    <section
      className="rounded-2xl border border-neutral-200 bg-white p-6"
      data-testid="mapsite-dashboard-view-toggle"
    >
      <h2 className="text-lg font-semibold text-neutral-900">Dashboard view</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Show or hide the dashboard on this Mapsite. New Mapsites start with it on.
      </p>
      <label className="mt-4 flex items-center gap-3 text-sm text-neutral-800">
        <input
          type="checkbox"
          checked={enabled}
          disabled={pending}
          data-testid="mapsite-dashboard-view-input"
          onChange={(event) => void onChange(event.target.checked)}
          className="h-4 w-4 rounded border-neutral-300"
        />
        Dashboard view
      </label>
      {message ? <p className="mt-3 text-sm text-neutral-600">{message}</p> : null}
    </section>
  );
}
