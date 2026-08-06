/** Client-safe ebook generation stage constants (no server imports). */

export const EBOOK_GENERATION_STAGES = [
  "upload_complete",
  "preparing_images",
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
  upload_complete: "Upload complete",
  preparing_images: "Preparing images",
  generating_pages: "Generating pages",
  publishing: "Publishing",
  completed: "Completed",
};
