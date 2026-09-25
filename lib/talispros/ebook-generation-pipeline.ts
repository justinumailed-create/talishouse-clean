import { ISOLATED_BOOKSHELF_PATH } from "@/lib/talisbooks/isolated-bookshelf";
import { generateSelfServiceEbook } from "@/lib/talisbooks/self-service-ebook";
import { canEditMapSite } from "@/lib/mapsite-edit-auth";
import { buildMapSiteAfterBookHref } from "@/lib/talispros/ebook-choice";
import {
  resolveOnboardingFromMapSite,
  resolveOnboardingFromRequest,
  type OnboardingContext,
  type ResolveOnboardingResult,
} from "@/lib/talispros/resolve-onboarding-from-request";
import {
  ONBOARDING_JOB_TIMEOUT_MS,
  logOnboardingFailure,
  logOnboardingStep,
  onboardingNow,
  withOnboardingTimeout,
  type OnboardingFailureReport,
} from "@/lib/onboarding-timing";
import type { OptimizedEbookImageAsset } from "@/lib/talisbooks/auto-draft-ebook";
import {
  validateExplicitCoverAssets,
  type SelfServiceBookOptions,
  type SelfServicePageCaption,
} from "@/lib/talisbooks/self-service-page-plan";
import type { Rm22TemplatePayload } from "@/lib/talisbooks/rm22-template";
import type { EbookGenerationProgressEvent } from "@/lib/talispros/ebook-generation-stages";
import type { MapsiteFlagIdentity } from "@/lib/talispros/flag-identity";
import { rejectDisallowedEbookFiles } from "@/lib/talisbooks/ebook-upload-formats-server";

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
  /** Admin / owner Mapsite™ path when no Build Request exists. Never trusted without canEditMapSite. */
  fastCode?: string | null;
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
  frontCover?: OptimizedEbookImageAsset | null;
  backCover?: OptimizedEbookImageAsset | null;
  rm22Template?: Rm22TemplatePayload | null;
  rm22SlotHydration?: import("@/lib/talisbooks/rm22-template").Rm22SlotHydration | null;
  replaceBookId?: string | null;
  flagIdentity?: MapsiteFlagIdentity;
  /** Catalogue isolated bookshelf — admin self-serve destination. */
  isolatedBookshelf?: boolean;
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
 * Tracked ebook generation job keyed by Build Request ID, or by an editable
 * Mapsite™ FAST Code when a Build Request was never created.
 * Public generate still requires requestId. Client FAST codes are ignored
 * unless `canEditMapSite` succeeds.
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
        currentStage = "resolve_request";
        let resolved: ResolveOnboardingResult;
        if (requestId) {
          resolved = await resolveOnboardingFromRequest(requestId);
        } else {
          const editorFastCode = input.fastCode?.trim().toLowerCase() || "";
          if (!editorFastCode) {
            return fail("resolve_request", "Build Request ID is required.");
          }
          if (!(await canEditMapSite(editorFastCode))) {
            return fail("resolve_request", "Build Request ID is required.");
          }
          resolved = await resolveOnboardingFromMapSite(editorFastCode);
        }
        if (!resolved.ok) {
          return fail(resolved.report.stage, resolved.report.error, resolved.report);
        }

        const ctx: OnboardingContext = resolved.context;
        requestId = ctx.requestId;
        fastCode = ctx.fastCode;
        mapsiteId = ctx.mapsiteId;
        const progressRequestId = ctx.requestId || ctx.mapsiteId || ctx.fastCode;

        const optimizedImages = (input.optimizedImages || []).filter(
          (item) => item.url && item.width > 0 && item.height > 0,
        );
        const rawImages = input.images || [];
        const disallowed = rejectDisallowedEbookFiles([
          ...rawImages,
          ...(input.agentPhoto ? [input.agentPhoto] : []),
          ...(input.brokerageLogo ? [input.brokerageLogo] : []),
        ]);
        if (disallowed) {
          return fail("uploading_images", disallowed);
        }

        if (!optimizedImages.length && !rawImages.length && !input.rm22Template) {
          return fail(
            "uploading_images",
            "Upload at least one property image or PDF page."
          );
        }

        const coverError = validateExplicitCoverAssets(
          input.frontCover,
          input.backCover,
        );
        if (coverError) {
          return fail("generating_pages", coverError);
        }

        currentStage = "generating_pages";
        await emit(input.onProgress, {
          stage: "generating_pages",
          requestId: progressRequestId,
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
          frontCover: input.frontCover,
          backCover: input.backCover,
          rm22Template: input.rm22Template,
          rm22SlotHydration: input.rm22SlotHydration,
          replaceBookId: input.replaceBookId,
          asAdmin: await canEditMapSite(ctx.fastCode),
          isolatedBookshelf: Boolean(input.isolatedBookshelf),
          flagIdentity: input.flagIdentity,
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
          requestId: progressRequestId,
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
          requestId: progressRequestId,
          fastCode: ctx.fastCode,
          mapsiteId: result.mapsiteId || ctx.mapsiteId,
          viewerUrl: input.isolatedBookshelf
            ? ISOLATED_BOOKSHELF_PATH
            : result.viewerUrl,
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
