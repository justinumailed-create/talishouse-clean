interface EditorFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export default function EditorField({
  label,
  value,
  placeholder,
  multiline = false,
  disabled = false,
  onChange,
}: EditorFieldProps) {
  const sharedClassName =
    "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-400";

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </span>
      {multiline ? (
        <textarea
          rows={3}
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${sharedClassName} resize-none`}
        />
      ) : (
        <input
          type="text"
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={sharedClassName}
        />
      )}
    </label>
  );
}
