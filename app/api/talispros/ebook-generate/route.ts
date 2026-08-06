import { runEbookGenerationPipeline } from "@/lib/talispros/ebook-generation-pipeline";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";
import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";
import {
  logOnboardingStep,
  onboardingNow,
} from "@/lib/onboarding-timing";
import type { OptimizedEbookImageAsset } from "@/lib/talisbooks/auto-draft-ebook";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function parseOptimizedImages(raw: FormDataEntryValue | null): OptimizedEbookImageAsset[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const record = item as Record<string, unknown>;
        const url = String(record.url || "").trim();
        const width = Number(record.width);
        const height = Number(record.height);
        if (!url || !Number.isFinite(width) || !Number.isFinite(height)) return null;
        if (width <= 0 || height <= 0) return null;
        return { url, width: Math.round(width), height: Math.round(height) };
      })
      .filter((item): item is OptimizedEbookImageAsset => Boolean(item));
  } catch {
    return [];
  }
}

/**
 * Streaming ebook generation job (NDJSON).
 * Prefer `optimizedImages` JSON (storage URLs) — avoids HTTP 413 from giant multipart bodies.
 * Legacy File `images` still accepted for compatibility.
 */
export async function POST(request: Request) {
  const started = onboardingNow();
  const formData = await request.formData();
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
  const optimizedImages = parseOptimizedImages(formData.get("optimizedImages"));
  const agentPhotoUrl = String(formData.get("agentPhotoUrl") || "").trim() || null;
  const brokerageLogoUrl =
    String(formData.get("brokerageLogoUrl") || "").trim() || null;

  const brokerageLogoRaw = formData.get("brokerageLogo");
  const brokerageLogo =
    brokerageLogoRaw instanceof File && brokerageLogoRaw.size > 0
      ? brokerageLogoRaw
      : null;
  const agentPhotoRaw = formData.get("agentPhoto");
  const agentPhoto =
    agentPhotoRaw instanceof File && agentPhotoRaw.size > 0
      ? agentPhotoRaw
      : null;
  const images = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  logOnboardingStep("Ebook API accept", started, {
    requestId: requestId || null,
    imageCount: images.length,
    optimizedCount: optimizedImages.length,
    uploadMode,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
      };

      try {
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
          agentPhotoUrl,
          brokerageLogoUrl,
          images,
          optimizedImages,
          uploadMode,
          onProgress: async (event) => {
            send(event);
          },
        });

        if (result.stage === "completed") {
          revalidatePath(ROUTES.TALISBOOKS_LIBRARY);
          revalidatePath(`${ROUTES.TALISBOOKS_VIEWER}/${result.slug}`);
          revalidatePath(MAPSITE_APP_PATH);
          revalidatePath(`/talispros/admin/mapsites/${result.fastCode}`);
        }

        logOnboardingStep("Ebook API done", started, {
          stage: result.stage,
          requestId: "requestId" in result ? result.requestId : requestId,
        });
      } catch (error) {
        send({
          stage: "failed",
          requestId: requestId || null,
          fastCode: null,
          mapsiteId: null,
          error:
            error instanceof Error
              ? error.message
              : "Ebook generation failed unexpectedly.",
          durationMs: onboardingNow() - started,
          failedStage: "ebook_generate_api",
        });
        logOnboardingStep("Ebook API done", started, {
          failed: true,
          requestId: requestId || null,
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
