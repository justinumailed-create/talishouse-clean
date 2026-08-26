"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useId, useRef, useState } from "react";
import {
  classifyUploadFile,
  convertPdfFileToImageFiles,
} from "@/lib/talisbooks/pdf-pages-to-images";
import {
  SELF_SERVICE_MAX_UPLOAD_IMAGES,
  type SelfServiceBookOptions,
  type SelfServicePageCaption,
} from "@/lib/talisbooks/self-service-page-plan";
import {
  EBOOK_GENERATION_STAGES,
  EBOOK_GENERATION_STAGE_LABELS,
  type EbookGenerationProgressEvent,
  type EbookGenerationStage,
} from "@/lib/talispros/ebook-generation-stages";
import {
  ONBOARDING_JOB_TIMEOUT_MS,
  ONBOARDING_OPTIMIZE_TIMEOUT_MS,
  formatOnboardingDuration,
} from "@/lib/onboarding-timing";
import {
  EBOOK_GENERATE_HELP_TEXT,
  EBOOK_GENERATE_UPLOAD_HINT,
} from "@/lib/talispros/ebook-generate-copy";

type EbookOptimizedUploadResponse = {
  ok: true;
  url: string;
  width: number;
  height: number;
  bytes: number;
  originalBytes: number;
  mimeType: string;
  kind: "property" | "agent" | "logo";
  compressionRatio: number;
};

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

type OptimizedAsset = {
  url: string;
  width: number;
  height: number;
  bytes: number;
  originalBytes: number;
};

