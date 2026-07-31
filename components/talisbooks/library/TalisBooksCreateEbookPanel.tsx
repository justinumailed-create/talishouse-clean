"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createOrUpdateMapSiteEbookAction } from "@/app/talisbooks/library/actions";
import type { TalisBooksEntitlements } from "@/lib/talisbooks/entitlements";

interface TalisBooksCreateEbookPanelProps {
  fastCode: string;
  paymentReceived: boolean;
  registrationHref: string;
  entitlements?: TalisBooksEntitlements | null;
  initialTitle?: string;
  initialSubtitle?: string;
  initialDescription?: string;
  hasExistingBook?: boolean;
}

export default function TalisBooksCreateEbookPanel({
  fastCode,
  paymentReceived,
  registrationHref,
  entitlements = null,
  initialTitle = "",
  initialSubtitle = "",
  initialDescription = "",
  hasExistingBook = false,
}: TalisBooksCreateEbookPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(!hasExistingBook);
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canCreateFirst = entitlements?.canCreateFirstDraft ?? !hasExistingBook;
  const canCreateMore = entitlements?.canCreateAdditionalBook ?? false;
  const canCreate =
    (hasExistingBook && (entitlements?.activated || paymentReceived || canCreateFirst)) ||
    canCreateFirst ||
    canCreateMore;
  const activated = entitlements?.activated ?? false;
  const bookQuota = entitlements?.bookQuota ?? 1;
  const accountKind = entitlements?.accountKind ?? "root";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!hasExistingBook && !canCreateFirst && !canCreateMore) {
      router.push(entitlements?.registrationHref || registrationHref);
      return;
    }

    setSaving(true);
    const result = await createOrUpdateMapSiteEbookAction({
      fastCode,
      title,
      subtitle,
      description,
    });
    setSaving(false);

    if (!result.success) {
      if (result.registrationHref) {
        router.push(result.registrationHref);
        return;
      }
      setError(result.error || "Could not save ebook.");
      return;
    }

    setMessage(
      hasExistingBook
        ? "Ebook updated."
        : activated
          ? "Ebook created on your shelf."
          : "First draft TalisBook™ created. Activate your account to publish and unlock more books.",
    );
    setOpen(false);
    router.refresh();
  }

  if (!hasExistingBook && !canCreate) {
    return (
      <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
        <p className="font-semibold">Activate to create more TalisBooks™</p>
        <p className="mt-1 text-amber-900/80">
          Your first draft is already used. Activate your {accountKind} account to unlock
          up to {bookQuota} books, publishing, and bookshelf features.
        </p>
        <button
          type="button"
          onClick={() =>
            router.push(entitlements?.registrationHref || registrationHref)
          }
          className="mt-3 inline-flex rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Continue activation
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-neutral-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">
            {hasExistingBook ? "Update TEB™ ebook" : "Create your first TalisBook™"}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {hasExistingBook
              ? `Edit the ebook for ${fastCode.toUpperCase()}.`
              : "No payment required for your first draft. Publishing and more books unlock after activation."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-xl border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          {open ? "Hide" : hasExistingBook ? "Edit" : "Create ebook"}
        </button>
      </div>

      {!activated ? (
        <p className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          Locked until activation: publishing, global marketing, multiple books, additional
          uploads, full bookshelf, derivative books, and Adpro books.
          {accountKind ? ` After activation (${accountKind}): up to ${bookQuota} books.` : ""}
        </p>
      ) : (
        <p className="mt-3 text-xs text-neutral-500">
          Activated {accountKind} account · {entitlements?.bookCount ?? 0}/{bookQuota} books used
        </p>
      )}

      {open ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-neutral-500">Title</span>
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm"
              placeholder="Property lookbook title"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-neutral-500">
              Subtitle
            </span>
            <input
              value={subtitle}
              onChange={(event) => setSubtitle(event.target.value)}
              className="h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm"
              placeholder="Address or short line"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-neutral-500">
              Description
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              placeholder="Short ebook summary"
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            {saving
              ? "Saving…"
              : hasExistingBook
                ? "Save ebook"
                : "Create first draft"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
