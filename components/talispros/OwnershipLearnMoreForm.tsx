"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  OWNERSHIP_CONTACT_TOPICS,
  type OwnershipContactTopic,
} from "@/lib/talispros/ownership-contact";

type OwnershipLearnMoreFormProps = {
  topic: OwnershipContactTopic | string;
  open: boolean;
  onClose: () => void;
};

export default function OwnershipLearnMoreForm({
  topic,
  open,
  onClose,
}: OwnershipLearnMoreFormProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(topic);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedTopic(topic);
      setError(null);
      setDone(false);
    }
  }, [open, topic]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
          topic: selectedTopic,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div>
            <h2
              id={titleId}
              className="text-[16px] font-semibold text-neutral-900"
            >
              Learn More
            </h2>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              Tell us about your interest — we&apos;ll follow up.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-0.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="Close contact form"
          >
            ✕
          </button>
        </div>

        {done ? (
          <div className="space-y-4 px-5 py-8 text-center">
            <p className="text-[15px] font-semibold text-neutral-900">
              Thanks — your message is on its way.
            </p>
            <p className="text-sm text-neutral-600">
              A Talispros™ advisor will contact you about {selectedTopic}.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex rounded-lg bg-[#046BD9] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#035bb8]"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 px-5 py-5">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-neutral-600">
                Topic
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-[#046BD9]"
                required
              >
                {OWNERSHIP_CONTACT_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-neutral-600">
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-[#046BD9]"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-neutral-600">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-[#046BD9]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-neutral-600">
                Phone <span className="text-neutral-400">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-[#046BD9]"
                placeholder="+1…"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-neutral-600">
                Message
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-[#046BD9]"
                placeholder="What would you like to know?"
              />
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
              {submitting ? "Sending…" : "Send inquiry"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
