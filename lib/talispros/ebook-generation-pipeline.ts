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
import type { OptimizedEbookImageAsset } from "@/lib/talisbooks/auto-draft-ebook";
import type {
  SelfServiceBookOptions,
  SelfServicePageCaption,
} from "@/lib/talisbooks/self-service-page-plan";
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
  agentPhotoUrl?: string | null;
  brokerageLogoUrl?: string | null;
  /** Legacy giant FormData path — prefer optimizedImages. */
  images?: File[];
  /** Pre-optimized property (or PDF page) assets already in storage. */
  optimizedImages?: OptimizedEbookImageAsset[];
  uploadMode: "images" | "pdf";
  bookOptions?: Partial<SelfServiceBookOptions>;
  captions?: SelfServicePageCaption[];
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
 * Resolves FAST Code / Mapsite™ / account type from the database only.
 * Expects images already optimized + stored when `optimizedImages` is provided.
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

        currentStage = "resolve_request";
        const resolved = await resolveOnboardingFromRequest(requestId);
        if (!resolved.ok) {
          return fail(resolved.report.stage, resolved.report.error, resolved.report);
        }

        const ctx = resolved.context;
        requestId = ctx.requestId;
        fastCode = ctx.fastCode;
        mapsiteId = ctx.mapsiteId;

        const optimizedImages = (input.optimizedImages || []).filter(
          (item) => item.url && item.width > 0 && item.height > 0,
        );
        const rawImages = input.images || [];

        if (!optimizedImages.length && !rawImages.length) {
          return fail(
            "uploading_images",
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
          title: input.title.trim() || `${ctx.fastCode.toUpperCase()} Talisbook™`,
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
          agentPhotoUrl: input.agentPhotoUrl,
          brokerageLogoUrl: input.brokerageLogoUrl,
          images: rawImages,
          optimizedImages,
          uploadMode: input.uploadMode,
          bookOptions: input.bookOptions,
          captions: input.captions,
        });
        logOnboardingStep("Book generation", generateStarted, {
          requestId,
          fastCode,
          success: result.success,
          preoptimized: optimizedImages.length > 0,
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
