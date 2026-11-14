"use client";

import { useT } from "@/lib/i18n/client";

export default function PrintMeButton() {
  const label = useT().legal.printMe;
  return (
    <button
      type="button"
      className="legal-print-hide mt-10 inline-flex min-h-11 items-center rounded-full bg-neutral-950 px-5 text-[16px] font-semibold text-white"
      data-testid="legal-print"
      onClick={() => window.print()}
    >
      {label}
    </button>
  );
}
