/**
 * TalisU™ Knowledge Base content buckets (Audios / Videos / Learning Material).
 * Defaults reuse existing /talisu audio + video destinations; Learning Material
 * starts as a growable placeholder grid. Overrides persist in localStorage so
 * Ralf (rm22) can update from his Mapsite™ dashboard manage UI.
 */

export type TalisUKbBucket = "audios" | "videos" | "learning";

export type TalisUKbItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  /** Optional badge shown on cards (e.g. "Audio", "Video"). */
  kind?: string;
};

export const TALISU_KB_STORAGE_KEY = "talisu_kb_content_v1";

export const TALISU_KB_MANAGE_PATH = "/talisu/kb/manage";
export const TALISU_KB_PATH = "/talisu/kb";

/** FAST Code whose claimed Mapsite™ dashboard gets a dedicated KB manage entry. */
export const TALISU_KB_MAPSITE_MANAGER_FAST_CODE = "rm22";

export const TALISU_KB_DEFAULT_AUDIOS: readonly TalisUKbItem[] = [
  {
    id: "aisha-webster",
    title: "Digital Property Fractionalization — Aisha & Webster",
    description:
      "Listen to the NotebookLM-style dialogue, or open the full transcript on Audio Files.",
    href: "/talisu/au",
    kind: "Audio",
  },
  {
    id: "aisha-summary",
    title: "Aisha — Welcome Summary",
    description: "Short (~1 minute) welcome audio from the TalisU™ home experience.",
    href: "/talisu/au",
    kind: "Audio",
  },
] as const;

export const TALISU_KB_DEFAULT_VIDEOS: readonly TalisUKbItem[] = [
  {
    id: "talisu-video-hub",
    title: "TalisU™ Video Library",
    description: "Walk-throughs, open houses, and partner programming hub.",
    href: "/talisu/video",
    kind: "Video",
  },
  {
    id: "talistv",
    title: "TalisTV™",
    description: "Live schedule and channel experience.",
    href: "/talistv",
    kind: "Video",
  },
] as const;

export const TALISU_KB_DEFAULT_LEARNING: readonly TalisUKbItem[] = [
  {
    id: "lm-mapsites",
    title: "Mapsites™ Playbook",
    description: "Coming soon — claim, activate, and pin best practices.",
    href: "/talisu/kb",
    kind: "Guide",
  },
  {
    id: "lm-fast-codes",
    title: "FAST Codes™ Guide",
    description: "Coming soon — issuing and promoting your market code.",
    href: "/talisu/kb",
    kind: "Guide",
  },
  {
    id: "lm-markets",
    title: "Markets Overview",
    description: "Explore industry-adjacent markets on the TalisU™ map.",
    href: "/talisu/mkts",
    kind: "Guide",
  },
] as const;

export type TalisUKbContentState = {
  audios: TalisUKbItem[];
  videos: TalisUKbItem[];
  learning: TalisUKbItem[];
};

export function defaultTalisUKbContent(): TalisUKbContentState {
  return {
    audios: TALISU_KB_DEFAULT_AUDIOS.map((item) => ({ ...item })),
    videos: TALISU_KB_DEFAULT_VIDEOS.map((item) => ({ ...item })),
    learning: TALISU_KB_DEFAULT_LEARNING.map((item) => ({ ...item })),
  };
}

function isItem(value: unknown): value is TalisUKbItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.description === "string" &&
    typeof item.href === "string"
  );
}

function sanitizeBucket(value: unknown, fallback: TalisUKbItem[]): TalisUKbItem[] {
  if (!Array.isArray(value)) return fallback.map((item) => ({ ...item }));
  const items = value.filter(isItem).map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    href: item.href,
    kind: typeof item.kind === "string" ? item.kind : undefined,
  }));
  return items.length ? items : fallback.map((item) => ({ ...item }));
}

export function parseTalisUKbContent(raw: unknown): TalisUKbContentState {
  const defaults = defaultTalisUKbContent();
  if (!raw || typeof raw !== "object") return defaults;
  const data = raw as Record<string, unknown>;
  return {
    audios: sanitizeBucket(data.audios, defaults.audios),
    videos: sanitizeBucket(data.videos, defaults.videos),
    learning: sanitizeBucket(data.learning, defaults.learning),
  };
}

export function readTalisUKbContentFromStorage(): TalisUKbContentState {
  if (typeof window === "undefined") return defaultTalisUKbContent();
  try {
    const raw = window.localStorage.getItem(TALISU_KB_STORAGE_KEY);
    if (!raw) return defaultTalisUKbContent();
    return parseTalisUKbContent(JSON.parse(raw));
  } catch {
    return defaultTalisUKbContent();
  }
}

export function writeTalisUKbContentToStorage(state: TalisUKbContentState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TALISU_KB_STORAGE_KEY, JSON.stringify(state));
}

export function isTalisUKbMapsiteManagerFastCode(fastCode: string | null | undefined): boolean {
  return (
    (fastCode || "").trim().toLowerCase() === TALISU_KB_MAPSITE_MANAGER_FAST_CODE
  );
}

export const TALISU_KB_BUCKET_LABELS: Record<TalisUKbBucket, string> = {
  audios: "Audios",
  videos: "Videos",
  learning: "Learning Material",
};
