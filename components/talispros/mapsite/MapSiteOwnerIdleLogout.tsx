"use client";

import { useEffect, useRef, useState } from "react";
import { logoutMapSiteOwnerSession } from "@/app/talispros/mapsites/actions";
import { useT } from "@/lib/i18n/client";
import {
  MAPSITE_OWNER_ACTIVITY_EVENTS,
  mapsiteOwnerIsIdle,
  mapsiteOwnerShouldWarn,
} from "@/lib/talispros/mapsite-owner-idle";

/**
 * After 15 minutes without activity, end the Mapsite owner/editor session.
 * At the 13-minute mark a dialog offers Continue (resets the timer) or
 * End session (logs out immediately). Public visitors never see this.
 */
export default function MapSiteOwnerIdleLogout({
  enabled,
  fastCode,
  accountType = null,
}: {
  enabled: boolean;
  fastCode: string | null | undefined;
  accountType?: string | null;
}) {
  const t = useT().mapsite.ownerIdle;
  const lastActive = useRef(0);
  const loggingOut = useRef(false);
  const [warning, setWarning] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const start = Date.now();
    lastActive.current = start;
    loggingOut.current = false;

    async function signOut() {
      if (loggingOut.current) return;
      loggingOut.current = true;
      setWarning(false);
      try {
        const result = await logoutMapSiteOwnerSession({
          fastCode,
          accountType,
        });
        window.location.assign(result.href);
      } catch {
        window.location.reload();
      }
    }

    function onActivity() {
      if (loggingOut.current || warningOpen()) return;
      lastActive.current = Date.now();
    }

    function warningOpen() {
      // Read from a data flag so the listener always sees the latest state.
      return document.getElementById("mapsite-owner-idle-warning") != null;
    }

    function check() {
      if (loggingOut.current) return;
      const now = Date.now();
      if (mapsiteOwnerIsIdle(lastActive.current, now)) {
        void signOut();
        return;
      }
      setWarning(mapsiteOwnerShouldWarn(lastActive.current, now));
    }

    for (const event of MAPSITE_OWNER_ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    const timer = window.setInterval(check, 1000);
    check();

    return () => {
      for (const event of MAPSITE_OWNER_ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      window.clearInterval(timer);
    };
  }, [enabled, fastCode, accountType]);

  function continueSession() {
    lastActive.current = Date.now();
    setWarning(false);
  }

  function endSession() {
    lastActive.current = 0;
    setWarning(false);
    void (async () => {
      if (loggingOut.current) return;
      loggingOut.current = true;
      try {
        const result = await logoutMapSiteOwnerSession({
          fastCode,
          accountType,
        });
        window.location.assign(result.href);
      } catch {
        window.location.reload();
      }
    })();
  }

  if (!enabled || !warning) return null;

  return (
    <div
      id="mapsite-owner-idle-warning"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mapsite-owner-idle-title"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-neutral-900 shadow-xl">
        <h2
          id="mapsite-owner-idle-title"
          className="m-0 text-[18px] font-semibold tracking-tight"
        >
          {t.title}
        </h2>
        <p className="mt-2 text-[14px] leading-snug text-neutral-700">{t.body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={endSession}
            className="inline-flex min-h-10 items-center rounded-lg px-3 text-[14px] font-medium text-neutral-800 ring-1 ring-black/10 transition hover:bg-neutral-50"
          >
            {t.end}
          </button>
          <button
            type="button"
            onClick={continueSession}
            className="inline-flex min-h-10 items-center rounded-lg bg-[#046BD9] px-3 text-[14px] font-semibold text-white transition hover:bg-[#0358b3]"
          >
            {t.continue}
          </button>
        </div>
      </div>
    </div>
  );
}