type UploadFailure = {
  id: string;
  label: string;
  kind: "property" | "agent" | "logo";
  file: File;
  error: string;
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
const UPLOAD_CONCURRENCY = 3;

function stageIndex(stage: EbookGenerationStage | null): number {
  if (!stage || stage === "failed") return -1;
  return STAGE_ORDER.indexOf(stage);
}

async function uploadOptimizedImage(options: {
  requestId: string;
  kind: "property" | "agent" | "logo";
  file: File;
  label: string;
  signal?: AbortSignal;
}): Promise<EbookOptimizedUploadResponse> {
  const fd = new FormData();
  fd.set("requestId", options.requestId);
  fd.set("kind", options.kind);
  fd.set("label", options.label);
  fd.set("file", options.file);

  const response = await fetch("/api/talispros/ebook-generate/upload-image", {
    method: "POST",
    body: fd,
    signal: options.signal,
  });

  let payload: { ok?: boolean; error?: string } & Partial<EbookOptimizedUploadResponse>;
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    throw new Error(
      response.status === 413
        ? `“${options.label}” is too large for a single upload. Try again — optimization should shrink it.`
        : `Failed to upload “${options.label}” (${response.status}).`,
    );
  }

  if (!response.ok || !payload.ok || !payload.url) {
    if (response.status === 413) {
      throw new Error(
        `“${options.label}” triggered HTTP 413. Retry this image only.`,
      );
    }
    throw new Error(
      payload.error || `Failed to optimize and upload “${options.label}”.`,
    );
  }

  return payload as EbookOptimizedUploadResponse;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(items[index]!, index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

/**
 * Self-service first Talisbook™ generator — images / PDF pages, title, description, location.
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
  const [stageDetail, setStageDetail] = useState("");
  const [uploadFailures, setUploadFailures] = useState<UploadFailure[]>([]);
  const [error, setError] = useState(bootstrapError || "");
  const [errorMeta, setErrorMeta] = useState(bootstrapMeta);
  const [facingPages, setFacingPages] = useState(true);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [advertising, setAdvertising] = useState(false);
  const [globalContent, setGlobalContent] = useState(false);
  const [customContent, setCustomContent] = useState(false);
  const [captionStep, setCaptionStep] = useState(false);
  const [captionIndex, setCaptionIndex] = useState(0);
  const [captionDraft, setCaptionDraft] = useState("");
  const [pageCaptions, setPageCaptions] = useState<SelfServicePageCaption[]>([]);
  const pendingGenerateRef = useRef<{
    optimizedImages: OptimizedAsset[];
    agentPhotoUrl: string | null;
    brokerageLogoUrl: string | null;
    fromPdf: boolean;
  } | null>(null);
  const skipOptimizeRef = useRef(false);

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
    setUploadFailures([]);
    if (!fileList || fileList.length === 0) return;

    const remaining = Math.max(0, SELF_SERVICE_MAX_UPLOAD_IMAGES - uploads.length);
    if (remaining === 0) {
      setError(`You can add up to ${SELF_SERVICE_MAX_UPLOAD_IMAGES} images.`);
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
          [...current, ...next].slice(0, SELF_SERVICE_MAX_UPLOAD_IMAGES)
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

  type UploadStash = {
    byId: Record<string, OptimizedAsset>;
    agentPhotoUrl: string | null;
    brokerageLogoUrl: string | null;
  };

  function stashKeyFor(id: string) {
    return `ebook-opt-${id}`;
  }

  function readStash(id: string): UploadStash {
    try {
      const raw = sessionStorage.getItem(stashKeyFor(id));
      if (!raw) return { byId: {}, agentPhotoUrl: null, brokerageLogoUrl: null };
      const parsed = JSON.parse(raw) as UploadStash & {
        images?: OptimizedAsset[];
      };
      // Migrate older stash shape if present.
      if (parsed.byId) return parsed;
      const byId: Record<string, OptimizedAsset> = {};
      for (const [index, image] of (parsed.images || []).entries()) {
        byId[`legacy-${index}`] = image;
      }
      return {
        byId,
        agentPhotoUrl: parsed.agentPhotoUrl || null,
        brokerageLogoUrl: parsed.brokerageLogoUrl || null,
      };
    } catch {
      return { byId: {}, agentPhotoUrl: null, brokerageLogoUrl: null };
    }
  }

  function writeStash(id: string, stash: UploadStash) {
    sessionStorage.setItem(stashKeyFor(id), JSON.stringify(stash));
  }

  async function optimizeAndStoreUploads(options: {
    requestId: string;
    propertyItems: SelectedUpload[];
    logo: File | null;
    agentPhoto: File | null;
    signal: AbortSignal;
    prior: UploadStash;
  }): Promise<{
    optimizedImages: OptimizedAsset[];
    agentPhotoUrl: string | null;
    brokerageLogoUrl: string | null;
    failures: UploadFailure[];
    originalBytes: number;
    optimizedBytes: number;
    stash: UploadStash;
  }> {
    const failures: UploadFailure[] = [];
    const stash: UploadStash = {
      byId: { ...options.prior.byId },
      agentPhotoUrl: options.prior.agentPhotoUrl,
      brokerageLogoUrl: options.prior.brokerageLogoUrl,
    };
    let originalBytes = 0;
    let optimizedBytes = 0;

    const pendingProperty = options.propertyItems.filter(
      (item) => !stash.byId[item.id],
    );
    const needLogo = Boolean(options.logo) && !stash.brokerageLogoUrl;
    const needAgent = Boolean(options.agentPhoto) && !stash.agentPhotoUrl;
    const total =
      pendingProperty.length + (needLogo ? 1 : 0) + (needAgent ? 1 : 0);
    let completed = 0;

    const bump = () => {
      completed += 1;
      setActiveStage(
        completed < total ? "optimizing_images" : "uploading_images",
      );
      setStageDetail(total > 0 ? `${completed}/${total}` : "");
    };

    setActiveStage("optimizing_images");
    setStageDetail(total > 0 ? `0/${total}` : "cached");

    await mapPool(pendingProperty, UPLOAD_CONCURRENCY, async (item) => {
      setActiveStage("optimizing_images");
      try {
        const result = await uploadOptimizedImage({
          requestId: options.requestId,
          kind: "property",
          file: item.file,
          label: item.label,
          signal: options.signal,
        });
        stash.byId[item.id] = {
          url: result.url,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          originalBytes: result.originalBytes,
        };
        originalBytes += result.originalBytes;
        optimizedBytes += result.bytes;
      } catch (err) {
        failures.push({
          id: item.id,
          label: item.label,
          kind: "property",
          file: item.file,
          error: err instanceof Error ? err.message : "Upload failed.",
        });
      } finally {
        bump();
      }
    });

    setActiveStage("uploading_images");

    if (needLogo && options.logo) {
      try {
        const result = await uploadOptimizedImage({
          requestId: options.requestId,
          kind: "logo",
          file: options.logo,
          label: options.logo.name || "Brokerage logo",
          signal: options.signal,
        });
        stash.brokerageLogoUrl = result.url;
        originalBytes += result.originalBytes;
        optimizedBytes += result.bytes;
      } catch (err) {
        failures.push({
          id: "logo",
          label: options.logo.name || "Brokerage logo",
          kind: "logo",
          file: options.logo,
          error: err instanceof Error ? err.message : "Logo upload failed.",
        });
      } finally {
        bump();
      }
    }

    if (needAgent && options.agentPhoto) {
      try {
        const result = await uploadOptimizedImage({
          requestId: options.requestId,
          kind: "agent",
          file: options.agentPhoto,
          label: options.agentPhoto.name || "Agent photo",
          signal: options.signal,
        });
        stash.agentPhotoUrl = result.url;
        originalBytes += result.originalBytes;
        optimizedBytes += result.bytes;
      } catch (err) {
        failures.push({
          id: "agent-photo",
          label: options.agentPhoto.name || "Agent photo",
          kind: "agent",
          file: options.agentPhoto,
          error:
            err instanceof Error ? err.message : "Agent photo upload failed.",
        });
      } finally {
        bump();
      }
    }

    const optimizedImages = options.propertyItems
      .map((item) => stash.byId[item.id])
      .filter((item): item is OptimizedAsset => Boolean(item));

    // Account for previously cached assets in the compression report.
    const pendingIds = new Set(pendingProperty.map((item) => item.id));
    for (const item of options.propertyItems) {
      if (pendingIds.has(item.id)) continue;
      const asset = stash.byId[item.id];
      if (!asset) continue;
      originalBytes += asset.originalBytes;
      optimizedBytes += asset.bytes;
    }

    return {
      optimizedImages,
      agentPhotoUrl: stash.agentPhotoUrl,
      brokerageLogoUrl: stash.brokerageLogoUrl,
      failures,
      originalBytes,
      optimizedBytes,
      stash,
    };
  }

  async function retryFailedUpload(failure: UploadFailure) {
    if (!requestId || saving) return;
    setError("");
    setSaving(true);
    setActiveStage("optimizing_images");
    setStageDetail(`Retrying ${failure.label}`);

    try {
      const result = await uploadOptimizedImage({
        requestId,
        kind: failure.kind,
        file: failure.file,
        label: failure.label,
      });
      const stash = readStash(requestId);
      if (failure.kind === "property") {
        stash.byId[failure.id] = {
          url: result.url,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          originalBytes: result.originalBytes,
        };
      } else if (failure.kind === "agent") {
        stash.agentPhotoUrl = result.url;
      } else {
        stash.brokerageLogoUrl = result.url;
      }
      writeStash(requestId, stash);
      setUploadFailures((current) =>
        current.filter((item) => item.id !== failure.id),
      );
      setActiveStage(null);
      setStageDetail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed.");
      setActiveStage("failed");
    } finally {
      setSaving(false);
    }
  }

  function commitCaption(skipped: boolean) {
    const interiors = Math.max(
      0,
      (pendingGenerateRef.current?.optimizedImages.length ?? 0) - 2,
    );
    const next = [...pageCaptions];
    next[captionIndex] = {
      text: skipped ? "" : captionDraft.trim(),
      skipped,
    };
    setPageCaptions(next);
    if (captionIndex + 1 >= interiors) {
      skipOptimizeRef.current = true;
      setCaptionStep(false);
      void handleSubmit(
        {
          preventDefault() {},
        } as FormEvent,
        next,
      );
      return;
    }
    setCaptionIndex(captionIndex + 1);
    setCaptionDraft(next[captionIndex + 1]?.text ?? "");
  }

  async function handleSubmit(
    event: FormEvent,
    captionsOverride?: SelfServicePageCaption[],
  ) {
    event.preventDefault();
    setError("");
    setErrorMeta(null);
    setUploadFailures([]);

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
    setSaving(true);
    setActiveStage("optimizing_images");
    const generateStarted =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    // Separate budgets: optimize/upload must not starve the generate job.
    const optimizeController = new AbortController();
    const optimizeTimeoutId = window.setTimeout(() => {
      optimizeController.abort();
    }, ONBOARDING_OPTIMIZE_TIMEOUT_MS);

    let generateController: AbortController | null = null;
    let generateTimeoutId: number | undefined;

    try {
      let optimizedImages: OptimizedAsset[] = [];
      let agentPhotoUrl: string | null = null;
      let brokerageLogoUrl: string | null = null;

      if (skipOptimizeRef.current && pendingGenerateRef.current) {
        skipOptimizeRef.current = false;
        optimizedImages = pendingGenerateRef.current.optimizedImages;
        agentPhotoUrl = pendingGenerateRef.current.agentPhotoUrl;
        brokerageLogoUrl = pendingGenerateRef.current.brokerageLogoUrl;
        setActiveStage("generating_pages");
        window.clearTimeout(optimizeTimeoutId);
      } else {
      const prior = readStash(requestId);
      const stored = await optimizeAndStoreUploads({
        requestId,
        propertyItems: uploads,
        logo: logoFile,
        agentPhoto: agentPhotoFile,
        signal: optimizeController.signal,
        prior,
      });
      writeStash(requestId, stored.stash);
      window.clearTimeout(optimizeTimeoutId);

      if (stored.failures.length > 0) {
        setUploadFailures(stored.failures);
        setActiveStage("failed");
        setError(
          `${stored.failures.length} image${stored.failures.length === 1 ? "" : "s"} failed. Retry the failed image(s) below — you do not need to restart the whole upload.`,
        );
        return;
      }

      if (stored.optimizedImages.length === 0) {
        setError("Upload at least one property image or PDF.");
        setActiveStage("failed");
        return;
      }

      optimizedImages = stored.optimizedImages;
      agentPhotoUrl = stored.agentPhotoUrl;
      brokerageLogoUrl = stored.brokerageLogoUrl;

      console.info(
        `[onboarding] Image optimize+upload ...... original=${stored.originalBytes} optimized=${stored.optimizedBytes} ratio=${
          stored.originalBytes
            ? (stored.optimizedBytes / stored.originalBytes).toFixed(3)
            : "n/a"
        }`,
      );

      // First landscape (or first image fallback) is the cover spread — not captioned.
      const interiorCount = Math.max(0, optimizedImages.length - 1);
      if (captionsEnabled && !fromPdf && interiorCount > 0 && !captionStep) {
        pendingGenerateRef.current = {
          optimizedImages,
          agentPhotoUrl,
          brokerageLogoUrl,
          fromPdf,
        };
        setPageCaptions(
          Array.from({ length: interiorCount }, () => ({
            text: "",
            skipped: false,
          })),
        );
        setCaptionIndex(0);
        setCaptionDraft("");
        setCaptionStep(true);
        setActiveStage(null);
        setSaving(false);
        return;
      }
      }

      setActiveStage("generating_pages");
      setStageDetail("");

      generateController = new AbortController();
      generateTimeoutId = window.setTimeout(() => {
        generateController?.abort();
      }, ONBOARDING_JOB_TIMEOUT_MS);

      const fd = new FormData();
      fd.set("requestId", requestId);
      fd.set(
        "title",
        fromPdf
          ? title.trim() || `${fastCode.toUpperCase()} Talisbook™`
          : title.trim()
      );
      fd.set("description", fromPdf ? description.trim() : description.trim());
      fd.set("location", fromPdf ? location.trim() : location.trim());
      fd.set("agentName", agentName.trim());
      fd.set("agentEmail", agentEmail.trim());
      fd.set("agentPhone", agentPhone.trim());
      fd.set(
        "optimizedImages",
        JSON.stringify(
          optimizedImages.map(({ url, width, height }) => ({
            url,
            width,
            height,
          })),
        ),
      );
      if (agentPhotoUrl) fd.set("agentPhotoUrl", agentPhotoUrl);
      if (brokerageLogoUrl) fd.set("brokerageLogoUrl", brokerageLogoUrl);
      fd.set("uploadMode", fromPdf ? "pdf" : "images");
      fd.set(
        "bookOptions",
        JSON.stringify({
          facingPages,
          captions: captionsEnabled,
          advertising,
          globalContent,
          customContent,
        } satisfies SelfServiceBookOptions),
      );
      const captionsToSend = captionsOverride ?? pageCaptions;
      if (captionsEnabled && captionsToSend.length > 0) {
        fd.set("captions", JSON.stringify(captionsToSend));
      }

      const response = await fetch("/api/talispros/ebook-generate", {
        method: "POST",
        body: fd,
        signal: generateController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(
          response.status === 413
            ? "Generate request was rejected as too large (HTTP 413). Images should already be stored as URLs — please retry."
            : `Generation request failed (${response.status}). Please try again.`,
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
          if ("detail" in event && event.detail) {
            setStageDetail(event.detail);
          }
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
        try {
          sessionStorage.removeItem(stashKeyFor(requestId));
        } catch {
          /* ignore */
        }
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
      const optimizeAborted = aborted && !generateController;
      const message = aborted
        ? optimizeAborted
          ? `Image upload timed out after ${formatOnboardingDuration(ONBOARDING_OPTIMIZE_TIMEOUT_MS)}. Please try again with fewer or smaller images.`
          : `Ebook generation timed out after ${formatOnboardingDuration(ONBOARDING_JOB_TIMEOUT_MS)}. Please try again.`
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
      window.clearTimeout(optimizeTimeoutId);
      if (generateTimeoutId !== undefined) {
        window.clearTimeout(generateTimeoutId);
      }
      setSaving(false);
      setStageDetail("");
    }
  }

  const activeIndex = stageIndex(activeStage);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-5 py-12 text-neutral-900">
      <div className="w-full max-w-lg">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">
            Talisbooks™
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Generate My Own E-Book
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {EBOOK_GENERATE_HELP_TEXT}
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

        {captionStep ? (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-neutral-600">
              Captions · image {captionIndex + 1} of{" "}
              {Math.max(0, (pendingGenerateRef.current?.optimizedImages.length ?? 1) - 1)}
              {" "}(cover spread is skipped; landscape photos share one caption per spread)
            </p>
            <textarea
              value={captionDraft}
              onChange={(event) => setCaptionDraft(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
              placeholder="Write a caption, or skip this page."
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => commitCaption(true)}
                className="flex-1 rounded-2xl border border-neutral-300 px-5 py-3 text-sm font-medium text-neutral-800"
              >
                Skip caption
              </button>
              <button
                type="button"
                onClick={() => commitCaption(false)}
                className="flex-1 rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white"
              >
                Save caption
              </button>
            </div>
          </div>
        ) : (
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
                  {EBOOK_GENERATE_UPLOAD_HINT}
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
                      Title <span className="font-normal text-neutral-400">(optional)</span>
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
                      Description <span className="font-normal text-neutral-400">(optional)</span>
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
                      Headline <span className="font-normal text-neutral-400">(optional)</span>
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
                    Logo{" "}
                    <span className="font-normal text-neutral-400">(optional)</span>
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
                    {logoFile ? logoFile.name : "Kept lossless"}
                  </p>
                </div>
                <div className="block text-sm">
                  <label
                    htmlFor={agentPhotoInputId}
                    className="mb-1.5 block text-xs font-medium text-neutral-500"
                  >
                    Photo{" "}
                    <span className="font-normal text-neutral-400">(optional)</span>
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
                    {agentPhotoFile ? agentPhotoFile.name : "Auto-cropped"}
                  </p>
                </div>
              </div>

              {!isPdfUpload ? (
                <fieldset className="space-y-2 rounded-xl border border-neutral-200 px-3 py-3">
                  <legend className="px-1 text-xs font-medium text-neutral-500">
                    Talisbook™ options
                  </legend>
                  <label className="flex items-center gap-2 text-sm text-neutral-800">
                    <input
                      type="checkbox"
                      checked={facingPages}
                      onChange={(event) => setFacingPages(event.target.checked)}
                      disabled={saving || converting}
                    />
                    Facing pages (landscapes span the fold; portraits stay single)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-neutral-800">
                    <input
                      type="checkbox"
                      checked={captionsEnabled}
                      onChange={(event) => setCaptionsEnabled(event.target.checked)}
                      disabled={saving || converting}
                    />
                    Captions (write or skip after image processing)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-neutral-800">
                    <input
                      type="checkbox"
                      checked={advertising}
                      onChange={(event) => setAdvertising(event.target.checked)}
                      disabled={saving || converting}
                    />
                    Advertising (“Advertisement” on custom/global spreads)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-neutral-800">
                    <input
                      type="checkbox"
                      checked={customContent}
                      onChange={(event) => setCustomContent(event.target.checked)}
                      disabled={saving || converting}
                    />
                    Custom content (root account / logo)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-neutral-800">
                    <input
                      type="checkbox"
                      checked={globalContent}
                      onChange={(event) => setGlobalContent(event.target.checked)}
                      disabled={saving || converting}
                    />
                    Global content (Glasshouse™ + pricing)
                  </label>
                </fieldset>
              ) : null}

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
                        ? ` · Mapsite™ ${errorMeta.mapsiteId.slice(0, 8)}`
                        : ""}
                      {errorMeta.stage ? ` · Stage ${errorMeta.stage}` : ""}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {uploadFailures.length > 0 ? (
                <ul className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {uploadFailures.map((failure) => (
                    <li
                      key={failure.id}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{failure.label}</p>
                        <p className="text-xs text-amber-700">{failure.error}</p>
                      </div>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void retryFailedUpload(failure)}
                        className="shrink-0 rounded-lg bg-amber-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-800 disabled:opacity-60"
                      >
                        Retry
                      </button>
                    </li>
                  ))}
                </ul>
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
                        <span>
                          {EBOOK_GENERATION_STAGE_LABELS[stage]}
                          {current && stageDetail ? (
                            <span className="ml-2 text-xs font-normal text-neutral-500">
                              {stageDetail}
                            </span>
                          ) : null}
                        </span>
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
                      ]}${stageDetail ? ` (${stageDetail})` : ""}…`
                    : "Working…"
                  : converting
                    ? "Converting PDF…"
                    : uploadFailures.length > 0
                      ? "Continue after retries"
                      : "Generate Talisbook™"}
              </button>
            </>
          )}
        </form>
        )}
      </div>
    </div>
  );
}
