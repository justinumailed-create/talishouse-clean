"use client";

import { useRef, useState } from "react";
import { submitMapSiteInterest } from "@/lib/mapsite-interest-service";

interface MapSiteContactFormProps {
  fastCode: string;
  agentName: string;
  agentEmail: string;
  embedded?: boolean;
  fillHeight?: boolean;
}

const COUNTRY_CODES = [
  { code: "+1", label: "🇨🇦 +1" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+61", label: "🇦🇺 +61" },
  { code: "+49", label: "🇩🇪 +49" },
  { code: "+33", label: "🇫🇷 +33" },
];

const inputClass =
  "w-full rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-500 transition-colors bg-white";

function FieldLabel({
  htmlFor,
  children,
  required = false,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm text-neutral-800 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

const emptyForm = {
  inquiryDate: "",
  firstName: "",
  lastName: "",
  email: "",
  countryCode: "+1",
  mobile: "",
  subject: "",
  message: "",
};

export default function MapSiteContactForm({
  fastCode,
  agentName,
  agentEmail,
  embedded = false,
  fillHeight = false,
}: MapSiteContactFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [attachmentName, setAttachmentName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = new FormData(event.currentTarget);
    payload.set("fastCode", fastCode);

    const result = await submitMapSiteInterest(payload);

    if (result.success) {
      setSubmitted(true);
      setFormData(emptyForm);
      setAttachmentName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      setError(result.error || "Failed to submit your interest.");
    }

    setSubmitting(false);
  }

  const formBody = submitted ? (
    <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
      Thank you — your interest has been submitted.
    </p>
  ) : (
    <form
      onSubmit={handleSubmit}
      className={fillHeight ? "flex flex-col flex-1 min-h-0 gap-3" : "space-y-3"}
    >
      <div>
        <FieldLabel htmlFor="inquiryDate" required>
          Date
        </FieldLabel>
        <input
          id="inquiryDate"
          name="inquiryDate"
          type="date"
          required
          value={formData.inquiryDate}
          onChange={(e) =>
            setFormData((current) => ({ ...current, inquiryDate: e.target.value }))
          }
          className={inputClass}
        />
      </div>

      <div>
        <FieldLabel htmlFor="firstName" required>
          First Name
        </FieldLabel>
        <input
          id="firstName"
          name="firstName"
          type="text"
          required
          value={formData.firstName}
          onChange={(e) =>
            setFormData((current) => ({ ...current, firstName: e.target.value }))
          }
          className={inputClass}
        />
      </div>

      <div>
        <FieldLabel htmlFor="lastName" required>
          Last Name
        </FieldLabel>
        <input
          id="lastName"
          name="lastName"
          type="text"
          required
          value={formData.lastName}
          onChange={(e) =>
            setFormData((current) => ({ ...current, lastName: e.target.value }))
          }
          className={inputClass}
        />
      </div>

      <div>
        <FieldLabel htmlFor="email" required>
          Email
        </FieldLabel>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={(e) =>
            setFormData((current) => ({ ...current, email: e.target.value }))
          }
          className={inputClass}
        />
      </div>

      <div>
        <FieldLabel htmlFor="mobile">Mobile Telephone</FieldLabel>
        <div className="flex gap-2">
          <select
            id="countryCode"
            name="countryCode"
            value={formData.countryCode}
            onChange={(e) =>
              setFormData((current) => ({ ...current, countryCode: e.target.value }))
            }
            className="w-[110px] shrink-0 rounded border border-neutral-300 px-2 py-2 text-sm bg-white focus:outline-none focus:border-neutral-500"
          >
            {COUNTRY_CODES.map((option, index) => (
              <option key={`${option.code}-${index}`} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            id="mobile"
            name="mobile"
            type="tel"
            value={formData.mobile}
            onChange={(e) =>
              setFormData((current) => ({ ...current, mobile: e.target.value }))
            }
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="subject">Subject</FieldLabel>
        <input
          id="subject"
          name="subject"
          type="text"
          value={formData.subject}
          onChange={(e) =>
            setFormData((current) => ({ ...current, subject: e.target.value }))
          }
          className={inputClass}
        />
      </div>

      <div className={fillHeight ? "flex flex-col flex-1 min-h-0" : undefined}>
        <FieldLabel htmlFor="message">Message</FieldLabel>
        <textarea
          id="message"
          name="message"
          rows={fillHeight ? undefined : 4}
          value={formData.message}
          onChange={(e) =>
            setFormData((current) => ({ ...current, message: e.target.value }))
          }
          className={
            fillHeight
              ? `${inputClass} flex-1 min-h-[100px] resize-none`
              : `${inputClass} resize-none`
          }
        />
      </div>

      <div>
        <FieldLabel htmlFor="attachment">Attachment</FieldLabel>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            id="attachment"
            name="attachment"
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setAttachmentName(file?.name || "");
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 bg-white hover:bg-neutral-50"
          >
            Choose file
          </button>
          <span className="text-sm text-neutral-500 truncate">
            {attachmentName || "No file chosen"}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex items-end justify-between gap-4 pt-1 shrink-0">
        <p className="text-[11px] leading-snug text-neutral-500 max-w-[220px]">
          This site is protected by reCAPTCHA and the Google{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Terms of Service
          </a>{" "}
          apply.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="shrink-0 rounded bg-[#1a73e8] px-6 py-2 text-sm font-medium text-white hover:bg-[#1557b0] transition-colors disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>
  );

  if (embedded) {
    return (
      <div className={fillHeight ? "p-5 flex flex-col flex-1 min-h-0" : "p-5"}>
        {formBody}
      </div>
    );
  }

  return (
    <section className="bg-[#f8f8f7]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
        <div className="max-w-xl mx-auto rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 text-center sm:text-left">
            <h2 className="text-lg font-semibold text-neutral-900">Contact</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Reach {agentName}
              {agentEmail ? ` at ${agentEmail}` : ""}.
            </p>
          </div>
          {formBody}
        </div>
      </div>
    </section>
  );
}
