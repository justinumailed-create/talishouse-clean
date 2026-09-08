"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import {
  assignBookAssetsFromUploads,
  classifyUploadFile,
  convertPdfFileToImageFiles,
  splitWrapCoverImageFile,
  COVER_WRAP_PDF_NOT_LANDSCAPE_MESSAGE,
} from "@/lib/talisbooks/pdf-pages-to-images";
import {
  BACK_COVER_REQUIRED_MESSAGE,
  FRONT_COVER_REQUIRED_MESSAGE,
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
  captionsFromTemplatePages,
  EBOOK_GENERATE_COVER_PDF_HELP,
  EBOOK_GENERATE_HELP_TEXT,
  EBOOK_GENERATE_TEMPLATE_ACTION,
  EBOOK_GENERATE_TEMPLATE_ACTION_ON,
  EBOOK_GENERATE_TEMPLATE_DOWNLOAD,
  EBOOK_GENERATE_TEMPLATE_HELP,
  EBOOK_GENERATE_TEMPLATE_PDF_FILE_NAME,
  EBOOK_GENERATE_TEMPLATE_PDF_HREF,
  EBOOK_GENERATE_UPLOAD_HINT,
} from "@/lib/talispros/ebook-generate-copy";
import JarlbergTemplateFields from "@/components/talispros/JarlbergTemplateFields";
import { composeJarlbergTemplateBook } from "@/lib/talisbooks/compose-jarlberg-template";
import {
  createJarlbergSlotState,
  JARLBERG_INTERIOR_COUNT,
  JARLBERG_WRAP_HREF,
  jarlbergInteriorHref,
  type JarlbergSlotState,
} from "@/lib/talisbooks/jarlberg-template";

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

type CoverPick = {
  id: string;
  file: File;
  previewUrl: string;
};

const BOOK_UPLOAD_ACCEPT =
  "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp,application/pdf,.pdf";
const INTERIOR_REPLACE_ACCEPT =
  "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp,application/pdf,.pdf";

function revokePreviewUrl(url: string | null | undefined) {
  if (url) URL.revokeObjectURL(url);
}

interface EbookGenerateClientProps {
  /** Server-resolved FAST Code (display / titles only — never trusted on submit). */
  fastCode: string | null;
  mapsiteId: string | null;
  accountType: string | null;
  requestId: string | null;
  initialAgentName: string;
  initialAgentEmail: string;
  initialAgentPhone?: string;
  pinLatitude?: number | null;
  pinLongitude?: number | null;
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
  previewUrl: string;
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

const STAGE_ORDER = EBOOK_GENERATION_STAGES;

function stageIndex(stage: EbookGenerationStage | null): number {
  if (!stage || stage === "failed") return -1;
  return STAGE_ORDER.indexOf(stage);
}

const UPLOAD_CONCURRENCY = 2;
const UPLOAD_MAX_ATTEMPTS = 3;

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error &&
      (error.name === "AbortError" || /aborted/i.test(error.message)))
  );
}

function isTransientUploadError(error: unknown): boolean {
  if (isAbortError(error)) return false;
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("load failed") ||
    message.includes("fetch failed") ||
    /\b5\d\d\b/.test(message)
  );
}

