interface EditorSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function EditorSection({
  title,
  description,
  children,
  defaultOpen = true,
}: EditorSectionProps) {
  return (
    <details
      open={defaultOpen}
      className="group border-b border-neutral-200/80 last:border-b-0"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 marker:content-none hover:bg-neutral-50/80">
        <div>
          <p className="text-sm font-medium text-neutral-900">{title}</p>
          {description ? (
            <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
          ) : null}
        </div>
        <span className="text-neutral-400 transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="space-y-3 px-4 pb-4">{children}</div>
    </details>
  );
}
