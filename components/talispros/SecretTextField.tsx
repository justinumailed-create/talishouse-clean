"use client";

import { useState, type InputHTMLAttributes } from "react";
import { useT } from "@/lib/i18n/client";

type SecretTextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "autoComplete" | "autoCorrect" | "spellCheck"
> & {
  /** Wrapper classes. The input fills this box; the reveal control sits inside it. */
  wrapperClassName?: string;
  autoComplete?: "off" | "new-password" | "current-password";
};

/**
 * Masked entry for an admin FAST Code, agent password, or access code.
 * The field has no default name, so a failed submit cannot place the value in the URL.
 * Reveal stays on this control and is never written to a log or toast.
 */
export default function SecretTextField({
  wrapperClassName = "relative w-full",
  className = "",
  autoComplete = "new-password",
  style,
  ...props
}: SecretTextFieldProps) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const reveal = t.common.showSecret;
  const hide = t.common.hideSecret;

  return (
    <div className={wrapperClassName}>
      <input
        {...props}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        autoCorrect="off"
        spellCheck={false}
        data-1p-ignore="true"
        data-lpignore="true"
        data-form-type="other"
        style={{ ...style, paddingRight: "4.75rem" }}
        className={className}
      />
      <button
        type="button"
        aria-pressed={visible}
        aria-label={visible ? hide : reveal}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setVisible((current) => !current);
        }}
        className="absolute inset-y-1 right-1 z-10 rounded-lg px-2 text-[12px] font-semibold text-neutral-500 hover:bg-black/5 hover:text-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#046BD9]/30"
      >
        {visible ? hide : reveal}
      </button>
    </div>
  );
}