async function uploadOptimizedImage(options: {
  requestId: string;
  kind: "property" | "agent" | "logo";
  file: File;
  label: string;
  signal?: AbortSignal;
}): Promise<EbookOptimizedUploadResponse> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= UPLOAD_MAX_ATTEMPTS; attempt += 1) {
    if (options.signal?.aborted) {
      throw new DOMException("Upload aborted.", "AbortError");
    }

    try {
      const fd = new FormData();
      fd.set("requestId", options.requestId);
      fd.set("kind", options.kind);
      fd.set("label", options.label);
      // Always send the live File/Blob — never a revoked object URL.
      fd.set("file", options.file, options.file.name || options.label || "image.jpg");

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
            : `Failed to upload “${options.label}” (${response.status || "network"}).`,
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
    } catch (error) {
      if (isAbortError(error)) throw error;
      lastError =
        error instanceof Error
          ? error
          : new Error(`Failed to upload “${options.label}”.`);

      const canRetry =
        attempt < UPLOAD_MAX_ATTEMPTS && isTransientUploadError(lastError);
      if (!canRetry) break;

      console.warn(
        `[onboarding] Upload retry ${attempt}/${UPLOAD_MAX_ATTEMPTS} for “${options.label}”:`,
        lastError.message,
      );
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }

  throw lastError || new Error(`Failed to upload “${options.label}”.`);
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
  initialAgentPhone = "",
  pinLatitude = null,
  pinLongitude = null,
  bootstrapError = null,
  bootstrapMeta = null,
}: EbookGenerateClientProps) {
  const router = useRouter();
  const inputId = useId();
  const logoInputId = useId();
  const agentPhotoInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInteriorInputRef = useRef<HTMLInputElement>(null);
  const slotFileInputRef = useRef<HTMLInputElement>(null);
  const slotFileHandlerRef = useRef<((file: File) => void) | null>(null);
  const replaceInteriorIdRef = useRef<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [agentName, setAgentName] = useState(initialAgentName);
  const [agentEmail, setAgentEmail] = useState(initialAgentEmail);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [agentPhotoFile, setAgentPhotoFile] = useState<File | null>(null);
  const [uploads, setUploads] = useState<SelectedUpload[]>([]);
  const [frontCover, setFrontCover] = useState<CoverPick | null>(null);
  const [backCover, setBackCover] = useState<CoverPick | null>(null);
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
  const [templateMode, setTemplateMode] = useState(false);
  const [jarlbergSlots, setJarlbergSlots] = useState<JarlbergSlotState>(() =>
    createJarlbergSlotState({
      agentName: initialAgentName,
      agentPhone: initialAgentPhone,
    }),
  );
  const [advertising, setAdvertising] = useState(false);
  const [globalContent, setGlobalContent] = useState(false);
  const [customContent, setCustomContent] = useState(false);
  const [captionStep, setCaptionStep] = useState(false);
  const [captionIndex, setCaptionIndex] = useState(0);
  const [captionDraft, setCaptionDraft] = useState("");
  const [pageCaptions, setPageCaptions] = useState<SelfServicePageCaption[]>([]);
  const pendingGenerateRef = useRef<{
    optimizedImages: OptimizedAsset[];
    frontCover: OptimizedAsset;
    backCover: OptimizedAsset;
    agentPhotoUrl: string | null;
    brokerageLogoUrl: string | null;
    fromPdf: boolean;
  } | null>(null);
  const skipOptimizeRef = useRef(false);
  const previewUrlsRef = useRef<string[]>([]);
  previewUrlsRef.current = [
    frontCover?.previewUrl,
    backCover?.previewUrl,
    ...uploads.map((item) => item.previewUrl),
  ].filter((url): url is string => Boolean(url));

  useEffect(() => {
    return () => {
      for (const url of previewUrlsRef.current) URL.revokeObjectURL(url);
    };
  }, []);

  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    if (!agentPhotoFile) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(agentPhotoFile);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [agentPhotoFile]);

  const canGenerate = Boolean(requestId && fastCode && !bootstrapError);

  async function applyCoverPicks(frontFile: File, backFile: File) {
    const frontPreview = URL.createObjectURL(frontFile);
    const backPreview = URL.createObjectURL(backFile);
    const frontPick: CoverPick = {
      id: `front-${frontFile.name}-${frontFile.size}-${frontFile.lastModified}-${Date.now()}`,
      file: frontFile,
      previewUrl: frontPreview,
    };
    const backPick: CoverPick = {
      id: `back-${backFile.name}-${backFile.size}-${backFile.lastModified}-${Date.now()}`,
      file: backFile,
      previewUrl: backPreview,
    };
    setFrontCover((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return frontPick;
    });
    setBackCover((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return backPick;
    });
  }

  async function handleBookFilesSelected(files: File[]) {
    setError("");
    setErrorMeta(null);
    setUploadFailures([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (files.length === 0) return;

    setConverting(true);
    setConvertProgress("Reading upload…");
    try {
      const { front, back, interiors, source } = await assignBookAssetsFromUploads(
        files,
        {
          maxInteriorPages: SELF_SERVICE_MAX_UPLOAD_IMAGES,
          onProgress: (done, total) => {
            setConvertProgress(`Reading upload… ${done}/${total}`);
          },
        },
      );
      await applyCoverPicks(front, back);
      setUploads((current) => {
        for (const item of current) revokePreviewUrl(item.previewUrl);
        return interiors.map((pageFile) => ({
          id: crypto.randomUUID(),
          file: pageFile,
          source: source === "pdf" ? ("pdf-page" as const) : ("image" as const),
          label: pageFile.name,
          previewUrl: URL.createObjectURL(pageFile),
        }));
      });
      setPageCaptions(
        interiors.map(() => ({
          text: "",
          skipped: true,
        })),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : COVER_WRAP_PDF_NOT_LANDSCAPE_MESSAGE,
      );
    } finally {
      setConverting(false);
      setConvertProgress("");
    }
  }

  async function handleReplaceInterior(files: File[]) {
    const id = replaceInteriorIdRef.current;
    replaceInteriorIdRef.current = null;
    if (replaceInteriorInputRef.current) replaceInteriorInputRef.current.value = "";
    const file = files[0];
    if (!id || !file) return;

    setError("");
    const kind = classifyUploadFile(file);
    if (kind === "other") {
      setError("Use JPG, PNG, WEBP, or PDF to replace a page.");
      return;
    }

    setConverting(true);
    setConvertProgress("Replacing page…");
    try {
      let nextFile = file;
      let source: SelectedUpload["source"] = "image";
      if (kind === "pdf") {
        const pages = await convertPdfFileToImageFiles(file, { maxPages: 1 });
        const page = pages[0];
        if (!page) throw new Error("Could not read that PDF page.");
        nextFile = page;
        source = "pdf-page";
      }
      const previewUrl = URL.createObjectURL(nextFile);
      setUploads((current) =>
        current.map((item) => {
          if (item.id !== id) return item;
          revokePreviewUrl(item.previewUrl);
          return {
            id: item.id,
            file: nextFile,
            source,
            label: nextFile.name,
            previewUrl,
          };
        }),
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not replace that page.",
      );
    } finally {
      setConverting(false);
      setConvertProgress("");
    }
  }

  async function fileFromHref(href: string, fileName: string): Promise<File> {
    const response = await fetch(href);
    if (!response.ok) {
      throw new Error("Could not load the Talisbook™ template.");
    }
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type || "image/jpeg" });
  }

  async function loadJarlbergTemplate() {
    setError("");
    setTemplateMode(true);
    setJarlbergSlots(
      createJarlbergSlotState({
        agentName: agentName || initialAgentName,
        agentPhone: initialAgentPhone,
      }),
    );
    setConverting(true);
    setConvertProgress("Loading Jarlberg template…");
    try {
      const wrap = await fileFromHref(JARLBERG_WRAP_HREF, "jarlberg-wrap.jpg");
      const { front, back } = await splitWrapCoverImageFile(wrap);
      await applyCoverPicks(front, back);
      const interiors: File[] = [];
      for (let page = 1; page <= JARLBERG_INTERIOR_COUNT; page += 1) {
        setConvertProgress(`Loading Jarlberg template… ${page}/${JARLBERG_INTERIOR_COUNT}`);
        interiors.push(
          await fileFromHref(
            jarlbergInteriorHref(page),
            `interior-${String(page).padStart(2, "0")}.jpg`,
          ),
        );
      }
      setUploads((current) => {
        for (const item of current) revokePreviewUrl(item.previewUrl);
        return interiors.map((pageFile, index) => ({
          id: crypto.randomUUID(),
          file: pageFile,
          source: "image" as const,
          label: `Page ${index + 1}`,
          previewUrl: URL.createObjectURL(pageFile),
        }));
      });
      setPageCaptions(
        interiors.map(() => ({
          text: "",
          skipped: true,
        })),
      );
    } catch (caught) {
      setTemplateMode(false);
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load the Talisbook™ template.",
      );
    } finally {
      setConverting(false);
      setConvertProgress("");
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
    frontCover: CoverPick | null;
    backCover: CoverPick | null;
    logo: File | null;
    agentPhoto: File | null;
    signal: AbortSignal;
    prior: UploadStash;
  }): Promise<{
    optimizedImages: OptimizedAsset[];
    frontCover: OptimizedAsset | null;
    backCover: OptimizedAsset | null;
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

    const coverItems = [
      options.frontCover
        ? { id: options.frontCover.id, file: options.frontCover.file, label: "Front cover" }
        : null,
      options.backCover
        ? { id: options.backCover.id, file: options.backCover.file, label: "Back cover" }
        : null,
    ].filter((item): item is { id: string; file: File; label: string } => Boolean(item));
    const pendingCovers = coverItems.filter((item) => !stash.byId[item.id]);
    const pendingProperty = options.propertyItems.filter(
      (item) => !stash.byId[item.id],
    );
    const needLogo = Boolean(options.logo) && !stash.brokerageLogoUrl;
    const needAgent = Boolean(options.agentPhoto) && !stash.agentPhotoUrl;
    const total =
      pendingProperty.length +
      pendingCovers.length +
      (needLogo ? 1 : 0) +
      (needAgent ? 1 : 0);
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

    await mapPool(pendingCovers, UPLOAD_CONCURRENCY, async (item) => {
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
        const aborted = isAbortError(err);
        failures.push({
          id: item.id,
          label: item.label,
          kind: "property",
          file: item.file,
          error: aborted
            ? "Upload timed out — tap Retry on this image."
            : err instanceof Error
              ? err.message
              : "Upload failed.",
        });
      } finally {
        bump();
      }
    });

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
        const aborted = isAbortError(err);
        failures.push({
          id: item.id,
          label: item.label,
          kind: "property",
          file: item.file,
          error: aborted
            ? "Upload timed out — tap Retry on this image."
            : err instanceof Error
              ? err.message
              : "Upload failed.",
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
      frontCover: options.frontCover ? stash.byId[options.frontCover.id] || null : null,
      backCover: options.backCover ? stash.byId[options.backCover.id] || null : null,
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
      pendingGenerateRef.current?.optimizedImages.length ?? 0,
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
    if (!templateMode && (uploads.length === 0 || !frontCover || !backCover)) {
      setError(
        "Upload a PDF or images. Page 1 is the wrap cover; remaining pages are interiors.",
      );
      return;
    }

    const fromPdf =
      !templateMode && uploads.every((item) => item.source === "pdf-page");
    const applyCaptions = !templateMode && captionsEnabled;
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
      let frontCoverAsset: OptimizedAsset | null = null;
      let backCoverAsset: OptimizedAsset | null = null;
      let agentPhotoUrl: string | null = null;
      let brokerageLogoUrl: string | null = null;

      if (skipOptimizeRef.current && pendingGenerateRef.current) {
        skipOptimizeRef.current = false;
        optimizedImages = pendingGenerateRef.current.optimizedImages;
        frontCoverAsset = pendingGenerateRef.current.frontCover;
        backCoverAsset = pendingGenerateRef.current.backCover;
        agentPhotoUrl = pendingGenerateRef.current.agentPhotoUrl;
        brokerageLogoUrl = pendingGenerateRef.current.brokerageLogoUrl;
        setActiveStage("generating_pages");
        window.clearTimeout(optimizeTimeoutId);
      } else {
      let propertyItems = uploads;
      let frontPick = frontCover;
      let backPick = backCover;
      if (templateMode) {
        const pin =
          pinLatitude != null &&
          pinLongitude != null &&
          Number.isFinite(pinLatitude) &&
          Number.isFinite(pinLongitude)
            ? { latitude: pinLatitude, longitude: pinLongitude }
            : null;
        const composed = await composeJarlbergTemplateBook(
          jarlbergSlots,
          pin,
          (detail) => setStageDetail(detail),
        );
        const frontPreview = URL.createObjectURL(composed.front);
        const backPreview = URL.createObjectURL(composed.back);
        frontPick = {
          id: `front-jarlberg-${Date.now()}`,
          file: composed.front,
          previewUrl: frontPreview,
        };
        backPick = {
          id: `back-jarlberg-${Date.now()}`,
          file: composed.back,
          previewUrl: backPreview,
        };
        propertyItems = composed.interiors.map((pageFile, index) => ({
          id: `jarlberg-${index}`,
          file: pageFile,
          source: "image" as const,
          label: `Page ${index + 1}`,
          previewUrl: URL.createObjectURL(pageFile),
        }));
      }
      if (!frontPick || !backPick || propertyItems.length === 0) {
        setError(
          "Upload a PDF or images, or use the Talisbook™ template.",
        );
        setActiveStage("failed");
        return;
      }
      const prior = readStash(requestId);
      const stored = await optimizeAndStoreUploads({
        requestId,
        propertyItems,
        frontCover: frontPick,
        backCover: backPick,
        logo: logoFile,
        agentPhoto: jarlbergSlots.backAgentImage || agentPhotoFile,
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
      if (!stored.frontCover) {
        setError(FRONT_COVER_REQUIRED_MESSAGE);
        setActiveStage("failed");
        return;
      }
      if (!stored.backCover) {
        setError(BACK_COVER_REQUIRED_MESSAGE);
        setActiveStage("failed");
        return;
      }

      optimizedImages = stored.optimizedImages;
      frontCoverAsset = stored.frontCover;
      backCoverAsset = stored.backCover;
      agentPhotoUrl = stored.agentPhotoUrl;
      brokerageLogoUrl = stored.brokerageLogoUrl;

      console.info(
        `[onboarding] Image optimize+upload ...... original=${stored.originalBytes} optimized=${stored.optimizedBytes} ratio=${
          stored.originalBytes
            ? (stored.optimizedBytes / stored.originalBytes).toFixed(3)
            : "n/a"
        }`,
      );

      // Captions apply to interior uploads only — never to covers.
      const interiorCount = optimizedImages.length;
      if (applyCaptions && !templateMode && !fromPdf && interiorCount > 0 && !captionStep) {
        pendingGenerateRef.current = {
          optimizedImages,
          frontCover: frontCoverAsset,
          backCover: backCoverAsset,
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

      if (!frontCoverAsset || !backCoverAsset) {
        setError(
          !frontCoverAsset
            ? FRONT_COVER_REQUIRED_MESSAGE
            : BACK_COVER_REQUIRED_MESSAGE,
        );
        setActiveStage("failed");
        return;
      }

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
      fd.set(
        "agentName",
        (templateMode ? jarlbergSlots.agentName : agentName).trim(),
      );
      fd.set("agentEmail", agentEmail.trim());
      if (templateMode && jarlbergSlots.agentPhone.trim()) {
        fd.set("agentPhone", jarlbergSlots.agentPhone.trim());
      }
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
      fd.set(
        "frontCover",
        JSON.stringify({
          url: frontCoverAsset.url,
          width: frontCoverAsset.width,
          height: frontCoverAsset.height,
        }),
      );
      fd.set(
        "backCover",
        JSON.stringify({
          url: backCoverAsset.url,
          width: backCoverAsset.width,
          height: backCoverAsset.height,
        }),
      );
      if (agentPhotoUrl) fd.set("agentPhotoUrl", agentPhotoUrl);
      if (brokerageLogoUrl) fd.set("brokerageLogoUrl", brokerageLogoUrl);
      fd.set("uploadMode", fromPdf ? "pdf" : "images");
      fd.set(
        "bookOptions",
        JSON.stringify({
          facingPages,
          captions: applyCaptions,
          advertising,
          globalContent,
          customContent,
        } satisfies SelfServiceBookOptions),
      );
      const captionsToSend = captionsFromTemplatePages(
        uploads.map(
          (_, index) =>
            (captionsOverride ?? pageCaptions)[index]?.text ?? "",
        ),
      );
      if (applyCaptions && captionsToSend.length > 0) {
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
  const fieldClass =
    "w-full bg-transparent py-1 text-[17px] leading-snug tracking-tight text-neutral-950 outline-none placeholder:text-neutral-400 disabled:opacity-40";
  const cardClass =
    "overflow-hidden rounded-[28px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.06)]";
  const tileClass = `${cardClass} flex min-w-0 flex-col items-stretch rounded-[18px] px-2 pb-2.5 pt-2`;
  const tileFieldClass =
    "w-full min-w-0 truncate bg-transparent py-0.5 text-center text-[12px] leading-snug tracking-tight text-neutral-950 outline-none placeholder:text-neutral-400 disabled:opacity-40";
  const rowClass =
    "flex min-h-[52px] items-center justify-between gap-4 px-5";

  return (
    <div className="flex min-h-dvh flex-col items-center bg-[#f5f5f7] px-6 py-16 text-neutral-950 antialiased sm:py-24">
      <div className="w-full max-w-[480px]">
        <div className="text-center">
          <p className="text-[12px] font-medium tracking-[0.22em] text-neutral-400">
            TALISBOOKS
          </p>
          <h1 className="mt-5 text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[40px]">
            Generate My Own E-Book
          </h1>
          <p className="mx-auto mt-4 max-w-[26rem] text-[15px] leading-relaxed text-neutral-500">
            {EBOOK_GENERATE_HELP_TEXT}
          </p>
          {fastCode ? (
            <p className="mt-3 text-[12px] tracking-tight text-neutral-400">
              {fastCode.toUpperCase()}
              {requestId ? (
                <span className="text-neutral-300">
                  {" "}
                  · {requestId.slice(0, 8)}
                </span>
              ) : null}
            </p>
          ) : (
            <p className="mx-auto mt-5 max-w-[26rem] text-[15px] leading-relaxed text-red-600">
              {bootstrapError ||
                "A FAST Code is required. Return to the Build Form and complete onboarding again — this page cannot create or discover a FAST Code on its own."}
            </p>
          )}
        </div>

        {captionStep ? (
          <div className={`mt-12 ${cardClass} p-6`}>
            <p className="text-[13px] text-neutral-500">
              Caption {captionIndex + 1} of{" "}
              {pendingGenerateRef.current?.optimizedImages.length ?? 0}
            </p>
            <textarea
              value={captionDraft}
              onChange={(event) => setCaptionDraft(event.target.value)}
              rows={4}
              className="mt-4 w-full resize-none rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[17px] tracking-tight outline-none"
              placeholder="Write a caption, or skip."
            />
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => commitCaption(true)}
                className="h-12 flex-1 rounded-full bg-[#e8e8ed] text-[15px] font-medium text-neutral-900"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => commitCaption(false)}
                className="h-12 flex-1 rounded-full bg-neutral-950 text-[15px] font-medium text-white"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="mt-12 space-y-5">
          {!canGenerate ? null : (
            <>
              <div className={`${cardClass} px-6 py-7`}>
                <p className="text-center text-[13px] text-neutral-500">
                  {EBOOK_GENERATE_COVER_PDF_HELP}
                </p>
                <button
                  type="button"
                  disabled={converting || saving}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-6 flex h-[168px] w-full flex-col items-center justify-center rounded-[22px] bg-[#f5f5f7] text-[15px] font-medium text-neutral-950 transition hover:bg-[#ececef] disabled:opacity-40"
                >
                  <span>
                    {frontCover && backCover ? "Replace files" : "Upload PDF or images"}
                  </span>
                  <span className="mt-2 max-w-[16rem] text-center text-[12px] font-normal leading-relaxed text-neutral-400">
                    {EBOOK_GENERATE_UPLOAD_HINT}
                  </span>
                </button>
                {converting ? (
                  <p className="mt-4 text-center text-[13px] text-neutral-400">
                    {convertProgress || "Reading upload…"}
                  </p>
                ) : null}
                <input
                  id={inputId}
                  ref={fileInputRef}
                  type="file"
                  accept={BOOK_UPLOAD_ACCEPT}
                  multiple
                  disabled={converting || saving}
                  className="sr-only"
                  onChange={(event) => {
                    const files = event.target.files
                      ? Array.from(event.target.files)
                      : [];
                    void handleBookFilesSelected(files);
                  }}
                />
                {frontCover && backCover ? (
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {(
                      [
                        { title: "Front", pick: frontCover },
                        { title: "Back", pick: backCover },
                      ] as const
                    ).map((slot) => (
                      <figure key={slot.title} className="text-center">
                        <div className="overflow-hidden rounded-[18px] bg-[#f5f5f7]">
                          <img
                            src={slot.pick.previewUrl}
                            alt={`${slot.title} cover preview`}
                            className="mx-auto h-44 w-auto max-w-full object-contain"
                          />
                        </div>
                        <figcaption className="mt-2 text-[12px] text-neutral-400">
                          {slot.title}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ) : null}
                {uploads.length > 0 ? (
                  <div className="mt-6">
                    <p className="text-center text-[12px] text-neutral-400">
                      Interior
                    </p>
                    <ul className="mt-3 grid grid-cols-3 gap-2.5">
                      {uploads.map((item, index) => (
                        <li key={item.id} className="text-center">
                          <div className="overflow-hidden rounded-[14px] bg-[#f5f5f7]">
                            <img
                              src={item.previewUrl}
                              alt={`Interior page ${index + 1}`}
                              className="h-24 w-full object-contain"
                            />
                          </div>
                          <p className="mt-1.5 text-[11px] text-neutral-400">
                            {index + 1}
                          </p>
                          <button
                            type="button"
                            disabled={converting || saving}
                            onClick={() => {
                              replaceInteriorIdRef.current = item.id;
                              replaceInteriorInputRef.current?.click();
                            }}
                            className="mt-1 inline-flex rounded-full bg-[#e8e8ed] px-2.5 py-1 text-[11px] font-medium text-neutral-950 transition hover:bg-[#dcdce2] disabled:opacity-40"
                          >
                            Replace
                          </button>
                        </li>
                      ))}
                    </ul>
                    <input
                      ref={replaceInteriorInputRef}
                      type="file"
                      accept={INTERIOR_REPLACE_ACCEPT}
                      disabled={converting || saving}
                      className="sr-only"
                      onChange={(event) => {
                        const files = event.target.files
                          ? Array.from(event.target.files)
                          : [];
                        void handleReplaceInterior(files);
                      }}
                    />
                  </div>
                ) : null}
                <div className="mt-6 border-t border-black/[0.06] pt-6">
                  <button
                    type="button"
                    aria-pressed={templateMode}
                    disabled={converting || saving}
                    onClick={() => {
                      if (templateMode) {
                        setTemplateMode(false);
                        return;
                      }
                      void loadJarlbergTemplate();
                    }}
                    className={`flex h-12 w-full items-center justify-center rounded-full text-[15px] font-medium transition disabled:opacity-40 ${
                      templateMode
                        ? "bg-neutral-950 text-white"
                        : "bg-[#e8e8ed] text-neutral-950 hover:bg-[#dcdce2]"
                    }`}
                  >
                    {templateMode
                      ? EBOOK_GENERATE_TEMPLATE_ACTION_ON
                      : EBOOK_GENERATE_TEMPLATE_ACTION}
                  </button>
                  <p className="mt-3 text-center text-[12px] leading-relaxed text-neutral-400">
                    {EBOOK_GENERATE_TEMPLATE_HELP}
                  </p>
                  <a
                    href={EBOOK_GENERATE_TEMPLATE_PDF_HREF}
                    download={EBOOK_GENERATE_TEMPLATE_PDF_FILE_NAME}
                    className="mt-2 block text-center text-[12px] font-medium text-sky-600"
                  >
                    {EBOOK_GENERATE_TEMPLATE_DOWNLOAD}
                  </a>
                  {templateMode ? (
                    <>
                      <JarlbergTemplateFields
                        slots={jarlbergSlots}
                        disabled={converting || saving}
                        onChange={setJarlbergSlots}
                        onPickFile={(onFile) => {
                          slotFileHandlerRef.current = onFile;
                          slotFileInputRef.current?.click();
                        }}
                      />
                      <input
                        ref={slotFileInputRef}
                        type="file"
                        accept={INTERIOR_REPLACE_ACCEPT}
                        disabled={converting || saving}
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          const handler = slotFileHandlerRef.current;
                          slotFileHandlerRef.current = null;
                          if (file && handler) handler(file);
                        }}
                      />
                    </>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <label className={tileClass}>
                  <IdentityClipart kind="name" />
                  <span className="mt-1.5 text-center text-[11px] font-medium text-neutral-500">
                    Name
                  </span>
                  <input
                    value={agentName}
                    onChange={(event) => setAgentName(event.target.value)}
                    disabled={saving || converting}
                    className={tileFieldClass}
                    autoComplete="name"
                    placeholder="Name"
                  />
                </label>
                <label className={tileClass}>
                  <IdentityClipart kind="email" />
                  <span className="mt-1.5 text-center text-[11px] font-medium text-neutral-500">
                    Email
                  </span>
                  <input
                    type="email"
                    value={agentEmail}
                    onChange={(event) => setAgentEmail(event.target.value)}
                    disabled={saving || converting}
                    className={tileFieldClass}
                    autoComplete="email"
                    placeholder="Email"
                  />
                </label>
                <label
                  htmlFor={logoInputId}
                  className={`${tileClass} cursor-pointer transition hover:bg-[#fafafa] ${
                    converting || saving ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  {logoPreviewUrl ? (
                    <img
                      src={logoPreviewUrl}
                      alt="Brokerage logo preview"
                      className="h-11 w-full rounded-[12px] bg-[#f5f5f7] object-contain p-1.5"
                    />
                  ) : (
                    <IdentityClipart kind="logo" />
                  )}
                  <span className="mt-1.5 text-center text-[11px] font-medium text-neutral-500">
                    Logo
                  </span>
                  <span className="mt-0.5 truncate text-center text-[12px] tracking-tight text-neutral-950">
                    {logoFile ? logoFile.name : "Add"}
                  </span>
                  <input
                    id={logoInputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={converting || saving}
                    onChange={(event) =>
                      setLogoFile(event.target.files?.[0] || null)
                    }
                    className="sr-only"
                  />
                </label>
                <label
                  htmlFor={agentPhotoInputId}
                  className={`${tileClass} cursor-pointer transition hover:bg-[#fafafa] ${
                    converting || saving ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  {photoPreviewUrl ? (
                    <img
                      src={photoPreviewUrl}
                      alt="Agent photo preview"
                      className="h-11 w-full rounded-[12px] object-cover"
                    />
                  ) : (
                    <IdentityClipart kind="photo" />
                  )}
                  <span className="mt-1.5 text-center text-[11px] font-medium text-neutral-500">
                    Photo
                  </span>
                  <span className="mt-0.5 truncate text-center text-[12px] tracking-tight text-neutral-950">
                    {agentPhotoFile ? agentPhotoFile.name : "Add"}
                  </span>
                  <input
                    id={agentPhotoInputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={converting || saving}
                    onChange={(event) =>
                      setAgentPhotoFile(event.target.files?.[0] || null)
                    }
                    className="sr-only"
                  />
                </label>
              </div>

              {error ? (
                <p className="px-1 text-center text-[13px] leading-relaxed text-red-600">
                  {error}
                </p>
              ) : null}

              {uploadFailures.length > 0 ? (
                <ul className={`${cardClass} divide-y divide-black/[0.06]`}>
                  {uploadFailures.map((failure) => (
                    <li key={failure.id} className={`${rowClass} py-3`}>
                      <div className="min-w-0">
                        <p className="truncate text-[15px]">{failure.label}</p>
                        <p className="text-[12px] text-neutral-400">{failure.error}</p>
                      </div>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void retryFailedUpload(failure)}
                        className="shrink-0 text-[15px] font-medium text-sky-600 disabled:opacity-40"
                      >
                        Retry
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {(saving || activeStage) && (
                <ol className={`${cardClass} space-y-0 px-5 py-4 text-[15px]`}>
                  {STAGE_ORDER.map((stage, index) => {
                    const done =
                      activeStage === "completed" ||
                      (activeIndex >= 0 && index < activeIndex);
                    const current = activeStage === stage;
                    return (
                      <li
                        key={stage}
                        className={`flex items-center justify-between py-1.5 ${
                          done
                            ? "text-neutral-950"
                            : current
                              ? "text-neutral-950"
                              : "text-neutral-300"
                        }`}
                      >
                        <span>
                          {EBOOK_GENERATION_STAGE_LABELS[stage]}
                          {current && stageDetail ? (
                            <span className="ml-2 text-[12px] font-normal text-neutral-400">
                              {stageDetail}
                            </span>
                          ) : null}
                        </span>
                        <span className="text-[12px] text-neutral-400">
                          {done ? "Done" : current ? "Now" : ""}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}

              <button
                type="submit"
                disabled={!canGenerate || saving || converting}
                className="h-14 w-full rounded-full bg-neutral-950 text-[17px] font-medium tracking-tight text-white transition hover:bg-neutral-800 disabled:opacity-30"
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
                    ? "Reading upload…"
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

function IdentityClipart({
  kind,
}: {
  kind: "name" | "email" | "logo" | "photo";
}) {
  return (
    <div
      className="flex h-11 items-center justify-center rounded-[12px] bg-[#f5f5f7]"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 88 72"
        className="h-8 w-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {kind === "name" ? (
          <>
            <rect x="14" y="10" width="60" height="52" rx="12" fill="#E8E8ED" />
            <circle cx="44" cy="30" r="10" fill="#C7C7CC" />
            <path
              d="M24 52c3.5-9 12-14 20-14s16.5 5 20 14"
              fill="#AEAEB2"
            />
          </>
        ) : null}
        {kind === "email" ? (
          <>
            <rect x="12" y="18" width="64" height="40" rx="10" fill="#E8E8ED" />
            <path
              d="M16 24l28 18 28-18"
              stroke="#AEAEB2"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <path
              d="M16 52l20-16"
              stroke="#C7C7CC"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M72 52L52 36"
              stroke="#C7C7CC"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </>
        ) : null}
        {kind === "logo" ? (
          <>
            <rect x="18" y="14" width="52" height="46" rx="10" fill="#E8E8ED" />
            <path d="M28 48V32l16-10 16 10v16H28z" fill="#C7C7CC" />
            <rect x="40" y="36" width="8" height="12" rx="1.5" fill="#8E8E93" />
          </>
        ) : null}
        {kind === "photo" ? (
          <>
            <rect x="16" y="16" width="56" height="42" rx="10" fill="#E8E8ED" />
            <circle cx="44" cy="37" r="11" fill="#D1D1D6" />
            <circle cx="44" cy="37" r="6.5" fill="#8E8E93" />
            <rect x="22" y="22" width="10" height="6" rx="2" fill="#C7C7CC" />
          </>
        ) : null}
      </svg>
    </div>
  );
}
