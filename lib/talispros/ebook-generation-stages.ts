/** Client-safe ebook generation stage constants (no server imports). */

export const EBOOK_GENERATION_STAGES = [
  "optimizing_images",
  "uploading_images",
  "generating_pages",
  "publishing",
  "completed",
] as const;

export type EbookGenerationStage =
  | (typeof EBOOK_GENERATION_STAGES)[number]
  | "failed";

export type EbookGenerationProgressEvent =
  | {
      stage: Exclude<EbookGenerationStage, "failed" | "completed">;
      requestId: string;
      fastCode: string | null;
      mapsiteId: string | null;
      /** Optional per-stage detail (e.g. "3/22"). */
      detail?: string;
    }
  | {
      stage: "completed";
      requestId: string;
      fastCode: string;
      mapsiteId: string | null;
      viewerUrl: string;
      mapsiteHref: string;
      slug: string;
      durationMs: number;
    }
  | {
      stage: "failed";
      requestId: string | null;
      fastCode: string | null;
      mapsiteId: string | null;
      error: string;
      durationMs: number;
      failedStage: string;
    };

export const EBOOK_GENERATION_STAGE_LABELS: Record<
  Exclude<EbookGenerationStage, "failed">,
  string
> = {
  optimizing_images: "Optimizing images",
  uploading_images: "Uploading images",
  generating_pages: "Building ebook",
  publishing: "Publishing ebook",
  completed: "Completed",
};
