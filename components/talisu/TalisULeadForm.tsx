"use client";

import { useActionState } from "react";
import {
  submitTalisULead,
  type TalisUFormState,
} from "@/lib/talisu/actions";

const initial: TalisUFormState = { ok: false };

type TalisULeadFormProps = {
  source: string;
  heading?: string;
  subheading?: string;
  productOptions?: Array<{ value: string; label: string }>;
  submitLabel?: string;
};

const fieldClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#0069CF] focus:ring-2 focus:ring-[#0069CF]/20";

export default function TalisULeadForm({
  source,
  heading = "Get in touch",
  subheading,
  productOptions,
  submitLabel = "Submit",
}: TalisULeadFormProps) {
  const [state, action, pending] = useActionState(submitTalisULead, initial);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center text-emerald-900">
        <p className="text-lg font-semibold">Thank you</p>
        <p className="mt-2 text-sm">
          Your request was submitted. We will follow up shortly.
        </p>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl bg-white p-6 text-neutral-900 shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/5"
    >
      <div className="mb-2">
        <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
        {subheading ? (
          <p className="mt-1 text-sm text-neutral-500">{subheading}</p>
        ) : null}
      </div>

      <input type="hidden" name="source" value={source} />

      {productOptions && productOptions.length > 0 ? (
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="product">
            Product interest
          </label>
          <select id="product" name="product" className={fieldClass} defaultValue="">
            <option value="">Select a product…</option>
            {productOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="name">
          Full name <span className="text-red-500">*</span>
        </label>
        <input id="name" name="name" required className={fieldClass} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="email">
          Email <span className="text-red-500">*</span>
        </label>
        <input id="email" name="email" type="email" required className={fieldClass} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="phone">
          Phone <span className="text-red-500">*</span>
        </label>
        <input id="phone" name="phone" type="tel" required className={fieldClass} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="location">
          Location
        </label>
        <input
          id="location"
          name="location"
          className={fieldClass}
          placeholder="City, Province/State"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className={fieldClass}
          placeholder="How can we help?"
        />
      </div>

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[#0069CF] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#145de3] disabled:opacity-60"
      >
        {pending ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}
