"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import {
  orderedViewerImageUrls,
  warmViewerImages,
} from "@/lib/talisbooks/viewer/image-preloader";
import { TalisBooksViewerPlaybackRail } from "@/components/talisbooks/viewer/TalisBooksViewerRails";
import TalisBooksViewerStage, {
  type TalisBooksViewerBinding,
} from "@/components/talisbooks/viewer/TalisBooksViewerStage";
import { ROUTES } from "@/lib/routes";
import { PINNED_TALISBOOK_SLUG } from "@/lib/talisbooks/library/pinned-catalog";
import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";
import {
  resolveClaimMapsiteId,
  TALISBOOKS_SAMCART_REGISTER_URL,
  talisBooksViewerCta,
  talisBooksViewerShowBack,
} from "@/lib/talisbooks/cta-mode";
import {
  convertViewerNavIndex,
  createEmptyNarrationController,
  enrichCoverPagesWithAgentBranding,
  getViewerSpread,
  getViewerSpreadCount,
  notifyNarrationPageEnter,
  notifyNarrationPageLeave,
  useAutoPageTurn,
  viewerBackToMapsiteHref,
  type TalisBooksNarrationController,
  type TalisBooksViewerBook,
  type TalisBooksViewerViewMode,
} from "@/lib/talisbooks/viewer";
import DemoClaimMarketButton from "@/components/talispros/mapsite/DemoClaimMarketButton";

function TalisBooksViewerRegisterLink() {
  return (
    <a
      href={TALISBOOKS_SAMCART_REGISTER_URL}
      className="talisbooks-viewer__register"
    >
      Continue to register
    </a>
  );
}

function TalisBooksViewerClaimCta({ mapsiteId }: { mapsiteId: string }) {
  return (
    <div className="talisbooks-viewer__claim">
      <DemoClaimMarketButton mapsiteId={mapsiteId} align="end" />
    </div>
  );
}

interface TalisBooksViewerShellProps {
  book: TalisBooksViewerBook;
  /** Reserved for future audio narration — unused in playback today. */
  narration?: TalisBooksNarrationController | null;
}

function withCoverBranding(book: TalisBooksViewerBook): TalisBooksViewerBook {
  return {
    ...book,
    pages: enrichCoverPagesWithAgentBranding(book.pages),
  };
}

