import type { TalisBooksPageRole } from "../types";
import type { TalisBooksCoverTemplateId } from "../covers";

export type TalisBooksViewerPageLayout =
  | "cover"
  | "agent_intro"
  | "agent_summary"
  | "caption"
  | "full_bleed"
  | "centerfold_left"
  | "centerfold_right"
  | "parting"
  | "maps";

export interface TalisBooksViewerPage {
  id: string;
  pageNumber: number;
  pageRole: TalisBooksPageRole;
  title: string;
  subtitle?: string;
  body?: string;
  heroImageUrl?: string;
  /**
   * Full landscape original for centerfold spreads.
   * When set, left/right pages share this image with continuous crop so the join aligns.
   */
  spreadImageUrl?: string;
  layout?: TalisBooksViewerPageLayout;
  coverTemplateId?: TalisBooksCoverTemplateId;
  /** Maps layout — property PIN latitude. */
  latitude?: number;
  /** Maps layout — property PIN longitude. */
  longitude?: number;
  /** Maps layout — initial zoom (defaults to 14). */
  mapZoom?: number;
  agentName?: string;
  agentTitle?: string;
  agentPhone?: string;
  agentEmail?: string;
  agentPhotoUrl?: string;
  brokerageName?: string;
  brokerageLine?: string;
  brokerageLogoUrl?: string;
  slogan?: string;
  mission?: string;
  address?: string;
}

export interface TalisBooksViewerBook {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  /** Closed hard-cover art (front). Falls back to first cover page hero. */
  frontCoverImageUrl?: string;
  /** Closed hard-cover art (back). Falls back to last property hero or front. */
  backCoverImageUrl?: string;
  pages: TalisBooksViewerPage[];
}

export interface TalisBooksViewerPlaybackState {
  pageIndex: number;
  autoPlaying: boolean;
  pausedByHover: boolean;
  intervalMs: number;
}

/**
 * Future-ready narration types — not wired into playback yet.
 * Audio sync can later pace flips via onPageEnter / syncWithAutoTurn.
 */
export interface TalisBooksNarrationCue {
  pageNumber: number;
  startMs?: number;
  durationMs?: number;
  text?: string;
  audioUrl?: string;
}

export interface TalisBooksNarrationTrack {
  id: string;
  label: string;
  locale: string;
  cues: TalisBooksNarrationCue[];
}

export interface TalisBooksNarrationController {
  enabled: boolean;
  track: TalisBooksNarrationTrack | null;
  /** Called when a page becomes active — reserved for future TTS / audio sync. */
  onPageEnter?: (pageNumber: number) => void;
  onPageLeave?: (pageNumber: number) => void;
  /** When true (future), auto-turn waits for cue duration instead of fixed interval. */
  syncWithAutoTurn?: boolean;
}
