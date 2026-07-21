interface EditorPlaceholderFieldProps {
  label: string;
  placeholder?: string;
  multiline?: boolean;
}

export default function EditorPlaceholderField({
  label,
  placeholder = "Coming soon",
  multiline = false,
}: EditorPlaceholderFieldProps) {
  const sharedClassName =
    "w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-400";

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </span>
      {multiline ? (
        <textarea
          disabled
          rows={3}
          placeholder={placeholder}
          className={`${sharedClassName} resize-none`}
        />
      ) : (
        <input disabled type="text" placeholder={placeholder} className={sharedClassName} />
      )}
    </label>
  );
}
