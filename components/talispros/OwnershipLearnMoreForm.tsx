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
  /** Called from the Back / Close buttons. */
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

const INPUT_CLASS =
  "w-full rounded-xl border bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-[#046BD9]";

/**
 * Ownership Learn More contact form, rendered inline inside the TalisBOT
 * chat panel (components/TalisBotChat.tsx). The topic is not shown as a
 * field; it is sent with the submission so leads route the same way.
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
      className="space-y-3 p-1 text-left animate-in fade-in slide-in-from-bottom-2 duration-300"
      data-ownership-topic={topic}
    >
      <div>
        <h4 id={titleId} className="text-[15px] font-semibold text-gray-900">
          {c.title}
        </h4>
        <p className="mt-0.5 text-[12.5px] text-neutral-500">
          {c.intro}
        </p>
      </div>

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
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="hidden" name="topic" value={topic} />
          <div>
            <label className="mb-1 block text-[12px] font-medium text-neutral-600">
              {c.name}
            </label>
            <input
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
          <div>
            <label className="mb-1 block text-[12px] font-medium text-neutral-600">
              {c.email}
            </label>
            <input
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
            <label className="mb-1 block text-[12px] font-medium text-neutral-600">
              {c.phone}
            </label>
            <input
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
            {phoneInvalid ? (
              <p id={phoneErrorId} className="mt-1 text-[12px] text-red-600" role="alert">
                {c.phoneError}
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-neutral-600">
              {c.project}
            </label>
            <textarea
              name="message"
              required
              rows={4}
              maxLength={OWNERSHIP_CONTACT_MESSAGE_MAX}
              value={message}
              onChange={(e) =>
                setMessage(e.target.value.slice(0, OWNERSHIP_CONTACT_MESSAGE_MAX))
              }
              aria-describedby={counterId}
              className={`${INPUT_CLASS} resize-y border-neutral-200`}
              placeholder={c.projectPlaceholder}
            />
            <p
              id={counterId}
              aria-live="polite"
              className={`mt-1 text-right text-[11px] tabular-nums ${
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
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#046BD9] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#035bb8] disabled:opacity-60"
          >
            {submitting ? c.sending : c.submit}
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={onClose}
        className="text-sm font-medium text-gray-400 hover:text-black transition px-1"
      >
        {c.back}
      </button>
    </section>
  );
}
