import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared chrome for /agent/* sign-in pages: soft background, centred
 * ~400px card, logo + "Agent Portal" label, and a quiet footer.
 */
export default function AgentAuthShell({
  title,
  subtitle,
  children,
  below,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  below?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#f6f8fb] text-neutral-900 [color-scheme:light]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(30,78,216,0.10),rgba(246,248,251,0))]"
      />
      <main className="relative flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-[400px]">
          <div className="mb-7 flex flex-col items-center gap-3">
            <Link href="/" className="rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4ED8]/50">
              <Image src="/logo-mark.png" alt="Talispros" width={44} height={47} priority className="h-11 w-auto" />
            </Link>
            <span className="rounded-full border border-[#1E4ED8]/15 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1E4ED8] shadow-sm">
              Agent Portal
            </span>
          </div>

          <div className="rounded-2xl border border-neutral-200/80 bg-white px-6 py-8 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-12px_rgba(16,24,40,0.12)] sm:px-8 sm:py-9">
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-neutral-900">{title}</h1>
            {subtitle ? <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{subtitle}</p> : null}
            <div className="mt-7">{children}</div>
          </div>

          {below ? <div className="mt-6 text-center text-sm text-neutral-500">{below}</div> : null}
        </div>
      </main>

      <footer className="relative px-4 pb-6 pt-2">
        <div className="mx-auto flex max-w-[400px] flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-neutral-400">
          <span>© {new Date().getFullYear()} Talispros™</span>
          <Link href="/privacy" className="hover:text-neutral-600 hover:underline">Privacy</Link>
          <span className="inline-flex items-center gap-1">
            <svg aria-hidden viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
              <path fillRule="evenodd" d="M10 1.5a4.5 4.5 0 0 0-4.5 4.5v2H5a2 2 0 0 0-2 2v6.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-.5V6A4.5 4.5 0 0 0 10 1.5Zm3 6.5V6a3 3 0 1 0-6 0v2h6Z" clipRule="evenodd" />
            </svg>
            Secure sign-in
          </span>
        </div>
      </footer>
    </div>
  );
}
