import type { ReactNode } from "react";

/**
 * Shared one-line top strip (Catalogue look): a centred headline with an
 * optional Team Leader pill beside it. Used by /catalogue (TopBoundFlipbook)
 * and the Mapsites page so text colour, weight, size and pill alignment stay
 * identical. Typography lives in `.talis-top-strip__text` (app/globals.css).
 */
export default function TopStrip({
  headline,
  action,
  className = "",
  textClassName = "",
  testId,
  textTestId,
}: {
  headline: ReactNode;
  action?: ReactNode;
  className?: string;
  textClassName?: string;
  testId?: string;
  textTestId?: string;
}) {
  return (
    <div className={`talis-top-strip ${className}`.trim()} data-testid={testId}>
      <p className={`talis-top-strip__text ${textClassName}`.trim()} data-testid={textTestId}>
        {headline}
      </p>
      {action}
    </div>
  );
}
