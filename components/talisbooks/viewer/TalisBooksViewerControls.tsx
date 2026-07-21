"use client";

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RectangleVertical,
} from "lucide-react";
import {
  TALISBOOKS_VIEWER_SPEED_PRESETS,
  intervalMsToSpeedPercent,
  speedPercentToIntervalMs,
  type TalisBooksViewerSpeedPresetId,
  type TalisBooksViewerViewMode,
} from "@/lib/talisbooks/viewer";

interface TalisBooksViewerControlsProps {
  pageLabel: string;
  viewMode: TalisBooksViewerViewMode;
  autoPlaying: boolean;
  pausedByHover: boolean;
  intervalMs: number;
  onViewModeChange: (mode: TalisBooksViewerViewMode) => void;
  onToggleAutoplay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onIntervalChange: (intervalMs: number) => void;
}

export default function TalisBooksViewerControls({
  pageLabel,
  viewMode,
  autoPlaying,
  pausedByHover,
  intervalMs,
  onViewModeChange,
  onToggleAutoplay,
  onPrevious,
  onNext,
  onIntervalChange,
}: TalisBooksViewerControlsProps) {
  const speedPercent = intervalMsToSpeedPercent(intervalMs);
  const statusLabel = !autoPlaying
    ? "Paused"
    : pausedByHover
      ? "Paused on hover"
      : "Auto-flipping";

  const applyPreset = (id: TalisBooksViewerSpeedPresetId) => {
    const preset = TALISBOOKS_VIEWER_SPEED_PRESETS.find((entry) => entry.id === id);
    if (preset) {
      onIntervalChange(preset.intervalMs);
    }
  };

  return (
    <div className="talisbooks-viewer-controls">
      <div className="talisbooks-viewer-controls__row">
        <button
          type="button"
          className="talisbooks-viewer-controls__icon-btn"
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            onPrevious();
          }}
          onClick={(event) => {
            // Keyboard / assistive click only — pointer already handled above.
            if (event.detail !== 0) {
              event.preventDefault();
              return;
            }
            onPrevious();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onPrevious();
            }
          }}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="talisbooks-viewer-controls__play-btn"
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            onToggleAutoplay();
          }}
          onClick={(event) => {
            if (event.detail !== 0) {
              event.preventDefault();
              return;
            }
            onToggleAutoplay();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onToggleAutoplay();
            }
          }}
          aria-label={autoPlaying ? "Pause auto page turn" : "Resume auto page turn"}
        >
          {autoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span>{autoPlaying ? "Pause" : "Play"}</span>
        </button>
        <button
          type="button"
          className="talisbooks-viewer-controls__icon-btn"
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            onNext();
          }}
          onClick={(event) => {
            if (event.detail !== 0) {
              event.preventDefault();
              return;
            }
            onNext();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onNext();
            }
          }}
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div
        className="talisbooks-viewer-controls__view"
        role="group"
        aria-label="View mode"
      >
        <button
          type="button"
          className={[
            "talisbooks-viewer-controls__view-btn",
            viewMode === "spread"
              ? "talisbooks-viewer-controls__view-btn--active"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-pressed={viewMode === "spread"}
          onClick={() => onViewModeChange("spread")}
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          Spread
        </button>
        <button
          type="button"
          className={[
            "talisbooks-viewer-controls__view-btn",
            viewMode === "single"
              ? "talisbooks-viewer-controls__view-btn--active"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-pressed={viewMode === "single"}
          onClick={() => onViewModeChange("single")}
        >
          <RectangleVertical className="h-3.5 w-3.5" aria-hidden="true" />
          Single
        </button>
      </div>

      <div className="talisbooks-viewer-controls__meta">
        <p className="talisbooks-viewer-controls__page">{pageLabel}</p>
        <p className="talisbooks-viewer-controls__status">{statusLabel}</p>
      </div>

      <div className="talisbooks-viewer-controls__speed">
        <div className="talisbooks-viewer-controls__speed-header">
          <label htmlFor="talisbooks-viewer-speed">Flip speed</label>
          <span>{(intervalMs / 1000).toFixed(1)}s</span>
        </div>
        <input
          id="talisbooks-viewer-speed"
          type="range"
          min={0}
          max={100}
          value={speedPercent}
          onChange={(event) =>
            onIntervalChange(speedPercentToIntervalMs(Number(event.target.value)))
          }
          className="talisbooks-viewer-controls__slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={speedPercent}
          aria-label="Page flip speed"
        />
        <div className="talisbooks-viewer-controls__presets">
          {TALISBOOKS_VIEWER_SPEED_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={[
                "talisbooks-viewer-controls__preset",
                intervalMs === preset.intervalMs
                  ? "talisbooks-viewer-controls__preset--active"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => applyPreset(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
