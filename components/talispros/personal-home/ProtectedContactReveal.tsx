"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import {
  personalHomeMailtoHref,
  personalHomeTelHref,
} from "@/lib/talispros/personal-home";
import type {
  PersonalHomeContactField,
  PersonalHomeContactSurface,
} from "@/lib/talispros/personal-home-contact";

type ProtectedContactRevealProps = {
  code: string;
  field: PersonalHomeContactField;
  surface?: PersonalHomeContactSurface;
  className?: string;
  testId?: string;
};

/**
 * Public click-to-reveal for a phone number or email. The value is fetched
 * only after a click, so the first HTML and RSC payload stay empty.
 */
export default function ProtectedContactReveal({
  code,
  field,
  surface = "home",
  className,
  testId,
}: ProtectedContactRevealProps) {
  const { personalHome } = useT();
  const [value, setValue] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function reveal() {
    if (busy || value) return;
    setBusy(true);
    setError(false);
    try {
      const response = await fetch("/api/personal-home/contact", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, field, surface }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; value?: string }
        | null;
      const next = payload?.ok && typeof payload.value === "string" ? payload.value.trim() : "";
      if (!response.ok || !next) {
        setError(true);
        return;
      }
      setValue(next);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const label = field === "phone" ? personalHome.showPhone : personalHome.showEmail;
  const href =
    value && field === "phone"
      ? personalHomeTelHref(value)
      : value
        ? personalHomeMailtoHref(value)
        : null;

  return (
    <p className={className} data-testid={testId ?? `protected-contact-${field}`}>
      {value ? (
        href ? (
          <a href={href} className="underline-offset-2 hover:underline">
            {value}
          </a>
        ) : (
          value
        )
      ) : (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void reveal();
          }}
          disabled={busy}
          data-testid={`protected-contact-reveal-${field}`}
          className="underline-offset-2 hover:underline disabled:opacity-60"
        >
          {busy ? personalHome.contactRevealBusy : error ? personalHome.contactUnavailable : label}
        </button>
      )}
    </p>
  );
}
