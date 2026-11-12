"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";

/** Terms and Privacy, the same pair on every public footer and menu. */
export default function LegalLinks({
  className = "",
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const t = useT().pmc;
  const link =
    tone === "light"
      ? "text-white/80 underline-offset-2 hover:text-white hover:underline"
      : "text-neutral-600 underline-offset-2 hover:text-neutral-950 hover:underline";
  return (
    <nav aria-label={t.terms} className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] ${className}`}>
      <Link href="/terms" className={link}>
        {t.terms}
      </Link>
      <Link href="/privacy" className={link}>
        {t.privacy}
      </Link>
    </nav>
  );
}
