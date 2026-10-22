import type { CSSProperties, ReactNode } from "react";

/** Ralf (Oct 18): working-page content width, about 1,400 px (Catalogue). */
export const WORKING_PAGE_MAX_WIDTH = "87.5rem";

/**
 * Catalogue look for the working pages (Ralf, Oct 18): beige surface,
 * content about 1,400 px wide, one headline line + Team Leader link on top,
 * then a two-column Z-pattern body (left column takes whatever would
 * otherwise bleed past the bottom of a ~1440×800 screen).
 *
 * Sizing is inline (not Tailwind arbitrary values) so it always applies.
 */
export default function WorkingPageShell({
  headline,
  headlineAction,
  title,
  left,
  children,
  leftWidth = "26rem",
  testId,
  contentTestId,
  topRight,
}: {
  /** One-line headline (Catalogue style), centered above the body. */
  headline?: ReactNode;
  /** Pill link beside the headline (WorkingPageCtaLink with Webster/Aisha). */
  headlineAction?: ReactNode;
  /** Visible page title (h1), top-left of the left column. */
  title?: ReactNode;
  /** Left column (Z-pattern: top-left → bottom-left feeds the right column). */
  left?: ReactNode;
  /** Right column / main body. */
  children: ReactNode;
  leftWidth?: string;
  testId?: string;
  contentTestId?: string;
  /** Absolutely positioned top-right control (e.g. Download Demo PDF). */
  topRight?: ReactNode;
}) {
  return (
    <div
      className="talis-working-bg relative w-full px-4 pb-6 pt-3 text-neutral-950 antialiased sm:px-6"
      style={{ minHeight: "calc(100dvh - 68px)" }}
      data-testid={testId}
    >
      {topRight}
      <div
        className="mx-auto w-full"
        style={{ maxWidth: WORKING_PAGE_MAX_WIDTH }}
        data-testid={contentTestId}
      >
        {headline || headlineAction ? (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-2 pb-3 text-center">
            {headline ? (
              <p
                className="text-[15px] font-semibold leading-snug tracking-[0.005em] text-neutral-800 sm:text-[17px]"
                style={{ textWrap: "balance" }}
                data-testid="working-page-headline"
              >
                {headline}
              </p>
            ) : null}
            {headlineAction}
          </div>
        ) : null}
        <div
          className="working-page-grid grid gap-5"
          style={left ? ({ ["--wp-left" as string]: leftWidth } as CSSProperties) : undefined}
        >
          {left ? (
            <aside className="min-w-0 space-y-4" data-testid="working-page-left">
              {title}
              {left}
            </aside>
          ) : null}
          <div className="min-w-0" data-testid="working-page-main">
            {left ? null : title}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
