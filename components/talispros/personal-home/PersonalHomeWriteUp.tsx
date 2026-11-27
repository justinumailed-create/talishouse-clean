import type { ReactNode } from "react";
import {
  parseWriteUp,
  type WriteUpInline,
} from "@/lib/talispros/write-up-format";

function renderInline(nodes: WriteUpInline[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}.${index}`;
    if (node.type === "text") return <span key={key}>{node.value}</span>;
    const children = renderInline(node.children, key);
    if (node.type === "bold") return <strong key={key}>{children}</strong>;
    if (node.type === "italic") return <em key={key}>{children}</em>;
    return <u key={key}>{children}</u>;
  });
}

type PersonalHomeWriteUpProps = {
  text: string;
  className?: string;
  testId?: string;
};

/** Safe write-up renderer. Markers become React elements, never HTML. */
export default function PersonalHomeWriteUp({
  text,
  className,
  testId = "personal-home-write-up",
}: PersonalHomeWriteUpProps) {
  const { paragraphs } = parseWriteUp(text);
  if (!paragraphs.length) return null;
  return (
    <div className={className} data-testid={testId}>
      {paragraphs.map((lines, paragraphIndex) => (
        <div key={paragraphIndex} className="whitespace-pre-line">
          {lines.map((inlines, lineIndex) => (
            <span key={lineIndex}>
              {lineIndex > 0 ? <br /> : null}
              {renderInline(inlines, `${paragraphIndex}.${lineIndex}`)}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
