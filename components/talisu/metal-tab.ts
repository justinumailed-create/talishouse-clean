/**
 * Metal tab buttons shared by Aisha's structure tabs (/talisu/reg) and the
 * Markets sidebar (/talisu/mkts). Pair METAL_TAB with METAL_TAB_SELECTED or
 * METAL_TAB_UNSELECTED, set style={{ backgroundImage: ADVISER_METAL_BG }},
 * and render METAL_TAB_SHEEN plus a METAL_TAB_LABEL span inside.
 */
export const METAL_TAB = [
  "group relative flex min-h-14 w-full items-center justify-center overflow-hidden rounded-xl border px-2 py-2 no-underline",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_0_-1px_0_rgba(0,0,0,0.22),0_6px_14px_rgba(0,0,0,0.22)]",
  "transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800",
].join(" ");

export const METAL_TAB_SELECTED =
  "scale-[0.98] border-neutral-700/70 ring-1 ring-neutral-700/60";

export const METAL_TAB_UNSELECTED =
  "border-white/55 hover:brightness-105 active:scale-[0.98]";

/** Diagonal sheen overlay (aria-hidden span). */
export const METAL_TAB_SHEEN =
  "pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-black/20";

export const METAL_TAB_LABEL =
  "relative z-10 text-center text-[12px] font-semibold tracking-wide text-neutral-900 sm:text-[14px]";
