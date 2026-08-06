"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildEbookChoiceHref } from "@/lib/talispros/ebook-choice";

const STORAGE_PREFIX = "talispros_mapsite_guided_prompt_dismissed:";

function accountKey(fastCode: string | null | undefined, mapsiteId: string): string {
  const code = fastCode?.trim().toLowerCase();
  if (code && code !== "demo") return code;
  return mapsiteId;
}

function storageKey(account: string): string {
  return `${STORAGE_PREFIX}${account}`;
}

function readDismissed(account: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(storageKey(account)) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(account: string): void {
  try {
    window.localStorage.setItem(storageKey(account), "1");
  } catch {
    // Ignore quota / private mode failures — prompt still closes for this visit.
  }
}

interface MapSiteStartHereOverlayProps {
  mapsiteId: string;
  /** FAST Code for this account — dismiss is permanent per account. */
  fastCode?: string | null;
  accountType?: string | null;
  requestId?: string | null;
  /** Top of the open property flag card (px from map root). */
  tipTop: number;
  /** Horizontal center of the flag (px from left of map root). */
  centerX: number | null;
  /** Owner Mapsite™ only — visitors never enable this. */
  enabled: boolean;
}

/**
 * Guided onboarding prompt for a new Mapsite™ owner.
 * Points at the open property flag; continues to the E-Book decision step.
 */
export default function MapSiteStartHereOverlay({
  mapsiteId,
  fastCode = null,
  accountType = null,
  requestId = null,
  tipTop,
  centerX,
  enabled,
}: MapSiteStartHereOverlayProps) {
  const router = useRouter();
  const account = accountKey(fastCode, mapsiteId);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled || !account) {
      setVisible(false);
      return;
    }
    setVisible(!readDismissed(account));
  }, [enabled, account]);

  if (!visible) return null;

  const left = centerX != null ? `${centerX}px` : "50%";
  const top = Math.max(8, tipTop - 56);

  function continueToEbookChoice() {
    writeDismissed(account);
    setVisible(false);
    router.push(
      buildEbookChoiceHref({
        fastCode,
        mapsiteId,
        accountType,
        requestId,
        yes: true,
      })
    );
  }

  return (
    <div
      className="pointer-events-none absolute z-40 -translate-x-1/2"
      style={{ left, top }}
      role="status"
      aria-live="polite"
    >
      <div className="mapsite-guided-prompt">
        <button
          type="button"
          onClick={continueToEbookChoice}
          className="pointer-events-auto flex max-w-[min(92vw,16rem)] flex-col items-center gap-0.5 rounded-2xl border border-white/35 bg-neutral-950/72 px-3.5 py-2 text-center shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-sm transition hover:bg-neutral-950/85"
          aria-label="Start here. Continue to choose your E-Book."
        >
          <span className="mapsite-guided-prompt__arrow text-[15px] leading-none" aria-hidden="true">
            👇
          </span>
          <span className="text-[13px] font-semibold tracking-wide text-white">
            Start Here
          </span>
          <span className="text-[11px] font-normal leading-snug text-white/80">
            Open your first Talisbook™
          </span>
        </button>
      </div>
    </div>
  );
}
