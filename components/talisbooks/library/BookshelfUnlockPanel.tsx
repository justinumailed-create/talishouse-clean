"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { openConnectedBookshelfFromFastCode } from "@/app/talisbooks/fast/actions";
import {
  normalizeBookshelfFastCodeInput,
  type OpenConnectedBookshelfError,
} from "@/lib/talisbooks/bookshelf/lock";
import BookshelfRegisterCta from "@/components/talisbooks/library/BookshelfRegisterCta";

/**
 * Centred over the blurred right shelf on /catalogue/bookshelf:
 * Register CTA + "Already have a FAST Code?" inline field that opens
 * the code's connected bookshelf in the same tab.
 */
export default function BookshelfUnlockPanel() {
  const lock = useT().bookshelf.lock;
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<OpenConnectedBookshelfError | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);

  const errorText: Record<OpenConnectedBookshelfError, string> = {
    empty: lock.errEmpty,
    format: lock.errFormat,
    notFound: lock.errNotFound,
    failed: lock.errFailed,
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = normalizeBookshelfFastCodeInput(value);
    if (!parsed.ok) {
      setError(parsed.reason);
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      const result = await openConnectedBookshelfFromFastCode(parsed.code);
      if (!result.success) {
        setError(result.error);
        setLoading(false);
        inputRef.current?.focus();
        return;
      }
      // Full navigation so the owner session cookie applies before the shelf renders.
      window.location.assign(result.href);
    } catch {
      setError("failed");
      setLoading(false);
    }
  }

  return (
    <div className="talisbooks-library__unlock" data-testid="bookshelf-unlock-panel">
      <BookshelfRegisterCta />
      <button
        type="button"
        className="talisbooks-library__unlock-toggle"
        aria-expanded={open}
        aria-controls={inputId}
        data-testid="bookshelf-have-code"
        onClick={() => setOpen((current) => !current)}
      >
        {lock.haveCode}
      </button>
      {open ? (
        <form
          className="talisbooks-library__unlock-form"
          onSubmit={handleSubmit}
          data-testid="bookshelf-fast-code-form"
          noValidate
        >
          <label htmlFor={inputId} className="sr-only">
            {lock.fieldLabel}
          </label>
          <div className="talisbooks-library__unlock-row">
            <input
              ref={inputRef}
              id={inputId}
              name="fastCode"
              type="text"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                if (error) setError(null);
              }}
              placeholder={lock.placeholder}
              disabled={loading}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="characters"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              data-testid="bookshelf-fast-code-input"
              className="talisbooks-library__unlock-input"
            />
            <button
              type="submit"
              disabled={loading}
              className="talisbooks-library__unlock-submit"
            >
              {loading ? lock.opening : lock.submit}
            </button>
          </div>
          {error ? (
            <p
              id={errorId}
              role="alert"
              className="talisbooks-library__unlock-error"
              data-testid="bookshelf-fast-code-error"
            >
              {errorText[error]}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