export default function TalisBooksViewerShell({
  book: initialBook,
  narration = null,
}: TalisBooksViewerShellProps) {
  const narrationController = narration ?? createEmptyNarrationController();

  const [book, setBook] = useState<TalisBooksViewerBook>(() =>
    withCoverBranding(initialBook),
  );

  useEffect(() => {
    setBook(withCoverBranding(initialBook));
  }, [initialBook]);

  const [viewMode, setViewMode] = useState<TalisBooksViewerViewMode>("spread");
  const viewModeRef = useRef(viewMode);
  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  /** Mobile portrait: CSS-rotate the flipbook stage to landscape for spreads. */
  const [stageLandscape, setStageLandscape] = useState(false);

  const spreadOptions = useMemo(
    () => ({
      coverSpreadOpening: Boolean(book.coverSpreadOpening),
      backCoverImageUrl: book.backCoverImageUrl,
      backCoverTitle: book.title,
    }),
    [book.coverSpreadOpening, book.backCoverImageUrl, book.title],
  );

  const spreadCount = useMemo(
    () => getViewerSpreadCount(book.pages.length),
    [book.pages.length],
  );
  const navCount = useMemo(
    () =>
      viewMode === "single"
        ? Math.max(book.pages.length, 1)
        : Math.max(spreadCount, 1),
    [viewMode, book.pages.length, spreadCount],
  );

  const isMagazine = true;

  const [binding, setBinding] = useState<TalisBooksViewerBinding>(
    isMagazine ? "open" : "closed-front",
  );
  const [direction, setDirection] = useState<1 | -1>(1);
  const previousNavRef = useRef(0);
  const stageHoverRef = useRef(false);
  const flippingRef = useRef(false);
  const goToRef = useRef<(index: number) => void>(() => {});

  const {
    pageIndex: navIndex,
    autoPlaying,
    intervalMs,
    goNext,
    goPrevious,
    goTo,
    setAutoPlaying,
    setPausedByHover,
    setIntervalMs,
  } = useAutoPageTurn({
    pageCount: navCount,
    initialAutoPlaying: false,
    wrap: false,
    onReachEnd: () => {
      setDirection(1);
      setAutoPlaying(false);
      if (isMagazine) {
        goToRef.current(0);
        previousNavRef.current = 0;
        return;
      }
      setBinding("closed-back");
    },
    onPageChange: (nextNavIndex) => {
      const mode = viewModeRef.current;
      if (mode === "spread") {
        const previous = getViewerSpread(
          book.pages,
          previousNavRef.current,
          spreadOptions,
        );
        const next = getViewerSpread(book.pages, nextNavIndex, spreadOptions);
        const leavePage = previous.right ?? previous.left;
        const enterPage = next.left ?? next.right;
        if (leavePage) {
          notifyNarrationPageLeave(narrationController, leavePage.pageNumber);
        }
        if (enterPage) {
          notifyNarrationPageEnter(narrationController, enterPage.pageNumber);
        }
      } else {
        const leavePage = book.pages[previousNavRef.current];
        const enterPage = book.pages[nextNavIndex];
        if (leavePage) {
          notifyNarrationPageLeave(narrationController, leavePage.pageNumber);
        }
        if (enterPage) {
          notifyNarrationPageEnter(narrationController, enterPage.pageNumber);
        }
      }
      previousNavRef.current = nextNavIndex;
    },
  });

  useEffect(() => {
    goToRef.current = goTo;
  }, [goTo]);

  const syncStagePause = () => {
    setPausedByHover(stageHoverRef.current || flippingRef.current);
  };

  const effectiveNavIndex = navIndex;
  const lastNavIndex = Math.max(navCount - 1, 0);
  const spread =
    book.pages.length > 0
      ? getViewerSpread(book.pages, effectiveNavIndex, spreadOptions)
      : { index: 0, left: null, right: null };

  // Faces paint from CSS backgrounds, so an unwarmed page turns into a blank
  // leaf mid-flip. Keep downloads running ahead of wherever the reader is.
  const activePageIndex =
    viewMode === "single"
      ? effectiveNavIndex
      : (spread.left ?? spread.right)
        ? book.pages.indexOf((spread.left ?? spread.right)!)
        : 0;

  useEffect(() => {
    warmViewerImages(orderedViewerImageUrls(book, Math.max(activePageIndex, 0)));
  }, [book, activePageIndex]);

  if (book.pages.length === 0 || spreadCount === 0) {
    return (
      <div className="talisbooks-viewer">
        <p className="talisbooks-viewer__empty">This book has no pages yet.</p>
        {talisBooksViewerCta(book) === "register" ? (
          <TalisBooksViewerRegisterLink />
        ) : (
          <TalisBooksViewerClaimCta
            mapsiteId={resolveClaimMapsiteId(book.mapsiteId)}
          />
        )}
      </div>
    );
  }

  const openBook = (toNav = 0) => {
    setBinding("open");
    setDirection(1);
    goTo(toNav);
    previousNavRef.current = toNav;
  };

  const handleViewModeChange = (nextMode: TalisBooksViewerViewMode) => {
    if (nextMode === viewMode) {
      return;
    }
    const target = convertViewerNavIndex(
      viewMode,
      nextMode,
      effectiveNavIndex,
      book.pages.length,
    );
    setViewMode(nextMode);
    goToRef.current(target);
    previousNavRef.current = target;
  };

  const handleNext = () => {
    if (flippingRef.current) {
      return;
    }
    if (!isMagazine && binding === "closed-front") {
      openBook(0);
      return;
    }
    if (!isMagazine && binding === "closed-back") {
      openBook(lastNavIndex);
      return;
    }
    if (effectiveNavIndex >= lastNavIndex) {
      setDirection(1);
      setAutoPlaying(false);
      if (isMagazine) {
        // Last spread → restart at the front cover.
        goTo(0);
        previousNavRef.current = 0;
        return;
      }
      setBinding("closed-back");
      return;
    }
    setDirection(1);
    setAutoPlaying(false);
    goNext();
  };

  const handlePrevious = () => {
    if (flippingRef.current) {
      return;
    }
    if (!isMagazine && binding === "closed-back") {
      openBook(lastNavIndex);
      return;
    }
    if (!isMagazine && binding === "closed-front") {
      return;
    }
    if (effectiveNavIndex <= 0) {
      setDirection(-1);
      setAutoPlaying(false);
      if (!isMagazine) {
        setBinding("closed-front");
      }
      return;
    }
    setDirection(-1);
    setAutoPlaying(false);
    goPrevious();
  };

  const handleToggleAutoplay = () => {
    if (!isMagazine && binding !== "open") {
      openBook(binding === "closed-back" ? lastNavIndex : 0);
      setAutoPlaying(true);
      return;
    }
    setAutoPlaying((current) => !current);
  };

  const handleOpenBook = () => {
    openBook(binding === "closed-back" ? lastNavIndex : 0);
  };

  const isPinnedShowcase = book.slug === PINNED_TALISBOOK_SLUG;
  const backToMapSiteHref = viewerBackToMapsiteHref(book);
  const surfaceCta = talisBooksViewerCta(book);
  const showBackToMapsite = talisBooksViewerShowBack(book);
  const claimMapsiteId = resolveClaimMapsiteId(book.mapsiteId);

  return (
    <div
      className={[
        "talisbooks-viewer",
        isMagazine ? "talisbooks-viewer--magazine" : "talisbooks-viewer--hardcover",
        stageLandscape ? "talisbooks-viewer--stage-landscape" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="talisbooks-viewer__header">
        <div className="talisbooks-viewer__heading">
          <p className="talisbooks-viewer__eyebrow">
            {isMagazine
              ? book.listingProfile === "fsbo"
                ? "Talisbooks™ FSBO Demo"
                : "Talisbooks™ Magazine"
              : "Talisbooks™ Viewer"}
          </p>
          <h1 className="talisbooks-viewer__title">{book.title}</h1>
          {book.subtitle ? (
            <p className="talisbooks-viewer__subtitle">{book.subtitle}</p>
          ) : null}
        </div>
        <div
          className={[
            "talisbooks-viewer__header-actions",
            isPinnedShowcase ? "talisbooks-viewer__header-actions--matched" : "",
          ].join(" ")}
        >
          {isPinnedShowcase ? (
            <Link href={ROUTES.HOME} className="talisbooks-viewer__back">
              Home
            </Link>
          ) : showBackToMapsite ? (
            <Link href={backToMapSiteHref} className="talisbooks-viewer__back">
              Back to Mapsite™
            </Link>
          ) : null}
          {isPinnedShowcase ? (
            <Link href={ROUTES.CATALOG} className="talisbooks-viewer__back">
              Product
            </Link>
          ) : null}
          {book.pdfDownloadUrl ? (
            <a
              href={book.pdfDownloadUrl}
              download={book.pdfDownloadFileName || true}
              className="talisbooks-viewer__back"
            >
              Download PDF
            </a>
          ) : null}
          {isPinnedShowcase ? (
            <Link href={MAPSITE_APP_PATH} className="talisbooks-viewer__back">
              Markets
            </Link>
          ) : null}
          {isPinnedShowcase ? (
            <Link href={ROUTES.ADMIN_DASHBOARD} className="talisbooks-viewer__back">
              Global Admin
            </Link>
          ) : null}
        </div>
      </header>
      <div className="talisbooks-viewer__layout">
        {/*
          Stage column = every pixel under the navbar + compact header. It is a
          CSS size container: the open book contain-fits it (see globals.css),
          and the rail / orient FAB overlay its corners instead of eating rows.
        */}
        <div className="talisbooks-viewer__stage-column">
          <TalisBooksViewerPlaybackRail
            viewMode={viewMode}
            autoPlaying={autoPlaying}
            intervalMs={intervalMs}
            stageLandscape={stageLandscape}
            onViewModeChange={handleViewModeChange}
            onToggleAutoplay={handleToggleAutoplay}
            onIntervalChange={setIntervalMs}
            onToggleStageLandscape={() => setStageLandscape((current) => !current)}
          />
          <button
            type="button"
            className={[
              "talisbooks-viewer__orient-fab",
              stageLandscape ? "talisbooks-viewer__orient-fab--active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-pressed={stageLandscape}
            onClick={() => setStageLandscape((current) => !current)}
            title={stageLandscape ? "Portrait stage" : "Landscape stage"}
            aria-label={
              stageLandscape
                ? "Return viewer stage to portrait"
                : "Turn viewer stage to landscape"
            }
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            <span>{stageLandscape ? "Portrait" : "Landscape"}</span>
          </button>
          <TalisBooksViewerStage
            book={book}
            binding={isMagazine ? "open" : binding}
            viewMode={viewMode}
            navIndex={effectiveNavIndex}
            navCount={navCount}
            direction={direction}
            magazine={isMagazine}
            onHoverChange={(hovered) => {
              stageHoverRef.current = hovered;
              syncStagePause();
            }}
            onFlippingChange={(flipping) => {
              flippingRef.current = flipping;
              syncStagePause();
            }}
            onRequestNext={handleNext}
            onRequestPrevious={handlePrevious}
            onOpenBook={handleOpenBook}
          />
        </div>
      </div>
      {surfaceCta === "register" ? (
        <TalisBooksViewerRegisterLink />
      ) : (
        <TalisBooksViewerClaimCta mapsiteId={claimMapsiteId} />
      )}
    </div>
  );
}
