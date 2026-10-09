"use client";

import { useEffect, useId, useState } from "react";
import {
  OWNERSHIP_CONTACT_MESSAGE_MAX,
  type OwnershipContactTopic,
} from "@/lib/talispros/ownership-contact";
import {
  formatNanpPhoneInput,
  isValidNanpPhone,
} from "@/lib/talispros/nanp-phone";
import { en } from "@/lib/i18n/dictionaries/en";
import { useT } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/format";

type OwnershipLearnMoreFormProps = {
  /** Recorded silently with the submission (which Learn More was clicked). */
  topic: OwnershipContactTopic | string;
  /** Called from the Done button after a successful submit. */
  onClose: () => void;
};

/** Maps the contact API's English errors to the active locale. */
function localizeApiError(
  error: string | undefined,
  c: {
    apiErrors: { required: string; email: string; save: string; tooLong: string };
    phoneError: string;
  },
): string | undefined {
  if (!error) return undefined;
  const source = en.contactForm;
  if (error === source.apiErrors.required) return c.apiErrors.required;
  if (error === source.apiErrors.email) return c.apiErrors.email;
  if (error === source.apiErrors.save) return c.apiErrors.save;
  if (error === source.apiErrors.tooLong) return c.apiErrors.tooLong;
  if (error === source.phoneError) return c.phoneError;
  return error;
}

/** Compact inputs so the whole form fits the TalisBOT panel without scrolling. */
const INPUT_CLASS =
  "w-full rounded-lg border bg-neutral-50 px-2.5 py-1.5 text-[13px] outline-none focus:border-[#046BD9]";
const LABEL_CLASS = "mb-0.5 block text-[11px] font-medium text-neutral-600";

/**
 * "Propose a Project" form (Quick Reference), rendered inline inside the
 * TalisBOT chat panel (components/TalisBotChat.tsx). Compact layout so it
 * fits the panel without scrolling; the panel header carries the always-visible
 * Back button. The topic is not shown as a field; it is sent with the
 * submission so leads route the same way.
 */
export default function OwnershipLearnMoreForm({
  topic,
  onClose,
}: OwnershipLearnMoreFormProps) {
  const t = useT();
  const c = t.contactForm;
  const topicLabel =
    (c.topics as Record<string, string>)[String(topic)] ?? String(topic);
  const titleId = useId();
  const phoneErrorId = useId();
  const counterId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setError(null);
    setDone(false);
  }, [topic]);

  const phoneInvalid = phoneTouched && !isValidNanpPhone(phone);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPhoneTouched(true);
    if (!isValidNanpPhone(phone)) {
      setError(null);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/ownership-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          topic,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(localizeApiError(data.error, c) || c.genericError);
        return;
      }
      setDone(true);
      setName("");
      setEmail("");
      setPhone("");
      setPhoneTouched(false);
      setMessage("");
    } catch {
      setError(c.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby={titleId}
      className="space-y-2 text-left animate-in fade-in slide-in-from-bottom-2 duration-300"
      data-ownership-topic={topic}
      data-testid="talisbot-propose-form"
    >
      <h4 id={titleId} className="text-[13px] font-semibold leading-snug text-gray-900">
        {c.title}
      </h4>

      {done ? (
        <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 text-center">
          <p className="text-[14px] font-semibold text-neutral-900">
            {c.thanks}
          </p>
          <p className="text-[13px] text-neutral-600">
            {fmt(c.advisor, { topic: topicLabel })}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex rounded-lg bg-[#046BD9] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#035bb8]"
          >
            {c.done}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <input type="hidden" name="topic" value={topic} />
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <label htmlFor={`${titleId}-name`} className={LABEL_CLASS}>
                {c.name}
              </label>
              <input
                id={`${titleId}-name`}
                type="text"
                name="name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${INPUT_CLASS} border-neutral-200`}
                placeholder={c.namePlaceholder}
              />
            </div>
            <div className="min-w-0">
              <label htmlFor={`${titleId}-phone`} className={LABEL_CLASS}>
                {c.phone}
              </label>
              <input
                id={`${titleId}-phone`}
                type="tel"
                name="phone"
                required
                inputMode="tel"
                autoComplete="tel-national"
                value={phone}
                onChange={(e) => setPhone(formatNanpPhoneInput(e.target.value))}
                onBlur={() => setPhoneTouched(true)}
                aria-invalid={phoneInvalid}
                aria-describedby={phoneInvalid ? phoneErrorId : undefined}
                className={`${INPUT_CLASS} ${
                  phoneInvalid ? "border-red-500" : "border-neutral-200"
                }`}
                placeholder={c.phonePlaceholder}
              />
            </div>
          </div>
          {phoneInvalid ? (
            <p id={phoneErrorId} className="-mt-1 text-[11px] leading-snug text-red-600" role="alert">
              {c.phoneError}
            </p>
          ) : null}
          <div>
            <label htmlFor={`${titleId}-email`} className={LABEL_CLASS}>
              {c.email}
            </label>
            <input
              id={`${titleId}-email`}
              type="email"
              name="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${INPUT_CLASS} border-neutral-200`}
              placeholder={c.emailPlaceholder}
            />
          </div>
          <div>
            <label htmlFor={`${titleId}-message`} className={LABEL_CLASS}>
              {c.project}
            </label>
            <textarea
              id={`${titleId}-message`}
              name="message"
              required
              rows={3}
              maxLength={OWNERSHIP_CONTACT_MESSAGE_MAX}
              value={message}
              onChange={(e) =>
                setMessage(e.target.value.slice(0, OWNERSHIP_CONTACT_MESSAGE_MAX))
              }
              aria-describedby={counterId}
              className={`${INPUT_CLASS} block resize-none border-neutral-200 leading-snug`}
              placeholder={c.projectPlaceholder}
            />
            <p
              id={counterId}
              aria-live="polite"
              className={`mt-0.5 text-right text-[10.5px] tabular-nums ${
                message.length >= OWNERSHIP_CONTACT_MESSAGE_MAX
                  ? "font-semibold text-[#046BD9]"
                  : "text-neutral-400"
              }`}
            >
              {fmt(c.projectCounter, {
                count: message.length,
                max: OWNERSHIP_CONTACT_MESSAGE_MAX,
              })}
            </p>
          </div>
          {error ? (
            <p className="text-[12px] text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-lg bg-[#046BD9] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#035bb8] disabled:opacity-60"
          >
            {submitting ? c.sending : c.submit}
          </button>
        </form>
      )}
    </section>
  );
}
