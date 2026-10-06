"use client";

import { useT } from "@/lib/i18n/client";
import {
  BookOpen,
  Pause,
  Play,
  RectangleVertical,
  RotateCw,
} from "lucide-react";
import {
  TALISBOOKS_VIEWER_SPEED_PRESETS,
  type TalisBooksViewerSpeedPresetId,
  type TalisBooksViewerViewMode,
} from "@/lib/talisbooks/viewer";

export function TalisBooksViewerPlaybackRail({
  viewMode,
  autoPlaying,
  intervalMs,
  stageLandscape = false,
  onViewModeChange,
  onToggleAutoplay,
  onIntervalChange,
  onToggleStageLandscape,
}: {
  viewMode: TalisBooksViewerViewMode;
  autoPlaying: boolean;
  intervalMs: number;
  /** Mobile: CSS-rotate the stage to landscape without turning the phone. */
  stageLandscape?: boolean;
  onViewModeChange: (mode: TalisBooksViewerViewMode) => void;
  onToggleAutoplay: () => void;
  onIntervalChange: (intervalMs: number) => void;
  onToggleStageLandscape?: () => void;
}) {
  const tv = useT().viewer;
  const applyPreset = (id: TalisBooksViewerSpeedPresetId) => {
    const preset = TALISBOOKS_VIEWER_SPEED_PRESETS.find((entry) => entry.id === id);
    if (preset) onIntervalChange(preset.intervalMs);
  };

  return (
    <aside
      className="talisbooks-viewer__rail talisbooks-viewer__rail--right"
      aria-label={tv.playback}
    >
      <button
        type="button"
        className="talisbooks-viewer__rail-btn talisbooks-viewer__rail-btn--play"
        onClick={onToggleAutoplay}
        aria-label={autoPlaying ? tv.pause : tv.play}
        title={autoPlaying ? tv.pause : tv.play}
      >
        {autoPlaying ? (
          <Pause className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      <div className="talisbooks-viewer__seconds" role="group" aria-label={tv.flipSpeed}>
        {TALISBOOKS_VIEWER_SPEED_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={[
              "talisbooks-viewer__seconds-btn",
              intervalMs === preset.intervalMs
                ? "talisbooks-viewer__seconds-btn--active"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => applyPreset(preset.id)}
            aria-pressed={intervalMs === preset.intervalMs}
            title={tv.speedPresets[preset.id] ?? preset.label}
          >
            {(preset.intervalMs / 1000).toFixed(preset.intervalMs % 1000 === 0 ? 0 : 1)}s
          </button>
        ))}
      </div>
      <div className="talisbooks-viewer__view-icons" role="group" aria-label={tv.viewMode}>
        <button
          type="button"
          className={[
            "talisbooks-viewer__rail-btn",
            viewMode === "spread" ? "talisbooks-viewer__rail-btn--active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-pressed={viewMode === "spread"}
          onClick={() => onViewModeChange("spread")}
          title={tv.spread}
          aria-label={tv.spreadView}
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={[
            "talisbooks-viewer__rail-btn",
            viewMode === "single" ? "talisbooks-viewer__rail-btn--active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-pressed={viewMode === "single"}
          onClick={() => onViewModeChange("single")}
          title={tv.single}
          aria-label={tv.singlePage}
        >
          <RectangleVertical className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {onToggleStageLandscape ? (
        <button
          type="button"
          className={[
            "talisbooks-viewer__rail-btn",
            "talisbooks-viewer__rail-btn--orient",
            stageLandscape ? "talisbooks-viewer__rail-btn--active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-pressed={stageLandscape}
          onClick={onToggleStageLandscape}
          title={stageLandscape ? tv.portraitStage : tv.landscapeStage}
          aria-label={
            stageLandscape
              ? tv.toPortraitAria
              : tv.toLandscapeAria
          }
        >
          <RotateCw
            className={[
              "h-3.5 w-3.5",
              stageLandscape ? "talisbooks-viewer__orient-icon--on" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden="true"
          />
        </button>
      ) : null}
    </aside>
  );
}
