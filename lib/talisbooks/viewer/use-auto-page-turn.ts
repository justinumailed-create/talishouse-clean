"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  clampViewerIntervalMs,
  nextPageIndex,
  previousPageIndex,
  shouldAutoAdvance,
} from "./auto-page-turn";
import { TALISBOOKS_VIEWER_SPEED_DEFAULT_MS } from "./constants";

export interface UseAutoPageTurnOptions {
  pageCount: number;
  initialIndex?: number;
  initialIntervalMs?: number;
  initialAutoPlaying?: boolean;
  /** When false, next/autoplay stop at the last page and invoke onReachEnd. */
  wrap?: boolean;
  onPageChange?: (pageIndex: number) => void;
  onReachEnd?: () => void;
}

export function useAutoPageTurn({
  pageCount,
  initialIndex = 0,
  initialIntervalMs = TALISBOOKS_VIEWER_SPEED_DEFAULT_MS,
  initialAutoPlaying = true,
  wrap = true,
  onPageChange,
  onReachEnd,
}: UseAutoPageTurnOptions) {
  const [pageIndex, setPageIndex] = useState(initialIndex);
  const [autoPlaying, setAutoPlaying] = useState(initialAutoPlaying);
  const [pausedByHover, setPausedByHover] = useState(false);
  const [intervalMs, setIntervalMsState] = useState(() =>
    clampViewerIntervalMs(initialIntervalMs),
  );

  const pageIndexRef = useRef(pageIndex);
  pageIndexRef.current = pageIndex;

  const notifyPageChange = useEffectEvent((index: number) => {
    onPageChange?.(index);
  });

  const notifyReachEnd = useEffectEvent(() => {
    onReachEnd?.();
  });

  const skipInitialNotifyRef = useRef(true);

  useEffect(() => {
    if (skipInitialNotifyRef.current) {
      skipInitialNotifyRef.current = false;
      return;
    }
    notifyPageChange(pageIndex);
  }, [pageIndex]);

  const goTo = (index: number) => {
    if (pageCount <= 0) {
      return;
    }
    const next = ((index % pageCount) + pageCount) % pageCount;
    setPageIndex(next);
  };

  const goNext = () => {
    if (pageCount <= 0) {
      return;
    }
    if (!wrap && pageIndexRef.current >= pageCount - 1) {
      notifyReachEnd();
      return;
    }
    setPageIndex((current) => nextPageIndex(current, pageCount));
  };

  const goPrevious = () => {
    if (pageCount <= 0) {
      return;
    }
    if (!wrap && pageIndexRef.current <= 0) {
      return;
    }
    setPageIndex((current) => previousPageIndex(current, pageCount));
  };

  const setIntervalMs = (value: number) => {
    setIntervalMsState(clampViewerIntervalMs(value));
  };

  useEffect(() => {
    if (!shouldAutoAdvance({ autoPlaying, pausedByHover, pageCount })) {
      return;
    }

    const timer = window.setInterval(() => {
      const current = pageIndexRef.current;
      if (!wrap && current >= pageCount - 1) {
        notifyReachEnd();
        return;
      }
      const next = nextPageIndex(current, pageCount);
      setPageIndex(next);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [autoPlaying, pausedByHover, intervalMs, pageCount, wrap]);

  return {
    pageIndex,
    autoPlaying,
    pausedByHover,
    intervalMs,
    isPaused: pausedByHover || !autoPlaying,
    goTo,
    goNext,
    goPrevious,
    setAutoPlaying,
    setPausedByHover,
    setIntervalMs,
  };
}
