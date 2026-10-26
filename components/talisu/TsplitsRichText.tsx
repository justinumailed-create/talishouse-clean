import { Fragment, type ReactNode } from "react";

/**
 * Renders the TSPLITS™ inline markup: **bold**, _italic_ and {{phrase}}.
 * {{phrase}} is the PDF's rhetorical "[ fill in the blank ]": shown as an
 * intentional reader prompt, "(phrase)" in blue italics with a dotted rule.
 */
const TOKEN = /(\*\*[^*]+\*\*|_[^_]+_|\{\{[^}]+\}\})/g;

export function renderTsplitsInline(text: string): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-neutral-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("{{") && part.endsWith("}}")) {
      return (
        <em
          key={i}
          data-testid="tsplits-reader-prompt"
          className="whitespace-nowrap font-medium italic text-[#0069CF] underline decoration-[#0069CF]/45 decoration-dotted underline-offset-4"
        >
          ({part.slice(2, -2)})
        </em>
      );
    }
    if (part.length > 2 && part.startsWith("_") && part.endsWith("_")) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export default function TsplitsRichText({ text }: { text: string }) {
  return <>{renderTsplitsInline(text)}</>;
}
