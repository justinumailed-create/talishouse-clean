"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { BOOKSHELF_REGISTER_PATH } from "@/lib/talisbooks/bookshelf/lock";

/** Primary "Register to Unlock Bookshelf" CTA → /talisu/reg (same tab). */
export default function BookshelfRegisterCta({ className = "" }: { className?: string }) {
  const lock = useT().bookshelf.lock;
  return (
    <Link
      href={BOOKSHELF_REGISTER_PATH}
      data-testid="bookshelf-register-cta"
      className={[
        "inline-flex items-center justify-center rounded-xl bg-[var(--talis-nav-blue)] px-5 py-3 text-sm font-semibold tracking-wide text-white shadow-[0_10px_28px_rgba(4,107,217,0.28)] transition hover:bg-[var(--talis-nav-blue-hover)] active:scale-[0.98]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {lock.register}
    </Link>
  );
}
