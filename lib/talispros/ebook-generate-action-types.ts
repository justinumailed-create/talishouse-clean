export type GenerateSelfServiceEbookActionResult =
  | {
      success: true;
      viewerUrl: string;
      mapsiteHref: string;
      slug: string;
      requestId: string;
      fastCode: string;
      mapsiteId: string | null;
      durationMs: number;
      stage: "completed";
    }
  | {
      success: false;
      error: string;
      requestId: string | null;
      fastCode: string | null;
      mapsiteId: string | null;
      stage: string;
      durationMs: number;
    };
