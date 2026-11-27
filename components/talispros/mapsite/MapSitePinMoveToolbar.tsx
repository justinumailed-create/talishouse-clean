"use client";

import { useT } from "@/lib/i18n/client";

export type PinMoveStatus = "saving" | "saved" | "failed" | null;

/**
 * Owner / editor only (Ralf, Nov 27 item #7): unlink misplaced PINs from
 * their address location and drag them to the exact spot. Each drop saves
 * at once. Visitors never see this control and their PINs never drag.
 */
export default function MapSitePinMoveToolbar({
  active,
  status,
  onToggle,
}: {
  active: boolean;
  status: PinMoveStatus;
  onToggle: () => void;
}) {
  const copy = useT().mapsite.pinMove;
  const message =
    status === "saving"
      ? copy.saving
      : status === "saved"
        ? copy.saved
        : status === "failed"
          ? copy.failed
          : null;
  return (
    <div
      className="pointer-events-none fixed bottom-4 left-1/2 z-40 flex w-[min(94vw,34rem)] -translate-x-1/2 flex-col items-center gap-2"
      data-testid="mapsite-pin-move"
    >
      {active ? (
        <div
          className="pointer-events-auto w-full rounded-2xl bg-white px-4 py-3 text-[14px] leading-snug text-neutral-900 shadow-[0_12px_40px_rgba(0,0,0,0.28)] ring-2 ring-[#046BD9]"
          data-testid="mapsite-pin-move-banner"
        >
          <p className="m-0">{copy.banner}</p>
          {message ? (
            <p
              role="status"
              data-testid="mapsite-pin-move-status"
              className={`m-0 mt-1.5 font-semibold ${status === "failed" ? "text-red-700" : status === "saved" ? "text-emerald-700" : "text-neutral-600"}`}
            >
              {message}
            </p>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        data-testid="mapsite-pin-move-toggle"
        className={`pointer-events-auto inline-flex min-h-10 items-center justify-center rounded-full px-5 text-[14px] font-semibold shadow-[0_6px_14px_rgba(0,0,0,0.25)] transition ${active ? "bg-[#046BD9] text-white hover:bg-[#0558b3]" : "bg-white text-neutral-900 ring-1 ring-black/15 hover:bg-neutral-50"}`}
      >
        {active ? copy.done : copy.start}
      </button>
    </div>
  );
}
