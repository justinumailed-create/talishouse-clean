"use client";

import { FormEvent, useMemo, useState } from "react";
import { submitAssistedBuildRequest } from "@/app/talispros/build-mapsite/actions";
import { openMapSiteAfterBuildRequest } from "@/app/talispros/build-mapsite/success-actions";

const ACCOUNT_TYPE_OPTIONS = [
  { value: "root", label: "Root Account™" },
  { value: "derivative", label: "Derivative Account™" },
  { value: "adpro-single", label: "Adpros Account™" },
];

interface RahulBuildAssistClientProps {
  initialAudienceType?: string;
}

export default function RahulBuildAssistClient({
  initialAudienceType = "listings",
}: RahulBuildAssistClientProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [audienceType, setAudienceType] = useState(initialAudienceType);
  const [requestedAccountType, setRequestedAccountType] = useState("root");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [waiting, setWaiting] = useState<{
    href: string;
    fastCode: string | null;
  } | null>(null);

  const canSubmit = useMemo(() => {
    return (
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      phone.trim().length > 0 &&
      propertyAddress.trim().length > 0 &&
      audienceType.trim().length > 0 &&
      requestedAccountType.trim().length > 0
    );
  }, [audienceType, email, name, phone, propertyAddress, requestedAccountType]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || saving) return;

    setSaving(true);
    setError("");
    try {
      const result = await submitAssistedBuildRequest({
        name,
        email,
        phone,
        propertyAddress,
        propertyType,
        audienceType,
        requestedAccountType,
        notes,
      });

      if (!result.success || !result.requestId) {
        setError(result.error || "Unable to submit request.");
        return;
      }

      // Create MapSite + owner session, then show waiting screen.
      // Client never enters Rahul’s upload workspace.
      const opened = await openMapSiteAfterBuildRequest({
        requestId: result.requestId,
        fastCode: result.fastCode ?? null,
        accountType: requestedAccountType,
        successPath: "rahul-waiting",
      });
      setWaiting({
        href: opened.href,
        fastCode: opened.fastCode ?? result.fastCode ?? null,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit request."
      );
    } finally {
      setSaving(false);
    }
  }

  if (waiting) {
    const code = waiting.fastCode?.trim().toUpperCase() || null;
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white px-4 py-8">
        <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            Your MapSite™ has been created
          </h1>
          {code ? (
            <p className="mt-3 text-sm font-medium uppercase tracking-[0.08em] text-neutral-500">
              FAST Code: {code}
            </p>
          ) : null}
          <p className="mt-4 text-sm leading-relaxed text-neutral-600 sm:text-base">
            Rahul is now preparing your first TalisBook™. You&apos;ll receive a
            notification as soon as it is ready.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
            You can open your pending MapSite™ anytime. When your book is ready,
            it will appear on your property popup.
          </p>
          <a
            href={waiting.href}
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-900 px-6 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Open My MapSite™
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Have Rahul Build It (No Charge)
        </h1>
        <p className="mt-2 text-sm text-neutral-600 sm:text-base">
          Submit the request and we will generate your FAST Code and create your
          pending MapSite™. Rahul prepares your first TalisBook™.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-neutral-700 sm:col-span-2">
            Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/20"
              required
            />
          </label>
          <label className="text-sm text-neutral-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/20"
              required
            />
          </label>
          <label className="text-sm text-neutral-700">
            Phone
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/20"
              required
            />
          </label>
          <label className="text-sm text-neutral-700 sm:col-span-2">
            Property Address
            <input
              type="text"
              value={propertyAddress}
              onChange={(event) => setPropertyAddress(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/20"
              required
            />
          </label>
          <label className="text-sm text-neutral-700">
            Audience Type
            <input
              type="text"
              value={audienceType}
              onChange={(event) => setAudienceType(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/20"
              required
            />
          </label>
          <label className="text-sm text-neutral-700">
            Requested Account Type
            <select
              value={requestedAccountType}
              onChange={(event) => setRequestedAccountType(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/20"
              required
            >
              {ACCOUNT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-neutral-700">
            Property Type
            <input
              type="text"
              value={propertyType}
              onChange={(event) => setPropertyType(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/20"
            />
          </label>
          <label className="text-sm text-neutral-700 sm:col-span-2">
            Optional Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900/20"
            />
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit || saving}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-900 px-6 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
        >
          {saving ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
