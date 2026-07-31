"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useId, useRef, useState } from "react";
import { generateSelfServiceEbookAction } from "@/app/talispros/ebook-generate/actions";
import {
  classifyUploadFile,
  convertPdfFileToImageFiles,
  MAX_EBOOK_UPLOAD_PAGES,
} from "@/lib/talisbooks/pdf-pages-to-images";

interface EbookGenerateClientProps {
  fastCode: string | null;
  mapsiteId: string | null;
  accountType: string | null;
  requestId: string | null;
}

type SelectedUpload = {
  id: string;
  file: File;
  source: "image" | "pdf-page";
  label: string;
};

/**
 * Self-service first TalisBook™ generator — images / PDF pages, title, description, location.
 * No payment. Book gets a private viewer URL and links to the pending MapSite™.
 */
export default function EbookGenerateClient({
  fastCode,
  mapsiteId,
  accountType,
  requestId,
}: EbookGenerateClientProps) {
  const router = useRouter();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [uploads, setUploads] = useState<SelectedUpload[]>([]);
  const [converting, setConverting] = useState(false);
  const [convertProgress, setConvertProgress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isPdfUpload =
    uploads.length > 0 && uploads.every((item) => item.source === "pdf-page");

  function removeUpload(id: string) {
    setUploads((current) => current.filter((item) => item.id !== id));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function clearUploads() {
    setUploads([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFilesSelected(fileList: FileList | null) {
    setError("");
    if (!fileList || fileList.length === 0) return;

    const remaining = Math.max(0, MAX_EBOOK_UPLOAD_PAGES - uploads.length);
    if (remaining === 0) {
      setError(`You can add up to ${MAX_EBOOK_UPLOAD_PAGES} pages.`);
      return;
    }

    const incoming = Array.from(fileList);
    const next: SelectedUpload[] = [];
    let slots = remaining;

    setConverting(true);
    try {
      for (const file of incoming) {
        if (slots <= 0) break;
        const kind = classifyUploadFile(file);

        if (kind === "other") {
          setError(`Unsupported file: ${file.name}. Use JPG, PNG, WEBP, or PDF.`);
          continue;
        }

        if (kind === "image") {
          next.push({
            id: crypto.randomUUID(),
            file,
            source: "image",
            label: file.name,
          });
          slots -= 1;
          continue;
        }

        setConvertProgress(`Converting ${file.name}…`);
        const pageFiles = await convertPdfFileToImageFiles(file, {
          maxPages: slots,
          onProgress: (done, total) => {
            setConvertProgress(
              `Converting ${file.name}: page ${done} of ${total}…`
            );
          },
        });

        for (const pageFile of pageFiles) {
          if (slots <= 0) break;
          next.push({
            id: crypto.randomUUID(),
            file: pageFile,
            source: "pdf-page",
            label: pageFile.name,
          });
          slots -= 1;
        }
      }

      if (next.length > 0) {
        setUploads((current) =>
          [...current, ...next].slice(0, MAX_EBOOK_UPLOAD_PAGES)
        );
      }
    } catch (convertError) {
      setError(
        convertError instanceof Error
          ? convertError.message
          : "Could not convert the PDF. Try exporting pages as images."
      );
    } finally {
      setConverting(false);
      setConvertProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!fastCode) {
      setError("A FAST Code is required to generate your E-Book.");
      return;
    }
    if (uploads.length === 0) {
      setError("Upload at least one property image or PDF.");
      return;
    }

    const fromPdf = uploads.every((item) => item.source === "pdf-page");
    if (!fromPdf && (!title.trim() || !description.trim() || !location.trim())) {
      setError("Title, description, and location are required.");
      return;
    }

    setSaving(true);
    const fd = new FormData();
    fd.set("fastCode", fastCode);
    if (mapsiteId) fd.set("mapsiteId", mapsiteId);
    if (accountType) fd.set("accountType", accountType);
    if (requestId) fd.set("requestId", requestId);
    fd.set(
      "title",
      fromPdf
        ? title.trim() || `${fastCode.toUpperCase()} TalisBook™`
        : title.trim()
    );
    fd.set("description", fromPdf ? description.trim() : description.trim());
    fd.set("location", fromPdf ? location.trim() : location.trim());
    for (const item of uploads) {
      fd.append("images", item.file);
    }
    fd.set("uploadMode", fromPdf ? "pdf" : "images");

    const result = await generateSelfServiceEbookAction(fd);
    setSaving(false);

    if (!result.success) {
      setError(result.error || "Could not generate your E-Book.");
      return;
    }

    if (result.mapsiteHref) {
      window.location.assign(result.mapsiteHref);
      return;
    }
    if (result.viewerUrl) {
      router.push(result.viewerUrl);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-5 py-12 text-neutral-900">
      <div className="w-full max-w-lg">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">
            TalisBooks™
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Generate My Own E-Book
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Add property images or a PDF. Each PDF page becomes a viewer page.
          </p>
          {fastCode ? (
            <p className="mt-2 text-xs text-neutral-400">
              FAST Code {fastCode.toUpperCase()}
            </p>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="block text-sm">
            <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium text-neutral-500">
              Property Images or PDF
            </label>
            <input
              id={inputId}
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp,application/pdf,.pdf"
              multiple
              disabled={converting || saving}
              onChange={(event) => void handleFilesSelected(event.target.files)}
              className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-xl file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800 disabled:opacity-60"
            />
            <p className="mt-1.5 text-xs text-neutral-400">
              JPG, PNG, WEBP, or PDF. Up to {MAX_EBOOK_UPLOAD_PAGES} pages.
            </p>

            {converting ? (
              <p className="mt-2 text-xs text-neutral-500">
                {convertProgress || "Converting PDF pages…"}
              </p>
            ) : null}

            {uploads.length > 0 ? (
              <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50/80 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-neutral-600">
                    {uploads.length} page{uploads.length === 1 ? "" : "s"} selected
                  </p>
                  <button
                    type="button"
                    onClick={clearUploads}
                    className="text-xs font-medium text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <ul className="max-h-48 space-y-1.5 overflow-y-auto">
                  {uploads.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-xs text-neutral-700 ring-1 ring-neutral-200/80"
                    >
                      <span className="min-w-0 flex-1 truncate" title={item.label}>
                        {item.source === "pdf-page" ? "PDF · " : ""}
                        {item.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeUpload(item.id)}
                        className="shrink-0 rounded-md px-2 py-1 font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {!isPdfUpload ? (
            <>
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                  Property Title
                </span>
                <input
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm"
                  placeholder="Lot + optional Tiny Home"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                  Description
                </span>
                <textarea
                  required
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                  placeholder="Short property story"
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
            </>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={saving || converting}
            className="w-full rounded-2xl bg-neutral-900 px-5 py-3.5 text-base font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {saving
              ? "Generating…"
              : converting
                ? "Converting PDF…"
                : "Generate TalisBook™"}
          </button>
        </form>
      </div>
    </div>
  );
}
