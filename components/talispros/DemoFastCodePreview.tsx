"use client";

import { useT } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/format";
import { useEffect, useState } from "react";
import {
  extractInitials,
  splitPersonName,
  validateAndNormalizeFastCodeInput,
} from "@/validators/fast-code.validator";

type DemoFastCodePreviewProps = {
  firstName: string;
  lastName: string;
  middleName?: string;
  className?: string;
};

/**
 * Live FAST Code™ preview for demo / claim flows.
 * Uses the same initials rules as issuance (letters+digits; names may have &/+;
 * the code itself never contains &/+). Sequence is illustrative until submit.
 */
export default function DemoFastCodePreview({
  firstName,
  lastName,
  middleName,
  className = "",
}: DemoFastCodePreviewProps) {
  const d = useT().demo;
  const [preview, setPreview] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const full = `${firstName} ${lastName}`.trim();
    if (!firstName.trim() || !lastName.trim()) {
      setPreview(null);
      setHint(null);
      return;
    }
    try {
      const normalized = validateAndNormalizeFastCodeInput({
        firstName,
        middleName: middleName || null,
        lastName,
      });
      const initials = extractInitials(normalized).replace(/[^a-z]/g, "");
      if (!/^[a-z]{2,3}$/.test(initials)) {
        setPreview(null);
        setHint(d.previewNeedName);
        return;
      }
      setPreview(`${initials}##`);
      setHint(
        fmt(d.previewBased, { name: full, initials: initials.toUpperCase() }),
      );
    } catch (error) {
      setPreview(null);
      setHint(
        error instanceof Error
          ? error.message
          : d.previewError,
      );
    }
  }, [firstName, lastName, middleName, d]);

  if (!preview && !hint) return null;

  return (
    <div
      className={`rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 ${className}`}
      aria-live="polite"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
        {d.previewTitle}
      </p>
      {preview ? (
        <p className="mt-1 font-mono text-lg font-semibold tracking-wide text-neutral-900">
          {preview.toUpperCase()}
        </p>
      ) : null}
      {hint ? (
        <p className="mt-1 text-xs leading-relaxed text-neutral-600">{hint}</p>
      ) : null}
    </div>
  );
}

/** Helper for single-line name fields that need splitPersonName first. */
export function previewFastCodeFromFullName(fullName: string): string | null {
  try {
    const { firstName, lastName } = splitPersonName(fullName);
    if (!firstName || !lastName) return null;
    const normalized = validateAndNormalizeFastCodeInput({
      firstName,
      lastName,
    });
    const initials = extractInitials(normalized).replace(/[^a-z]/g, "");
    if (!/^[a-z]{2,3}$/.test(initials)) return null;
    return `${initials}##`;
  } catch {
    return null;
  }
}
