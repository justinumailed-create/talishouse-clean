"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useId, useRef, useState } from "react";
import {
  classifyUploadFile,
  convertPdfFileToImageFiles,
  MAX_EBOOK_UPLOAD_PAGES,
} from "@/lib/talisbooks/pdf-pages-to-images";
import {
  EBOOK_GENERATION_STAGES,
  EBOOK_GENERATION_STAGE_LABELS,
  type EbookGenerationProgressEvent,
  type EbookGenerationStage,
} from "@/lib/talispros/ebook-generation-stages";
import {
  ONBOARDING_JOB_TIMEOUT_MS,
  formatOnboardingDuration,
} from "@/lib/onboarding-timing";

interface EbookGenerateClientProps {
  /** Server-resolved FAST Code (display / titles only — never trusted on submit). */
  fastCode: string | null;
  mapsiteId: string | null;
  accountType: string | null;
  requestId: string | null;
  initialAgentName: string;
  initialAgentEmail: string;
  initialAgentPhone: string;
  bootstrapError?: string | null;
  bootstrapMeta?: {
    requestId: string | null;
    fastCode: string | null;
    mapsiteId: string | null;
    stage: string;
  } | null;
}

type SelectedUpload = {
  id: string;
  file: File;
  source: "image" | "pdf-page";
  label: string;
};

/** Format digits into North American (XXX) XXX-XXXX as the user types. */
function formatNorthAmericanPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const STAGE_ORDER = EBOOK_GENERATION_STAGES;

function stageIndex(stage: EbookGenerationStage | null): number {
  if (!stage || stage === "failed") return -1;
  return STAGE_ORDER.indexOf(stage);
}

/**
 * Self-service first TalisBook™ generator — images / PDF pages, title, description, location.
 * Business identity comes from requestId (Build Request) resolved on the server.
 */
