import { generateSelfServiceEbook } from "@/lib/talisbooks/self-service-ebook";
import { buildMapSiteAfterBookHref } from "@/lib/talispros/ebook-choice";
import { resolveOnboardingFromRequest } from "@/lib/talispros/resolve-onboarding-from-request";
import {
  ONBOARDING_JOB_TIMEOUT_MS,
  logOnboardingFailure,
  logOnboardingStep,
  onboardingNow,
  withOnboardingTimeout,
  type OnboardingFailureReport,
} from "@/lib/onboarding-timing";
import type { EbookGenerationProgressEvent } from "@/lib/talispros/ebook-generation-stages";

export type {
  EbookGenerationProgressEvent,
  EbookGenerationStage,
} from "@/lib/talispros/ebook-generation-stages";
export {
  EBOOK_GENERATION_STAGES,
  EBOOK_GENERATION_STAGE_LABELS,
} from "@/lib/talispros/ebook-generation-stages";

export type RunEbookGenerationInput = {
  requestId: string;
  title: string;
  description: string;
  location: string;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
  brokerageLogo?: File | null;
  agentPhoto?: File | null;
  images: File[];
  uploadMode: "images" | "pdf";
  onProgress?: (event: EbookGenerationProgressEvent) => void | Promise<void>;
  /** Override job timeout (ms). Defaults to ONBOARDING_JOB_TIMEOUT_MS. */
  timeoutMs?: number;
};

function emit(
  onProgress: RunEbookGenerationInput["onProgress"],
  event: EbookGenerationProgressEvent
) {
  return onProgress?.(event);
}

/**
 * Tracked ebook generation job keyed by Build Request ID.
 * Resolves FAST Code / MapSite / account type from the database only.
 */
export async function runEbookGenerationPipeline(
  input: RunEbookGenerationInput
): Promise<EbookGenerationProgressEvent> {
  const pipelineStarted = onboardingNow();
  const timeoutMs = input.timeoutMs ?? ONBOARDING_JOB_TIMEOUT_MS;
  let requestId: string | null = input.requestId.trim() || null;
  let fastCode: string | null = null;
  let mapsiteId: string | null = null;
  let currentStage = "resolve_request";

  const fail = (
    stage: string,
    error: string,
    extras?: Partial<OnboardingFailureReport>
  ): EbookGenerationProgressEvent => {
    const report: OnboardingFailureReport = {
      requestId: extras?.requestId ?? requestId,
      fastCode: extras?.fastCode ?? fastCode,
      mapsiteId: extras?.mapsiteId ?? mapsiteId,
      stage,
      error,
      durationMs: onboardingNow() - pipelineStarted,
    };
    logOnboardingFailure(report);
    const event: EbookGenerationProgressEvent = {
      stage: "failed",
      requestId: report.requestId,
      fastCode: report.fastCode,
      mapsiteId: report.mapsiteId,
      error: report.error,
      durationMs: report.durationMs,
      failedStage: stage,
    };
    void emit(input.onProgress, event);
    return event;
  };

  try {
    return await withOnboardingTimeout(
      "Ebook generation job",
      timeoutMs,
      async () => {
        if (!requestId) {
          return fail("resolve_request", "Build Request ID is required.");
        }

        currentStage = "upload_complete";
        await emit(input.onProgress, {
          stage: "upload_complete",
          requestId,
          fastCode,
          mapsiteId,
        });
        logOnboardingStep("Upload complete", pipelineStarted, { requestId });

        currentStage = "resolve_request";
        const resolved = await resolveOnboardingFromRequest(requestId);
        if (!resolved.ok) {
          return fail(resolved.report.stage, resolved.report.error, resolved.report);
        }

        const ctx = resolved.context;
        requestId = ctx.requestId;
        fastCode = ctx.fastCode;
        mapsiteId = ctx.mapsiteId;

        currentStage = "preparing_images";
        await emit(input.onProgress, {
          stage: "preparing_images",
          requestId,
          fastCode,
          mapsiteId,
        });

        if (!input.images.length) {
          return fail(
            "preparing_images",
            "Upload at least one property image or PDF page."
          );
        }

        currentStage = "generating_pages";
        await emit(input.onProgress, {
          stage: "generating_pages",
          requestId,
          fastCode,
          mapsiteId,
        });

        const generateStarted = onboardingNow();
        const result = await generateSelfServiceEbook({
          fastCode: ctx.fastCode,
          mapsiteId: ctx.mapsiteId,
          accountType: ctx.accountType,
          requestId: ctx.requestId,
          title: input.title.trim() || `${ctx.fastCode.toUpperCase()} TalisBook™`,
          description: input.description.trim(),
          location:
            input.location.trim() ||
            ctx.pin.streetAddress ||
            "",
          agentName: input.agentName?.trim() || ctx.owner.agentName,
          agentEmail: input.agentEmail?.trim() || ctx.owner.email,
          agentPhone: input.agentPhone?.trim() || ctx.owner.phone,
          brokerageLogo: input.brokerageLogo,
          agentPhoto: input.agentPhoto,
          images: input.images,
          uploadMode: input.uploadMode,
        });
        logOnboardingStep("Book generation", generateStarted, {
          requestId,
          fastCode,
          success: result.success,
        });

        if (!result.success) {
          return fail("generating_pages", result.error);
        }

        currentStage = "publishing";
        await emit(input.onProgress, {
          stage: "publishing",
          requestId,
          fastCode,
          mapsiteId: result.mapsiteId || mapsiteId,
        });

        const mapsiteHref = buildMapSiteAfterBookHref({
          fastCode: ctx.fastCode,
          mapsiteId: result.mapsiteId || ctx.mapsiteId,
          accountType: ctx.accountType,
          requestId: ctx.requestId,
          bookSlug: result.slug,
        });

        const durationMs = onboardingNow() - pipelineStarted;
        logOnboardingStep("Storage publish", generateStarted, {
          slug: result.slug,
        });
        logOnboardingStep("Ebook pipeline", pipelineStarted, {
          requestId,
          fastCode,
          slug: result.slug,
          durationMs,
        });

        const completed: EbookGenerationProgressEvent = {
          stage: "completed",
          requestId: ctx.requestId,
          fastCode: ctx.fastCode,
          mapsiteId: result.mapsiteId || ctx.mapsiteId,
          viewerUrl: result.viewerUrl,
          mapsiteHref,
          slug: result.slug,
          durationMs,
        };
        await emit(input.onProgress, completed);
        return completed;
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ebook generation failed.";
    return fail(currentStage, message);
  }
}
