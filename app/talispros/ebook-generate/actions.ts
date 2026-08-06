"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";
import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";
import { runEbookGenerationPipeline } from "@/lib/talispros/ebook-generation-pipeline";
import {
  logOnboardingStep,
  onboardingNow,
} from "@/lib/onboarding-timing";
import type { GenerateSelfServiceEbookActionResult } from "@/lib/talispros/ebook-generate-action-types";

/**
 * Self-service ebook generation.
 * Business state is resolved exclusively from requestId (Build Request).
 * Client-supplied fastCode / mapsiteId / accountType are ignored.
 */
export async function generateSelfServiceEbookAction(
  formData: FormData
): Promise<GenerateSelfServiceEbookActionResult> {
  const actionStarted = onboardingNow();
  const requestId = String(formData.get("requestId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const agentName = String(formData.get("agentName") || "").trim();
  const agentEmail = String(formData.get("agentEmail") || "").trim();
  const agentPhone = String(formData.get("agentPhone") || "").trim();
  const uploadModeRaw = String(formData.get("uploadMode") || "")
    .trim()
    .toLowerCase();
  const uploadMode = uploadModeRaw === "pdf" ? "pdf" : "images";
  const brokerageLogoRaw = formData.get("brokerageLogo");
  const brokerageLogo =
    brokerageLogoRaw instanceof File && brokerageLogoRaw.size > 0
      ? brokerageLogoRaw
      : null;
  const agentPhotoRaw = formData.get("agentPhoto");
  const agentPhoto =
    agentPhotoRaw instanceof File && agentPhotoRaw.size > 0 ? agentPhotoRaw : null;

  const images = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const result = await runEbookGenerationPipeline({
    requestId,
    title,
    description,
    location,
    agentName,
    agentEmail,
    agentPhone,
    brokerageLogo,
    agentPhoto,
    images,
    uploadMode,
  });

  if (result.stage !== "completed") {
    if (result.stage !== "failed") {
      return {
        success: false,
        error: "Ebook generation ended unexpectedly before completion.",
        requestId: result.requestId,
        fastCode: result.fastCode,
        mapsiteId: result.mapsiteId,
        stage: result.stage,
        durationMs: onboardingNow() - actionStarted,
      };
    }
    logOnboardingStep("Ebook generate", actionStarted, {
      failed: true,
      stage: result.failedStage,
      requestId: result.requestId,
    });
    return {
      success: false,
      error: result.error,
      requestId: result.requestId,
      fastCode: result.fastCode,
      mapsiteId: result.mapsiteId,
      stage: result.failedStage,
      durationMs: result.durationMs,
    };
  }

  revalidatePath(ROUTES.TALISBOOKS_LIBRARY);
  revalidatePath(`${ROUTES.TALISBOOKS_VIEWER}/${result.slug}`);
  revalidatePath(MAPSITE_APP_PATH);
  revalidatePath(`/talispros/admin/mapsites/${result.fastCode}`);

  logOnboardingStep("Ebook generate", actionStarted, {
    requestId: result.requestId,
    fastCode: result.fastCode,
    slug: result.slug,
  });

  return {
    success: true,
    viewerUrl: result.viewerUrl,
    mapsiteHref: result.mapsiteHref,
    slug: result.slug,
    requestId: result.requestId,
    fastCode: result.fastCode,
    mapsiteId: result.mapsiteId,
    durationMs: result.durationMs,
    stage: "completed",
  };
}
