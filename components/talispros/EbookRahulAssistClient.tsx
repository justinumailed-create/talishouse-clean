"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { submitRahulEbookAssistAction } from "@/app/talispros/ebook-rahul/actions";

interface EbookRahulAssistClientProps {
  fastCode: string | null;
  mapsiteId: string | null;
  accountType: string | null;
  requestId: string | null;
}

/**
 * Have Rahul Build It For Me — simplified asset upload for assisted TEB™.
 */
export default function EbookRahulAssistClient({
  fastCode,
  mapsiteId,
  accountType,
  requestId,
}: EbookRahulAssistClientProps) {
  const router = useRouter();
  const needsContact = !requestId;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [propertyTitle, setPropertyTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [agentPhoto, setAgentPhoto] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!propertyTitle.trim() || !description.trim() || !location.trim()) {
      setError("Property title, description, and location are required.");
      return;
    }
    if (images.length === 0) {
      setError("Upload at least one property image (up to 22).");
      return;
    }
    if (needsContact && (!email.trim() || !firstName.trim() || !lastName.trim())) {
      setError("Name and email are required so Rahul can notify you.");
      return;
    }

    setSaving(true);
    const fd = new FormData();
    if (fastCode) fd.set("fastCode", fastCode);
    if (mapsiteId) fd.set("mapsiteId", mapsiteId);
    if (accountType) fd.set("accountType", accountType);
    if (requestId) fd.set("requestId", requestId);
    fd.set("firstName", firstName.trim());
    fd.set("lastName", lastName.trim());
    fd.set("email", email.trim());
    fd.set("propertyTitle", propertyTitle.trim());
    fd.set("description", description.trim());
    fd.set("location", location.trim());
    if (agentPhoto) fd.set("agentPhoto", agentPhoto);
    if (logo) fd.set("logo", logo);
    for (const file of images) {
      fd.append("images", file);
    }

    const result = await submitRahulEbookAssistAction(fd);
    setSaving(false);

    if (!result.success) {
      setError(result.error || "Could not submit your request to Rahul.");
      return;
    }

    setDone(true);
    if (result.continueHref) {
      window.setTimeout(() => {
        router.push(result.continueHref!);
      }, 1600);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-5 py-12 text-center text-neutral-900">
        <h1 className="text-2xl font-semibold tracking-tight">Draft E-Book generated</h1>
        <p className="mt-3 max-w-md text-sm text-neutral-500">
          Your images were sent to Rahul and a Draft TalisBook™ preview was created
          automatically. Opening your preview…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-5 py-12 text-neutral-900">
      <div className="w-full max-w-lg">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">
            TalisBooks™
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Have Rahul Build It For Me
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Upload your assets. Rahul completes the E-Book in Marketing Admin.
          </p>
          {fastCode ? (
            <p className="mt-2 text-xs text-neutral-400">
              FAST Code {fastCode.toUpperCase()}
            </p>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {needsContact ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                    First Name
                  </span>
                  <input
                    required
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                    Last Name
                  </span>
                  <input
                    required
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm"
                  />
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                  Email
                </span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm"
                  placeholder="you@example.com"
                />
              </label>
            </>
          ) : null}

          <label className="block text-sm">
            <span className="mb-1.5 block text-xs font-medium text-neutral-500">
              Agent Photo
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              onChange={(event) => setAgentPhoto(event.target.files?.[0] || null)}
              className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-xl file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-900"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block text-xs font-medium text-neutral-500">
              Logo
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              onChange={(event) => setLogo(event.target.files?.[0] || null)}
              className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-xl file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-900"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block text-xs font-medium text-neutral-500">
              Images 1–22
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              multiple
              onChange={(event) =>
                setImages(Array.from(event.target.files || []).slice(0, 22))
              }
              className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-xl file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
            />
            {images.length > 0 ? (
              <span className="mt-1.5 block text-xs text-neutral-400">
                {images.length} image{images.length === 1 ? "" : "s"} selected
              </span>
            ) : null}
          </label>

          <div className="border-t border-neutral-100 pt-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">
              Property Details
            </p>
            <label className="mb-4 block text-sm">
              <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                Property Title
              </span>
              <input
                required
                value={propertyTitle}
                onChange={(event) => setPropertyTitle(event.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm"
                placeholder="Lot + optional Tiny Home"
              />
            </label>
            <label className="mb-4 block text-sm">
              <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                Description
              </span>
              <textarea
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                placeholder="Short property story for Rahul"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                Location
              </span>
              <input
                required
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm"
                placeholder="Street, city, province"
              />
            </label>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-neutral-900 px-5 py-3.5 text-base font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {saving ? "Sending to Rahul…" : "Send to Rahul"}
          </button>
        </form>
      </div>
    </div>
  );
}
