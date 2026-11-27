"use client";

import { useState } from "react";
import { setGetOwnMapsiteButtonAction } from "@/app/admin/dashboard/get-own-mapsite-actions";
import { cardClass } from "@/components/admin/ui";

/**
 * Site-wide Admin control on /admin/dashboard.
 * Default is on. Saves to the existing GlobalContent table (no migration).
 */
export default function GetOwnMapsiteToggle({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onChange(next: boolean) {
    setPending(true);
    setMessage("");
    const result = await setGetOwnMapsiteButtonAction(next);
    setPending(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setEnabled(next);
    setMessage(next ? "The button is on." : "The button is off.");
  }

  return (
    <section className={`${cardClass} p-6`} data-testid="get-own-mapsite-toggle">
      <h2 className="text-lg font-semibold text-neutral-900">
        Get your own Mapsite button
      </h2>
      <p className="mt-1 text-sm text-neutral-500">
        Show or hide the white &quot;Get your own Mapsite&quot; button on personal home
        pages, next to Open Mapsite. It links to /home-market. The setting is on
        by default. If an owner already added the same button (as on RM22), only
        one is shown.
      </p>
      <label className="mt-4 flex items-center gap-3 text-sm text-neutral-800">
        <input
          type="checkbox"
          checked={enabled}
          disabled={pending}
          data-testid="get-own-mapsite-toggle-input"
          onChange={(event) => void onChange(event.target.checked)}
          className="h-4 w-4 rounded border-neutral-300"
        />
        Show &quot;Get your own Mapsite&quot; button
      </label>
      {message ? <p className="mt-3 text-sm text-neutral-600">{message}</p> : null}
    </section>
  );
}
