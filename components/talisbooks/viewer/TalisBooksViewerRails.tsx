"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  MapPin,
  Pause,
  Play,
  RectangleVertical,
} from "lucide-react";
import {
  TALISBOOKS_VIEWER_SPEED_PRESETS,
  viewerFastCodeLabel,
  viewerGoogleMapsHref,
  viewerMapsiteHref,
  type TalisBooksViewerBook,
  type TalisBooksViewerSpeedPresetId,
  type TalisBooksViewerViewMode,
} from "@/lib/talisbooks/viewer";

export function TalisBooksViewerBrandRail({
  book,
}: {
  book: TalisBooksViewerBook;
}) {
  const fastCode = viewerFastCodeLabel(book.fastCode);
  const mapsHref = viewerGoogleMapsHref(book);
  const mapsiteHref = viewerMapsiteHref(book);
  return (
    <aside className="talisbooks-viewer__rail talisbooks-viewer__rail--left" aria-label="Talispros™">
      <Link href={mapsiteHref} className="talisbooks-viewer__brand" title="Open Mapsite™">
        <Image
          src="/logo.png"
          alt="Talispros™ Mapsite™"
          width={36}
          height={36}
          className="talisbooks-viewer__brand-logo"
        />
      </Link>
      {fastCode ? (
        <p className="talisbooks-viewer__fast-code">{fastCode}</p>
      ) : null}
      {mapsHref ? (
        <a
          href={mapsHref}
          target="_blank"
          rel="noreferrer"
          className="talisbooks-viewer__map-pin"
          aria-label="View location on Google Maps"
          title="View location on Google Maps"
        >
          <MapPin className="h-4 w-4" aria-hidden="true" />
        </a>
      ) : null}
    </aside>
  );
}

export function TalisBooksViewerPlaybackRail({
  viewMode,
  autoPlaying,
  intervalMs,
  onViewModeChange,
  onToggleAutoplay,
  onIntervalChange,
}: {
  viewMode: TalisBooksViewerViewMode;
  autoPlaying: boolean;
  intervalMs: number;
  onViewModeChange: (mode: TalisBooksViewerViewMode) => void;
  onToggleAutoplay: () => void;
  onIntervalChange: (intervalMs: number) => void;
}) {
  const applyPreset = (id: TalisBooksViewerSpeedPresetId) => {
    const preset = TALISBOOKS_VIEWER_SPEED_PRESETS.find((entry) => entry.id === id);
    if (preset) onIntervalChange(preset.intervalMs);
  };

  return (
    <aside
      className="talisbooks-viewer__rail talisbooks-viewer__rail--right"
      aria-label="Playback"
    >
      <button
        type="button"
        className="talisbooks-viewer__rail-btn talisbooks-viewer__rail-btn--play"
        onClick={onToggleAutoplay}
        aria-label={autoPlaying ? "Pause" : "Play"}
        title={autoPlaying ? "Pause" : "Play"}
      >
        {autoPlaying ? (
          <Pause className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      <div className="talisbooks-viewer__seconds" role="group" aria-label="Flip speed">
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
            title={preset.label}
          >
            {(preset.intervalMs / 1000).toFixed(preset.intervalMs % 1000 === 0 ? 0 : 1)}s
          </button>
        ))}
      </div>
      <div className="talisbooks-viewer__view-icons" role="group" aria-label="View mode">
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
          title="Spread"
          aria-label="Spread view"
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
          title="Single"
          aria-label="Single page"
        >
          <RectangleVertical className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