export default function EbookGenerateClient({
  fastCode,
  requestId,
  initialAgentName,
  initialAgentEmail,
  initialAgentPhone,
  bootstrapError = null,
  bootstrapMeta = null,
}: EbookGenerateClientProps) {
  const router = useRouter();
  const inputId = useId();
  const logoInputId = useId();
  const agentPhotoInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [agentName, setAgentName] = useState(initialAgentName);
  const [agentEmail, setAgentEmail] = useState(initialAgentEmail);
  const [agentPhone, setAgentPhone] = useState(
    formatNorthAmericanPhone(initialAgentPhone)
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [agentPhotoFile, setAgentPhotoFile] = useState<File | null>(null);
  const [uploads, setUploads] = useState<SelectedUpload[]>([]);
  const [converting, setConverting] = useState(false);
  const [convertProgress, setConvertProgress] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeStage, setActiveStage] = useState<EbookGenerationStage | null>(
    null
  );
  const [error, setError] = useState(bootstrapError || "");
  const [errorMeta, setErrorMeta] = useState(bootstrapMeta);

  const isPdfUpload =
    uploads.length > 0 && uploads.every((item) => item.source === "pdf-page");
  const canGenerate = Boolean(requestId && fastCode && !bootstrapError);

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
    setErrorMeta(null);
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
          setError(`Unsupported file: ${file.name}. Use JPG, PNG, or PDF.`);
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
    setErrorMeta(null);

    if (!requestId) {
      setError(
        "Build Request ID is required. Return to the Build Form and complete onboarding again."
      );
      return;
    }
    if (!fastCode) {
      setError(
        "A FAST Code was not issued for this Build Request. Return to the Build Form and try again."
      );
      return;
    }
    if (uploads.length === 0) {
      setError("Upload at least one property image or PDF.");
      return;
    }

    const fromPdf = uploads.every((item) => item.source === "pdf-page");
    if (!fromPdf && (!title.trim() || !description.trim() || !location.trim())) {
      setError("Title, description, and headline are required.");
      return;
    }

    setSaving(true);
    setActiveStage("upload_complete");
    const generateStarted =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    const fd = new FormData();
    // Canonical key only — server resolves FAST Code / MapSite from the Build Request.
    fd.set("requestId", requestId);
    fd.set(
      "title",
      fromPdf
        ? title.trim() || `${fastCode.toUpperCase()} TalisBook™`
        : title.trim()
    );
    fd.set("description", fromPdf ? description.trim() : description.trim());
    fd.set("location", fromPdf ? location.trim() : location.trim());
    fd.set("agentName", agentName.trim());
    fd.set("agentEmail", agentEmail.trim());
    fd.set("agentPhone", agentPhone.trim());
    for (const item of uploads) {
      fd.append("images", item.file);
    }
    if (logoFile) fd.set("brokerageLogo", logoFile);
    if (agentPhotoFile) fd.set("agentPhoto", agentPhotoFile);
    fd.set("uploadMode", fromPdf ? "pdf" : "images");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, ONBOARDING_JOB_TIMEOUT_MS);

    try {
      const response = await fetch("/api/talispros/ebook-generate", {
        method: "POST",
        body: fd,
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(
          `Generation request failed (${response.status}). Please try again.`
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalEvent: EbookGenerationProgressEvent | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          let event: EbookGenerationProgressEvent;
          try {
            event = JSON.parse(trimmed) as EbookGenerationProgressEvent;
          } catch {
            continue;
          }
          setActiveStage(event.stage);
          finalEvent = event;
          if (event.stage === "failed") {
            setError(event.error);
            setErrorMeta({
              requestId: event.requestId,
              fastCode: event.fastCode,
              mapsiteId: event.mapsiteId,
              stage: event.failedStage,
            });
          }
        }
      }

      const elapsed =
        (typeof performance !== "undefined" ? performance.now() : Date.now()) -
        generateStarted;
      console.info(
        `[onboarding] Ebook client wait ...... ${formatOnboardingDuration(elapsed)}${elapsed >= 5000 ? " ⚠ SLOW" : ""}`
      );

      if (!finalEvent) {
        setError("Generation ended without a result. Please try again.");
        setActiveStage("failed");
        return;
      }

      if (finalEvent.stage === "failed") {
        setActiveStage("failed");
        return;
      }

      if (finalEvent.stage === "completed") {
        setActiveStage("completed");
        if (finalEvent.mapsiteHref) {
          window.location.assign(finalEvent.mapsiteHref);
          return;
        }
        if (finalEvent.viewerUrl) {
          router.push(finalEvent.viewerUrl);
        }
      }
    } catch (generateError) {
      const elapsed =
        (typeof performance !== "undefined" ? performance.now() : Date.now()) -
        generateStarted;
      const aborted =
        generateError instanceof DOMException &&
        generateError.name === "AbortError";
      const message = aborted
        ? `Ebook generation timed out after ${formatOnboardingDuration(ONBOARDING_JOB_TIMEOUT_MS)}. Please try again with fewer or smaller images.`
        : generateError instanceof Error
          ? generateError.message
          : "Could not generate your E-Book. Please try again.";
      console.error(
        `[onboarding] Ebook client wait ...... failed after ${formatOnboardingDuration(elapsed)}`,
        generateError
      );
      setActiveStage("failed");
      setError(message);
      setErrorMeta({
        requestId,
        fastCode,
        mapsiteId: null,
        stage: aborted ? "timeout" : "ebook_client",
      });
    } finally {
      window.clearTimeout(timeoutId);
      setSaving(false);
    }
  }

  const activeIndex = stageIndex(activeStage);

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
              {requestId ? (
                <span className="ml-2 text-neutral-300">
                  · Request {requestId.slice(0, 8)}
                </span>
              ) : null}
            </p>
          ) : (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {bootstrapError ||
                "A FAST Code is required. Return to the Build Form and complete onboarding again — this page cannot create or discover a FAST Code on its own."}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {!canGenerate ? null : (
            <>
              <div className="block text-sm">
                <label
                  htmlFor={inputId}
                  className="mb-1.5 block text-xs font-medium text-neutral-500"
                >
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
                  JPG, PNG, or PDF. Up to {MAX_EBOOK_UPLOAD_PAGES} pages.
                </p>

                {converting ? (
                  <p className="mt-2 text-xs text-neutral-500">
                    {convertProgress || "Converting PDF…"}
                  </p>
                ) : null}

                {uploads.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {uploads.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 text-xs text-neutral-600"
                      >
                        <span className="truncate">{item.label}</span>
                        <button
                          type="button"
                          onClick={() => removeUpload(item.id)}
                          disabled={saving || converting}
                          className="shrink-0 text-neutral-400 hover:text-neutral-700"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                    <li>
                      <button
                        type="button"
                        onClick={clearUploads}
                        disabled={saving || converting}
                        className="text-xs text-neutral-400 hover:text-neutral-700"
                      >
                        Clear all
                      </button>
                    </li>
                  </ul>
                ) : null}
              </div>

              {!isPdfUpload ? (
                <>
                  <label className="block text-sm">
                    <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                      Title
                    </span>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      disabled={saving || converting}
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                      Description
                    </span>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      disabled={saving || converting}
                      rows={3}
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                      Headline
                    </span>
                    <input
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      disabled={saving || converting}
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
                    />
                  </label>
                </>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm sm:col-span-1">
                  <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                    Agent name
                  </span>
                  <input
                    value={agentName}
                    onChange={(event) => setAgentName(event.target.value)}
                    disabled={saving || converting}
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
                  />
                </label>
                <label className="block text-sm sm:col-span-1">
                  <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                    Email
                  </span>
                  <input
                    type="email"
                    value={agentEmail}
                    onChange={(event) => setAgentEmail(event.target.value)}
                    disabled={saving || converting}
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
                  />
                </label>
                <label className="block text-sm sm:col-span-1">
                  <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                    Phone
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(555) 555-5555"
                    value={agentPhone}
                    onChange={(event) =>
                      setAgentPhone(formatNorthAmericanPhone(event.target.value))
                    }
                    disabled={saving || converting}
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="block text-sm">
                  <label
                    htmlFor={logoInputId}
                    className="mb-1.5 block text-xs font-medium text-neutral-500"
                  >
                    Brokerage logo
                  </label>
                  <input
                    id={logoInputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={converting || saving}
                    onChange={(event) =>
                      setLogoFile(event.target.files?.[0] || null)
                    }
                    className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-xl file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800 disabled:opacity-60"
                  />
                  <p className="mt-1.5 truncate text-xs text-neutral-400">
                    {logoFile ? logoFile.name : "Optional"}
                  </p>
                </div>
                <div className="block text-sm">
                  <label
                    htmlFor={agentPhotoInputId}
                    className="mb-1.5 block text-xs font-medium text-neutral-500"
                  >
                    Agent photo
                  </label>
                  <input
                    id={agentPhotoInputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={converting || saving}
                    onChange={(event) =>
                      setAgentPhotoFile(event.target.files?.[0] || null)
                    }
                    className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-xl file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800 disabled:opacity-60"
                  />
                  <p className="mt-1.5 truncate text-xs text-neutral-400">
                    {agentPhotoFile ? agentPhotoFile.name : "Optional"}
                  </p>
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <p>{error}</p>
                  {errorMeta ? (
                    <p className="mt-1 text-xs text-red-500">
                      Request {errorMeta.requestId || "—"}
                      {errorMeta.fastCode
                        ? ` · FAST ${errorMeta.fastCode.toUpperCase()}`
                        : ""}
                      {errorMeta.mapsiteId
                        ? ` · MapSite ${errorMeta.mapsiteId.slice(0, 8)}`
                        : ""}
                      {errorMeta.stage ? ` · Stage ${errorMeta.stage}` : ""}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {(saving || activeStage) && (
                <ol className="space-y-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
                  {STAGE_ORDER.map((stage, index) => {
                    const done =
                      activeStage === "completed" ||
                      (activeIndex >= 0 && index < activeIndex);
                    const current = activeStage === stage;
                    return (
                      <li
                        key={stage}
                        className={`flex items-center justify-between gap-3 ${
                          done
                            ? "text-neutral-800"
                            : current
                              ? "font-medium text-neutral-900"
                              : "text-neutral-400"
                        }`}
                      >
                        <span>{EBOOK_GENERATION_STAGE_LABELS[stage]}</span>
                        <span className="text-xs">
                          {done ? "✓" : current ? "…" : ""}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}

              <button
                type="submit"
                disabled={!canGenerate || saving || converting}
                className="w-full rounded-2xl bg-neutral-900 px-5 py-3.5 text-base font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
              >
                {saving
                  ? activeStage && activeStage !== "failed"
                    ? `${EBOOK_GENERATION_STAGE_LABELS[
                        activeStage === "completed"
                          ? "completed"
                          : activeStage
                      ]}…`
                    : "Generating…"
                  : converting
                    ? "Converting PDF…"
                    : "Generate Talisbook™"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
