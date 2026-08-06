"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "framer-motion";
import TalisBooksPageRenderer from "@/components/talisbooks/viewer/TalisBooksPageRenderer";
import {
  TALISBOOKS_VIEWER_DRAG_THRESHOLD_PX,
  TALISBOOKS_VIEWER_FLIP_COMMIT_PROGRESS,
  TALISBOOKS_VIEWER_LONG_PRESS_MS,
  TALISBOOKS_VIEWER_SINGLE_DRAG_THRESHOLD_PX,
  TALISBOOKS_VIEWER_SINGLE_FLIP_COMMIT_PROGRESS,
  TALISBOOKS_VIEWER_SINGLE_FLIP_COMMIT_VELOCITY,
  TALISBOOKS_VIEWER_SINGLE_TURN_DURATION_MS,
  TALISBOOKS_VIEWER_TURN_DURATION_MS,
  describeViewerPage,
  describeViewerSpread,
  getViewerSpread,
  playViewerFlipSound,
  type TalisBooksViewerBook,
  type TalisBooksViewerPage,
  type TalisBooksViewerSpread,
  type TalisBooksViewerViewMode,
} from "@/lib/talisbooks/viewer";

export type TalisBooksViewerBinding = "closed-front" | "open" | "closed-back";

interface TalisBooksViewerStageProps {
  book: TalisBooksViewerBook;
  binding: TalisBooksViewerBinding;
  viewMode: TalisBooksViewerViewMode;
  navIndex: number;
  navCount: number;
  direction: 1 | -1;
  /** Issuu soft-cover magazine: no hardcover spine / closed case. */
  magazine?: boolean;
  onHoverChange: (hovered: boolean) => void;
  onFlippingChange?: (flipping: boolean) => void;
  onRequestNext: () => void;
  onRequestPrevious: () => void;
  onOpenBook: () => void;
}

const FLIP_EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

function SoftBlank({ side }: { side: "left" | "right" }) {
  /* Placeholder only for flip geometry; solo cover/back CSS collapses the empty leaf. */
  return (
    <div
      className={[
        "talisbooks-viewer-page",
        "talisbooks-viewer-page--soft-blank",
        side === "left"
          ? "talisbooks-viewer-page--soft-blank-left"
          : "talisbooks-viewer-page--soft-blank-right",
      ].join(" ")}
      aria-hidden="true"
    />
  );
}

function Endpaper({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={[
        "talisbooks-viewer-page",
        "talisbooks-viewer-page--endpaper",
        side === "left"
          ? "talisbooks-viewer-page--endpaper-left"
          : "talisbooks-viewer-page--endpaper-right",
      ].join(" ")}
      aria-hidden="true"
    />
  );
}

