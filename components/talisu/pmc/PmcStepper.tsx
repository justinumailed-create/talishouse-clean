import Link from "next/link";
import { PMC_PATHS, pmcHref } from "@/lib/talispros/mapsite-contract";

const STEP_PATHS = [
  PMC_PATHS.talispros,
  PMC_PATHS.mediaDirectory,
  PMC_PATHS.contract,
  PMC_PATHS.register,
];

/** Talispros → Media Directory → Contract → Register progress rail. */
export default function PmcStepper({
  current,
  labels,
  fastCode,
  tone = "light",
}: {
  current: 1 | 2 | 3 | 4;
  labels: readonly string[];
  fastCode?: string | null;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <nav aria-label="Steps" className="w-full">
      <ol className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {labels.map((label, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          const base =
            "flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold transition sm:text-[13px]";
          const style = active
            ? dark
              ? "bg-white text-[#0b2545]"
              : "bg-[#0069CF] text-white shadow-sm"
            : done
              ? dark
                ? "bg-white/15 text-white hover:bg-white/25"
                : "bg-[#0069CF]/10 text-[#0069CF] hover:bg-[#0069CF]/15"
              : dark
                ? "bg-white/5 text-white/60"
                : "bg-black/5 text-neutral-500";
          const bubble = (
            <span
              className={`grid h-5 w-5 place-items-center rounded-full text-[11px] ${
                active ? (dark ? "bg-[#0069CF] text-white" : "bg-white text-[#0069CF]") : "bg-black/10"
              }`}
            >
              {done ? "✓" : n}
            </span>
          );
          return (
            <li key={label} className="flex items-center gap-1.5 sm:gap-2">
              {done ? (
                <Link href={pmcHref(STEP_PATHS[i]!, { fastCode })} className={`${base} ${style}`}>
                  {bubble}
                  {label}
                </Link>
              ) : (
                <span aria-current={active ? "step" : undefined} className={`${base} ${style}`}>
                  {bubble}
                  {label}
                </span>
              )}
              {n < labels.length ? (
                <span aria-hidden className={dark ? "text-white/40" : "text-neutral-300"}>
                  →
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
