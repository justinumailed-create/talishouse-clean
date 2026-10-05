import type { ReactNode } from "react";

/**
 * Shared content shell for /talisu pages (Atlist / mkts visual language):
 * centered title, muted subtitle, light surface — cards live in children.
 */
export default function SectionShell({
  title,
  subtitle,
  children,
  maxWidthClass = "max-w-6xl",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Override the default 6xl cap (Register needs more width for SamCart). */
  maxWidthClass?: string;
}) {
  return (
    <div
      className={`${maxWidthClass} mx-auto px-4 py-10 text-neutral-900 sm:px-5 sm:py-14`}
    >
      <header className="mb-8 text-center sm:mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral-600 sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </header>
      {children}
    </div>
  );
}