function BookPageFace({
  page,
  side,
  magazine = false,
}: {
  page: TalisBooksViewerPage | null;
  side: "left" | "right";
  magazine?: boolean;
}) {
  if (!page) {
    return magazine ? <SoftBlank side={side} /> : <Endpaper side={side} />;
  }

  const darkFolio =
    page.pageRole === "cover" ||
    page.layout === "full_bleed" ||
    page.layout === "centerfold_left" ||
    page.layout === "centerfold_right" ||
    page.layout === "parting" ||
    page.layout === "cover" ||
    page.layout === "maps";

  return (
    <div className={`talisbooks-viewer-book__face talisbooks-viewer-book__face--${side}`}>
      <TalisBooksPageRenderer page={page} />
      <span
        className={[
          "talisbooks-viewer-stage__folio",
          darkFolio ? "talisbooks-viewer-stage__folio--light" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden="true"
      >
        {page.pageNumber}
      </span>
    </div>
  );
}

/**
 * Flat spine hinge turn — no corner curl.
 * 0→50%: outgoing page folds to the gutter; 50→100%: incoming unfolds.
 */
function FlipLeaf({
  direction,
  front,
  back,
  progress,
  magazine = false,
}: {
  direction: 1 | -1;
  front: TalisBooksViewerPage | null;
  back: TalisBooksViewerPage | null;
  progress: MotionValue<number>;
  magazine?: boolean;
}) {
  const forward = direction > 0;

  const outgoingRotateY = useTransform(
    progress,
    [0, 0.5, 1],
    forward ? [0, -90, -90] : [0, 90, 90],
  );
  const incomingRotateY = useTransform(
    progress,
    [0, 0.5, 1],
    forward ? [90, 90, 0] : [-90, -90, 0],
  );
  const outgoingOpacity = useTransform(progress, [0, 0.48, 0.52, 1], [1, 1, 0, 0]);
  const incomingOpacity = useTransform(progress, [0, 0.48, 0.52, 1], [0, 0, 1, 1]);
  const shade = useTransform(progress, [0, 0.35, 0.7, 1], [0.1, 0.42, 0.28, 0.06]);

  return (
    <>
      <motion.div
        className={[
          "talisbooks-viewer-book__leaf",
          forward
            ? "talisbooks-viewer-book__leaf--fwd-out"
            : "talisbooks-viewer-book__leaf--bwd-out",
        ].join(" ")}
        style={{
          transformStyle: "preserve-3d",
          rotateY: outgoingRotateY,
          opacity: outgoingOpacity,
        }}
      >
        <div className="talisbooks-viewer-book__leaf-face">
          <BookPageFace page={front} side={forward ? "right" : "left"} magazine={magazine} />
          <motion.span
            className={[
              "talisbooks-viewer-book__leaf-shade",
              forward ? "" : "talisbooks-viewer-book__leaf-shade--rtl",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ opacity: shade }}
            aria-hidden="true"
          />
        </div>
      </motion.div>

      <motion.div
        className={[
          "talisbooks-viewer-book__leaf",
          forward
            ? "talisbooks-viewer-book__leaf--fwd-in"
            : "talisbooks-viewer-book__leaf--bwd-in",
        ].join(" ")}
        style={{
          transformStyle: "preserve-3d",
          rotateY: incomingRotateY,
          opacity: incomingOpacity,
        }}
      >
        <div className="talisbooks-viewer-book__leaf-face">
          <BookPageFace page={back} side={forward ? "left" : "right"} magazine={magazine} />
          <motion.span
            className={[
              "talisbooks-viewer-book__leaf-shade",
              forward ? "talisbooks-viewer-book__leaf-shade--rtl" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ opacity: shade }}
            aria-hidden="true"
          />
        </div>
      </motion.div>
    </>
  );
}

/** Single-page flat hinge peel. */
function SingleFlipLeaf({
  direction,
  page,
  progress,
  magazine = false,
}: {
  direction: 1 | -1;
  page: TalisBooksViewerPage | null;
  progress: MotionValue<number>;
  magazine?: boolean;
}) {
  const forward = direction > 0;
  const rotateY = useTransform(progress, [0, 1], forward ? [0, -118] : [0, 118]);
  const opacity = useTransform(progress, [0, 0.72, 1], [1, 1, 0]);
  const shade = useTransform(progress, [0, 0.35, 0.75, 1], [0.06, 0.4, 0.28, 0.1]);

  return (
    <motion.div
      className={[
        "talisbooks-viewer-book__leaf",
        "talisbooks-viewer-book__leaf--single",
        forward
          ? "talisbooks-viewer-book__leaf--single-fwd"
          : "talisbooks-viewer-book__leaf--single-bwd",
      ].join(" ")}
      style={{
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
        rotateY,
        opacity,
      }}
    >
      <div className="talisbooks-viewer-book__leaf-face talisbooks-viewer-book__leaf-face--single">
        <BookPageFace page={page} side={forward ? "right" : "left"} magazine={magazine} />
        <motion.span
          className={[
            "talisbooks-viewer-book__leaf-shade",
            forward ? "" : "talisbooks-viewer-book__leaf-shade--rtl",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ opacity: shade }}
          aria-hidden="true"
        />
      </div>
    </motion.div>
  );
}

function resolveFrontCoverUrl(book: TalisBooksViewerBook): string {
  if (!book) {
    return "";
  }
  if (book.frontCoverImageUrl) {
    return book.frontCoverImageUrl;
  }
  const cover = book.pages?.find((page) => page.pageRole === "cover");
  return cover?.heroImageUrl ?? "";
}

function resolveBackCoverUrl(book: TalisBooksViewerBook): string {
  if (!book?.pages?.length) {
    return resolveFrontCoverUrl(book);
  }
  if (book.backCoverImageUrl) {
    return book.backCoverImageUrl;
  }
  const property = [...book.pages]
    .reverse()
    .find((page) => page.pageRole === "property_content" && page.heroImageUrl);
  return property?.heroImageUrl ?? resolveFrontCoverUrl(book);
}

function ClosedHardCover({
  side,
  title,
  subtitle,
  imageUrl,
  onOpen,
}: {
  side: "front" | "back";
  title: string;
  subtitle?: string;
  imageUrl: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className={[
        "talisbooks-viewer-hardcover",
        side === "front"
          ? "talisbooks-viewer-hardcover--front"
          : "talisbooks-viewer-hardcover--back",
      ].join(" ")}
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return;
        }
        event.preventDefault();
        onOpen();
      }}
      onClick={(event) => {
        event.preventDefault();
        onOpen();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      aria-label={side === "front" ? `Open ${title}` : `Reopen ${title}`}
    >
      <span className="talisbooks-viewer-hardcover__cast" aria-hidden="true" />
      <span className="talisbooks-viewer-hardcover__case" aria-hidden="true">
        <span className="talisbooks-viewer-hardcover__board" />
        <span className="talisbooks-viewer-hardcover__rim" />
        <span className="talisbooks-viewer-hardcover__edge talisbooks-viewer-hardcover__edge--top" />
        <span className="talisbooks-viewer-hardcover__edge talisbooks-viewer-hardcover__edge--fore" />
        <span className="talisbooks-viewer-hardcover__edge talisbooks-viewer-hardcover__edge--bottom" />
        <span className="talisbooks-viewer-hardcover__spine">
          <span className="talisbooks-viewer-hardcover__spine-ridge" />
        </span>
        <span className="talisbooks-viewer-hardcover__block">
          <span className="talisbooks-viewer-hardcover__block-sheet talisbooks-viewer-hardcover__block-sheet--a" />
          <span className="talisbooks-viewer-hardcover__block-sheet talisbooks-viewer-hardcover__block-sheet--b" />
          <span className="talisbooks-viewer-hardcover__block-face" />
          <span className="talisbooks-viewer-hardcover__block-top" />
          <span className="talisbooks-viewer-hardcover__block-bottom" />
        </span>
      </span>
      <span className="talisbooks-viewer-hardcover__wrap">
        <span
          className="talisbooks-viewer-hardcover__art"
          style={
            imageUrl
              ? { backgroundImage: `url(${imageUrl})` }
              : {
                  backgroundImage:
                    "linear-gradient(145deg, #1c1917 0%, #44403c 48%, #a8a29e 100%)",
                }
          }
        />
        <span className="talisbooks-viewer-hardcover__grain" aria-hidden="true" />
        <span className="talisbooks-viewer-hardcover__sheen" aria-hidden="true" />
        <span className="talisbooks-viewer-hardcover__copy">
          <span className="talisbooks-viewer-hardcover__title">{title}</span>
          {subtitle ? (
            <span className="talisbooks-viewer-hardcover__subtitle">{subtitle}</span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

type GestureSide = "left" | "right";

function OpenBookSpread({
  book,
  navIndex,
  navCount,
  direction,
  magazine = false,
  onRequestNext,
  onRequestPrevious,
  onFlippingChange,
}: {
  book: TalisBooksViewerBook;
  navIndex: number;
  navCount: number;
  direction: 1 | -1;
  magazine?: boolean;
  onRequestNext: () => void;
  onRequestPrevious: () => void;
  onFlippingChange?: (flipping: boolean) => void;
}) {
  const [displayedIndex, setDisplayedIndex] = useState(navIndex);
  const [flip, setFlip] = useState<{
    from: number;
    to: number;
    direction: 1 | -1;
    mode: "program" | "gesture";
  } | null>(null);
  const [grabbing, setGrabbing] = useState(false);

  const flipProgress = useMotionValue(0);
  const targetNavRef = useRef(navIndex);
  const busyRef = useRef(false);
  const gestureRef = useRef<{
    side: GestureSide;
    direction: 1 | -1;
    startX: number;
    pointerId: number;
    dragging: boolean;
    longPressTimer: number | null;
  } | null>(null);
  const spreadWidthRef = useRef(420);
  const spreadNodeRef = useRef<HTMLDivElement | null>(null);

  targetNavRef.current = navIndex;

  const notifyFlipping = (active: boolean) => {
    busyRef.current = active;
    onFlippingChange?.(active);
  };

  const clearGestureTimers = () => {
    const gesture = gestureRef.current;
    if (gesture?.longPressTimer != null) {
      window.clearTimeout(gesture.longPressTimer);
      gesture.longPressTimer = null;
    }
  };

  const finishProgramFlip = () => {
    setDisplayedIndex(targetNavRef.current);
    setFlip(null);
    flipProgress.set(0);
    notifyFlipping(false);
  };

  useEffect(() => {
    if (navIndex === displayedIndex) {
      return;
    }

    if (gestureRef.current?.dragging) {
      return;
    }

    // Last → first wrap jumps to the front cover (no reverse leaf flip).
    if (magazine && displayedIndex === navCount - 1 && navIndex === 0) {
      setDisplayedIndex(0);
      flipProgress.set(0);
      notifyFlipping(false);
      return;
    }

    const flipDirection = direction;
    setFlip({
      from: displayedIndex,
      to: navIndex,
      direction: flipDirection,
      mode: "program",
    });
    flipProgress.set(0);
    notifyFlipping(true);
    playViewerFlipSound();

    const controls = animate(flipProgress, 1, {
      duration: TALISBOOKS_VIEWER_TURN_DURATION_MS / 1000,
      ease: FLIP_EASE,
    });

    const timer = window.setTimeout(() => {
      finishProgramFlip();
    }, TALISBOOKS_VIEWER_TURN_DURATION_MS);

    return () => {
      controls.stop();
      window.clearTimeout(timer);
    };
    // Intentionally depend on navIndex changes for programmatic turns.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navIndex, direction]);

  const beginGestureFlip = (side: GestureSide, flipDirection: 1 | -1) => {
    if (busyRef.current) {
      return;
    }

    const to =
      flipDirection > 0
        ? Math.min(displayedIndex + 1, navCount - 1)
        : Math.max(displayedIndex - 1, 0);

    setFlip({
      from: displayedIndex,
      to,
      direction: flipDirection,
      mode: "gesture",
    });

    flipProgress.set(0);
    notifyFlipping(true);
    setGrabbing(true);
  };

  const cancelGestureFlip = () => {
    clearGestureTimers();
    gestureRef.current = null;
    setGrabbing(false);

    if (!flip || flip.mode !== "gesture") {
      return;
    }

    const controls = animate(flipProgress, 0, {
      duration: 0.28,
      ease: FLIP_EASE,
    });
    window.setTimeout(() => {
      controls.stop();
      setFlip(null);
      flipProgress.set(0);
      notifyFlipping(false);
    }, 300);
  };

  const commitGestureFlip = () => {
    clearGestureTimers();
    const activeFlip = flip;
    gestureRef.current = null;
    setGrabbing(false);

    if (!activeFlip || activeFlip.mode !== "gesture") {
      return;
    }

    if (activeFlip.to === activeFlip.from) {
      // Already at first/last spread — close the hard cover.
      setFlip(null);
      flipProgress.set(0);
      notifyFlipping(false);
      if (activeFlip.direction > 0) {
        onRequestNext();
      } else {
        onRequestPrevious();
      }
      return;
    }

    playViewerFlipSound();
    const remaining = Math.max(0.18, 1 - flipProgress.get());
    animate(flipProgress, 1, {
      duration: remaining * (TALISBOOKS_VIEWER_TURN_DURATION_MS / 1000),
      ease: FLIP_EASE,
    });

    window.setTimeout(() => {
      // Sync local index first so the parent update does not re-trigger a program flip.
      setDisplayedIndex(activeFlip.to);
      setFlip(null);
      flipProgress.set(0);
      notifyFlipping(false);
      if (activeFlip.direction > 0) {
        onRequestNext();
      } else {
        onRequestPrevious();
      }
    }, remaining * TALISBOOKS_VIEWER_TURN_DURATION_MS + 20);
  };

  const updateGestureProgress = (clientX: number) => {
    const gesture = gestureRef.current;
    if (!gesture?.dragging || !flip) {
      return;
    }

    const width = Math.max(spreadWidthRef.current * 0.45, 160);
    const delta = clientX - gesture.startX;
    // Forward (right page): drag left → positive progress.
    // Backward (left page): drag right → positive progress.
    const raw =
      gesture.direction > 0 ? Math.max(0, -delta) / width : Math.max(0, delta) / width;
    flipProgress.set(Math.min(1, raw));
  };

  const onHitPointerDown = (side: GestureSide) => (event: ReactPointerEvent) => {
    if (event.button !== 0 || busyRef.current) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const bounds = spreadNodeRef.current?.getBoundingClientRect();
    if (bounds) {
      spreadWidthRef.current = bounds.width;
    }

    const flipDirection: 1 | -1 = side === "right" ? 1 : -1;
    gestureRef.current = {
      side,
      direction: flipDirection,
      startX: event.clientX,
      pointerId: event.pointerId,
      dragging: false,
      longPressTimer: window.setTimeout(() => {
        const current = gestureRef.current;
        if (!current || current.pointerId !== event.pointerId) {
          return;
        }
        current.dragging = true;
        beginGestureFlip(side, flipDirection);
      }, TALISBOOKS_VIEWER_LONG_PRESS_MS),
    };
  };

  const onHitPointerMove = (event: ReactPointerEvent) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }

    const distance = Math.abs(event.clientX - gesture.startX);
    if (!gesture.dragging && distance >= TALISBOOKS_VIEWER_DRAG_THRESHOLD_PX) {
      clearGestureTimers();
      gesture.dragging = true;
      beginGestureFlip(gesture.side, gesture.direction);
    }

    if (gesture.dragging) {
      updateGestureProgress(event.clientX);
    }
  };

  const onHitPointerUp = (event: ReactPointerEvent) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }

    if (!gesture.dragging) {
      // Short click / tap: right advances (wraps to cover on last spread), left goes back.
      const clickedSide = gesture.side;
      clearGestureTimers();
      gestureRef.current = null;
      if (clickedSide === "right") {
        onRequestNext();
      } else {
        onRequestPrevious();
      }
      return;
    }

    const progress = flipProgress.get();
    if (progress >= TALISBOOKS_VIEWER_FLIP_COMMIT_PROGRESS) {
      commitGestureFlip();
    } else {
      cancelGestureFlip();
    }
  };

  const onHitPointerCancel = () => {
    if (gestureRef.current?.dragging) {
      cancelGestureFlip();
    } else {
      clearGestureTimers();
      gestureRef.current = null;
    }
  };

  const current = getViewerSpread(book.pages, displayedIndex);
  const incoming = flip ? getViewerSpread(book.pages, flip.to) : null;
  const flipping = Boolean(flip && incoming);
  const forward = (flip?.direction ?? direction) > 0;

  const leftPage = flipping
    ? forward
      ? current.left
      : incoming!.left
    : current.left;
  const rightPage = flipping
    ? forward
      ? incoming!.right
      : current.right
    : current.right;

  const flipFront = forward ? current.right : current.left;
  const flipBack = forward ? incoming?.left ?? null : incoming?.right ?? null;
  const labelSpread: TalisBooksViewerSpread =
    flipping && incoming && flip && flip.to !== flip.from ? incoming : current;

  const soloRight = !labelSpread.left && Boolean(labelSpread.right);
  const soloLeft = Boolean(labelSpread.left) && !labelSpread.right;

  return (
    <>
      <motion.div
        className={[
          "talisbooks-viewer-book",
          magazine ? "talisbooks-viewer-book--magazine" : "",
          magazine && soloRight ? "talisbooks-viewer-book--solo-right" : "",
          magazine && soloLeft ? "talisbooks-viewer-book--solo-left" : "",
          grabbing ? "talisbooks-viewer-book--grabbing" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={magazine ? "Open magazine" : "Open book"}
        initial={{ opacity: 0.7, rotateY: -8, scale: 0.96 }}
        animate={{ opacity: 1, rotateY: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {magazine ? null : (
          <>
            <div className="talisbooks-viewer-book__edge talisbooks-viewer-book__edge--left" />
            <div className="talisbooks-viewer-book__edge talisbooks-viewer-book__edge--right" />
          </>
        )}
        <div className="talisbooks-viewer-book__shadow" aria-hidden="true" />

        <div className="talisbooks-viewer-book__spread" ref={spreadNodeRef}>
          <div
            role="presentation"
            className="talisbooks-viewer-book__hit talisbooks-viewer-book__hit--left"
            aria-hidden="true"
            onPointerDown={onHitPointerDown("left")}
            onPointerMove={onHitPointerMove}
            onPointerUp={onHitPointerUp}
            onPointerCancel={onHitPointerCancel}
          />
          <div
            role="presentation"
            className="talisbooks-viewer-book__hit talisbooks-viewer-book__hit--right"
            aria-hidden="true"
            onPointerDown={onHitPointerDown("right")}
            onPointerMove={onHitPointerMove}
            onPointerUp={onHitPointerUp}
            onPointerCancel={onHitPointerCancel}
          />

          <div className="talisbooks-viewer-book__page talisbooks-viewer-book__page--left">
            <BookPageFace page={leftPage} side="left" magazine={magazine} />
          </div>

          <div className="talisbooks-viewer-book__gutter" aria-hidden="true" />

          <div className="talisbooks-viewer-book__page talisbooks-viewer-book__page--right">
            <BookPageFace page={rightPage} side="right" magazine={magazine} />
          </div>

          <AnimatePresence>
            {flipping ? (
              <FlipLeaf
                key={`${flip!.from}-${flip!.to}-${flip!.direction}-${flip!.mode}`}
                direction={flip!.direction}
                front={flipFront}
                back={flipBack}
                progress={flipProgress}
                magazine={magazine}
              />
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>

      <p className="talisbooks-viewer-stage__hint" aria-live="polite">
        Click right to advance · click left to go back · {describeViewerSpread(labelSpread)} · Spread{" "}
        {Math.min(displayedIndex, navCount - 1) + 1} of {navCount}
      </p>
    </>
  );
}

function OpenBookSingle({
  book,
  navIndex,
  navCount,
  direction,
  magazine = false,
  onRequestNext,
  onRequestPrevious,
  onFlippingChange,
}: {
  book: TalisBooksViewerBook;
  navIndex: number;
  navCount: number;
  direction: 1 | -1;
  magazine?: boolean;
  onRequestNext: () => void;
  onRequestPrevious: () => void;
  onFlippingChange?: (flipping: boolean) => void;
}) {
  const [displayedIndex, setDisplayedIndex] = useState(navIndex);
  const [flip, setFlip] = useState<{
    from: number;
    to: number;
    direction: 1 | -1;
    mode: "program" | "gesture";
  } | null>(null);
  const [grabbing, setGrabbing] = useState(false);

  const flipProgress = useMotionValue(0);
  const targetNavRef = useRef(navIndex);
  const busyRef = useRef(false);
  const flipRef = useRef(flip);
  flipRef.current = flip;
  const pageWidthRef = useRef(320);
  const pageNodeRef = useRef<HTMLDivElement | null>(null);
  const gestureRef = useRef<{
    startX: number;
    startY: number;
    pointerId: number;
    dragging: boolean;
    direction: 1 | -1 | null;
    lastX: number;
    lastT: number;
    velocityX: number;
  } | null>(null);

  targetNavRef.current = navIndex;

  const notifyFlipping = (active: boolean) => {
    busyRef.current = active;
    onFlippingChange?.(active);
  };

  const finishProgramFlip = () => {
    setDisplayedIndex(targetNavRef.current);
    flipRef.current = null;
    setFlip(null);
    flipProgress.set(0);
    notifyFlipping(false);
  };

  useEffect(() => {
    if (navIndex === displayedIndex) {
      return;
    }
    if (gestureRef.current?.dragging) {
      return;
    }

    // Last → first wrap jumps to the front cover (no reverse leaf flip).
    if (magazine && displayedIndex === navCount - 1 && navIndex === 0) {
      setDisplayedIndex(0);
      flipRef.current = null;
      setFlip(null);
      flipProgress.set(0);
      notifyFlipping(false);
      return;
    }

    const nextFlip = {
      from: displayedIndex,
      to: navIndex,
      direction,
      mode: "program" as const,
    };
    flipRef.current = nextFlip;
    setFlip(nextFlip);
    flipProgress.set(0);
    notifyFlipping(true);
    playViewerFlipSound();

    const controls = animate(flipProgress, 1, {
      duration: TALISBOOKS_VIEWER_SINGLE_TURN_DURATION_MS / 1000,
      ease: FLIP_EASE,
    });

    const timer = window.setTimeout(() => {
      finishProgramFlip();
    }, TALISBOOKS_VIEWER_SINGLE_TURN_DURATION_MS);

    return () => {
      controls.stop();
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navIndex, direction]);

  const beginGestureFlip = (flipDirection: 1 | -1) => {
    if (busyRef.current) {
      return;
    }

    const to =
      flipDirection > 0
        ? Math.min(displayedIndex + 1, navCount - 1)
        : Math.max(displayedIndex - 1, 0);

    const nextFlip = {
      from: displayedIndex,
      to,
      direction: flipDirection,
      mode: "gesture" as const,
    };
    flipRef.current = nextFlip;
    setFlip(nextFlip);
    flipProgress.set(0);
    notifyFlipping(true);
    setGrabbing(true);
  };

  const cancelGestureFlip = () => {
    gestureRef.current = null;
    setGrabbing(false);

    if (!flipRef.current || flipRef.current.mode !== "gesture") {
      return;
    }

    const controls = animate(flipProgress, 0, {
      duration: 0.22,
      ease: FLIP_EASE,
    });
    window.setTimeout(() => {
      controls.stop();
      flipRef.current = null;
      setFlip(null);
      flipProgress.set(0);
      notifyFlipping(false);
    }, 240);
  };

  const commitGestureFlip = () => {
    const activeFlip = flipRef.current;
    gestureRef.current = null;
    setGrabbing(false);

    if (!activeFlip || activeFlip.mode !== "gesture") {
      return;
    }

    if (activeFlip.to === activeFlip.from) {
      // Already at first/last page — close the hard cover.
      flipRef.current = null;
      setFlip(null);
      flipProgress.set(0);
      notifyFlipping(false);
      if (activeFlip.direction > 0) {
        onRequestNext();
      } else {
        onRequestPrevious();
      }
      return;
    }

    playViewerFlipSound();
    const remaining = Math.max(0.12, 1 - flipProgress.get());
    animate(flipProgress, 1, {
      duration: remaining * (TALISBOOKS_VIEWER_SINGLE_TURN_DURATION_MS / 1000),
      ease: FLIP_EASE,
    });

    window.setTimeout(() => {
      setDisplayedIndex(activeFlip.to);
      flipRef.current = null;
      setFlip(null);
      flipProgress.set(0);
      notifyFlipping(false);
      if (activeFlip.direction > 0) {
        onRequestNext();
      } else {
        onRequestPrevious();
      }
    }, remaining * TALISBOOKS_VIEWER_SINGLE_TURN_DURATION_MS + 16);
  };

  const updateGestureProgress = (clientX: number) => {
    const gesture = gestureRef.current;
    if (!gesture?.dragging || gesture.direction == null) {
      return;
    }

    const width = Math.max(pageWidthRef.current * 0.92, 180);
    const delta = clientX - gesture.startX;
    const raw =
      gesture.direction > 0 ? Math.max(0, -delta) / width : Math.max(0, delta) / width;
    // Soft rubber-band past full swipe.
    const eased = raw <= 1 ? raw : 1 + (raw - 1) * 0.12;
    flipProgress.set(Math.min(1.08, eased));
  };

  const onHitPointerDown = (event: ReactPointerEvent) => {
    if (event.button !== 0 || busyRef.current) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const bounds = pageNodeRef.current?.getBoundingClientRect();
    if (bounds) {
      pageWidthRef.current = bounds.width;
    }

    const now = performance.now();
    gestureRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      pointerId: event.pointerId,
      dragging: false,
      direction: null,
      lastX: event.clientX,
      lastT: now,
      velocityX: 0,
    };
  };

  const onHitPointerMove = (event: ReactPointerEvent) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }

    const now = performance.now();
    const dt = Math.max(1, now - gesture.lastT);
    gesture.velocityX = (event.clientX - gesture.lastX) / dt;
    gesture.lastX = event.clientX;
    gesture.lastT = now;

    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    const distance = Math.hypot(dx, dy);

    if (!gesture.dragging && distance >= TALISBOOKS_VIEWER_SINGLE_DRAG_THRESHOLD_PX) {
      // Prefer horizontal intent; ignore mostly-vertical scrapes.
      if (Math.abs(dx) < Math.abs(dy) * 0.65) {
        return;
      }
      const flipDirection: 1 | -1 = dx < 0 ? 1 : -1;
      gesture.dragging = true;
      gesture.direction = flipDirection;
      beginGestureFlip(flipDirection);
    }

    if (gesture.dragging) {
      updateGestureProgress(event.clientX);
    }
  };

  const onHitPointerUp = (event: ReactPointerEvent) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }

    if (!gesture.dragging) {
      gestureRef.current = null;
      return;
    }

    const progress = Math.min(1, flipProgress.get());
    const velocity = gesture.velocityX;
    const towardCommit =
      gesture.direction != null &&
      ((gesture.direction > 0 && velocity < 0) ||
        (gesture.direction < 0 && velocity > 0));
    const flickCommit =
      towardCommit &&
      Math.abs(velocity) >= TALISBOOKS_VIEWER_SINGLE_FLIP_COMMIT_VELOCITY &&
      progress >= 0.08;

    if (progress >= TALISBOOKS_VIEWER_SINGLE_FLIP_COMMIT_PROGRESS || flickCommit) {
      commitGestureFlip();
    } else {
      cancelGestureFlip();
    }
  };

  const onHitPointerCancel = () => {
    if (gestureRef.current?.dragging) {
      cancelGestureFlip();
    } else {
      gestureRef.current = null;
    }
  };

  const currentPage = book.pages[displayedIndex] ?? null;
  const incomingPage = flip ? (book.pages[flip.to] ?? null) : null;
  const flipping = Boolean(flip);
  const forward = (flip?.direction ?? direction) > 0;
  const basePage = flipping ? incomingPage : currentPage;
  const leafPage = flipping ? currentPage : null;
  const labelPage =
    flipping && incomingPage && flip && flip.to !== flip.from
      ? incomingPage
      : currentPage;

  return (
    <>
      <motion.div
        className={[
          "talisbooks-viewer-book",
          "talisbooks-viewer-book--single",
          magazine ? "talisbooks-viewer-book--magazine" : "",
          grabbing ? "talisbooks-viewer-book--grabbing" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={magazine ? "Open magazine · single page" : "Open book · single page"}
        initial={{ opacity: 0.7, rotateY: -6, scale: 0.96 }}
        animate={{ opacity: 1, rotateY: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {magazine ? null : (
          <>
            <div className="talisbooks-viewer-book__edge talisbooks-viewer-book__edge--left" />
            <div className="talisbooks-viewer-book__edge talisbooks-viewer-book__edge--right" />
          </>
        )}
        <div className="talisbooks-viewer-book__shadow" aria-hidden="true" />

        <div className="talisbooks-viewer-book__single" ref={pageNodeRef}>
          <div
            role="presentation"
            className="talisbooks-viewer-book__hit talisbooks-viewer-book__hit--single"
            aria-hidden="true"
            onPointerDown={onHitPointerDown}
            onPointerMove={onHitPointerMove}
            onPointerUp={onHitPointerUp}
            onPointerCancel={onHitPointerCancel}
          />

          <div className="talisbooks-viewer-book__page talisbooks-viewer-book__page--single">
            <BookPageFace
              page={basePage}
              side={forward ? "left" : "right"}
              magazine={magazine}
            />
          </div>

          <AnimatePresence>
            {flipping ? (
              <SingleFlipLeaf
                key={`${flip!.from}-${flip!.to}-${flip!.direction}-${flip!.mode}`}
                direction={flip!.direction}
                page={leafPage}
                progress={flipProgress}
                magazine={magazine}
              />
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>

      <p className="talisbooks-viewer-stage__hint" aria-live="polite">
        Swipe to turn · {describeViewerPage(labelPage)} ·{" "}
        {Math.min(displayedIndex, navCount - 1) + 1} of {navCount}
      </p>
    </>
  );
}

export default function TalisBooksViewerStage({
  book,
  binding,
  viewMode,
  navIndex,
  navCount,
  direction,
  magazine = false,
  onHoverChange,
  onFlippingChange,
  onRequestNext,
  onRequestPrevious,
  onOpenBook,
}: TalisBooksViewerStageProps) {
  const frontUrl = resolveFrontCoverUrl(book);
  const backUrl = resolveBackCoverUrl(book);

  return (
    <div
      className={[
        "talisbooks-viewer-stage",
        binding === "open"
          ? "talisbooks-viewer-stage--open"
          : "talisbooks-viewer-stage--closed",
        viewMode === "single" ? "talisbooks-viewer-stage--single" : "",
        magazine ? "talisbooks-viewer-stage--magazine" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onPointerEnter={() => onHoverChange(true)}
      onPointerLeave={() => onHoverChange(false)}
      onFocusCapture={() => onHoverChange(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          onHoverChange(false);
        }
      }}
    >
      <div className="talisbooks-viewer-stage__desk">
        <div className="talisbooks-viewer-stage__perspective">
          <AnimatePresence mode="wait">
            {!magazine && binding === "closed-front" ? (
              <motion.div
                key="closed-front"
                className="talisbooks-viewer-stage__closed"
                initial={{ opacity: 0, rotateY: 12, scale: 0.94 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: -28, scale: 0.92 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <ClosedHardCover
                  side="front"
                  title={book.title}
                  subtitle={book.subtitle}
                  imageUrl={frontUrl}
                  onOpen={onOpenBook}
                />
                <p className="talisbooks-viewer-stage__hint">
                  Closed hardcover · Click to open
                </p>
              </motion.div>
            ) : null}

            {!magazine && binding === "closed-back" ? (
              <motion.div
                key="closed-back"
                className="talisbooks-viewer-stage__closed"
                initial={{ opacity: 0, rotateY: -12, scale: 0.94 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: 28, scale: 0.92 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <ClosedHardCover
                  side="back"
                  title={book.title}
                  subtitle={book.subtitle}
                  imageUrl={backUrl}
                  onOpen={onOpenBook}
                />
                <p className="talisbooks-viewer-stage__hint">
                  Closed hardcover · Click to reopen
                </p>
              </motion.div>
            ) : null}

            {binding === "open" || magazine ? (
              <motion.div
                key={`open-book-${viewMode}`}
                className="talisbooks-viewer-stage__open"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                {viewMode === "single" ? (
                  <OpenBookSingle
                    book={book}
                    navIndex={navIndex}
                    navCount={navCount}
                    direction={direction}
                    magazine={magazine}
                    onRequestNext={onRequestNext}
                    onRequestPrevious={onRequestPrevious}
                    onFlippingChange={onFlippingChange}
                  />
                ) : (
                  <OpenBookSpread
                    book={book}
                    navIndex={navIndex}
                    navCount={navCount}
                    direction={direction}
                    magazine={magazine}
                    onRequestNext={onRequestNext}
                    onRequestPrevious={onRequestPrevious}
                    onFlippingChange={onFlippingChange}
                  />
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
